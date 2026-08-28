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

export function createAuth(db) {
  return {
    userOfToken(token) {
      if (!token || typeof token !== 'string' || token.length > 200) return null;
      const row = db.prepare('SELECT username FROM sessions WHERE token = ?').get(token);
      return row ? row.username : null;
    },
    makeSession(res, username) {
      const token = uid();
      db.prepare('INSERT INTO sessions (token, username) VALUES (?, ?)').run(token, username);
      res.json({ ok: true, token, username });
    },
    requireAuth(req, res, next) {
      const token = (req.headers['x-token'] || '').trim();
      const username = this.userOfToken(token);
      if (!username) return res.status(401).json({ ok: false, error: '登录已失效，请重新登录' });
      req.username = username;
      next();
    },
  };
}
