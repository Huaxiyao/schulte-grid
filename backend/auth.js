import crypto from 'node:crypto';

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
export function newSalt() {
  return crypto.randomBytes(16).toString('hex');
}
function uid() {
  return crypto.randomBytes(24).toString('hex');
}
const USER_RE = /^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/;
export function validUser(u) { return USER_RE.test(u); }
export function validPass(p) { return typeof p === 'string' && p.length >= 4 && p.length <= 64; }
export function verifyPassword(password, salt, hash) {
  const expect = hashPassword(password, salt);
  return expect.length === hash.length
    && crypto.timingSafeEqual(Buffer.from(expect, 'hex'), Buffer.from(hash, 'hex'));
}

const SESSION_DAYS = 30;
const RENEW_BEFORE_MS = 15 * 24 * 3600 * 1000; // 剩余不足 15 天时滑动续期

export function createAuth(db) {
  const stmtClean = db.prepare(
    'DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at <= datetime(\'now\')'
  );
  const stmtFind = db.prepare(
    'SELECT username, expires_at FROM sessions WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime(\'now\'))'
  );
  const stmtInsert = db.prepare(
    `INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`
  );
  const stmtRenew = db.prepare(
    `UPDATE sessions SET expires_at = datetime('now', '+${SESSION_DAYS} days') WHERE token = ?`
  );

  // 过期会话由登录/注册时的低频清理 + 查询 WHERE 过滤兜底，认证路径保持只读
  function cleanExpired() {
    stmtClean.run();
  }
  function userOfToken(token) {
    if (!token || typeof token !== 'string' || token.length > 200) return null;
    const row = stmtFind.get(token);
    if (!row) return null;
    if (row.expires_at) {
      const left = Date.parse(row.expires_at.replace(' ', 'T') + 'Z') - Date.now();
      if (left < RENEW_BEFORE_MS) stmtRenew.run(token);
    }
    return row.username;
  }
  function makeSession(res, username) {
    cleanExpired();
    const token = uid();
    stmtInsert.run(token, username);
    res.json({ ok: true, token, username });
  }
  function requireAuth(req, res, next) {
    const token = (req.headers['x-token'] || '').trim();
    const username = userOfToken(token);
    if (!username) return res.status(401).json({ ok: false, error: '登录已失效，请重新登录' });
    req.username = username;
    next();
  }
  return { userOfToken, makeSession, requireAuth };
}
