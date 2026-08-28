/**
 * 舒尔特方格 · 账号存档服务
 * 零第三方依赖：Node 内置 http + sqlite + crypto
 * 启动：node server.js   然后浏览器访问 http://localhost:3000
 * 可选端口：node server.js 8080
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

/* ---------------- 配置 ---------------- */
const ROOT = __dirname;
const PORT = parseInt(process.argv[2], 10) || 3000;
const DB_FILE = path.join(ROOT, 'schulte.db');

/* ---------------- 数据库 ---------------- */
const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    salt       TEXT NOT NULL,
    hash       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  -- 各难度最佳记录：同一用户+难度只存一行，新纪录覆盖
  CREATE TABLE IF NOT EXISTS records (
    username   TEXT NOT NULL,
    size       INTEGER NOT NULL,
    best_time  REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (username, size),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    username   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
  );
`);

/* ---------------- 密码哈希（scrypt） ---------------- */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
function newSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/* ---------------- 工具 ---------------- */
function uid() {
  return crypto.randomBytes(24).toString('hex');
}
function bodyOf(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}
function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    // 允许 file:// 双击打开的页面直连本机 API（本地单机场景）
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(s);
}
const USER_RE = /^[\u4e00-\u9fa5A-Za-z0-9_]{2,16}$/;
function validUser(u) { return USER_RE.test(u); }
function validPass(p) { return typeof p === 'string' && p.length >= 4 && p.length <= 64; }

/* ---------------- 鉴权 ---------------- */
function userOfToken(token) {
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const row = db.prepare('SELECT username FROM sessions WHERE token = ?').get(token);
  return row ? row.username : null;
}
function makeSession(res, username) {
  const token = uid();
  db.prepare('INSERT INTO sessions (token, username) VALUES (?, ?)').run(token, username);
  json(res, 200, { ok: true, token, username });
}

/* ---------------- API ---------------- */
async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','register'|...]

  // POST /api/register
  if (parts[0] === 'api' && parts[1] === 'register' && req.method === 'POST') {
    const b = await bodyOf(req);
    const name = String(b.username || '').trim();
    if (!validUser(name)) return json(res, 400, { ok: false, error: '用户名需 2-16 位中文/字母/数字/下划线' });
    if (!validPass(b.password)) return json(res, 400, { ok: false, error: '密码需 4-64 位' });
    const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(name);
    if (exists) return json(res, 409, { ok: false, error: '该用户名已被注册' });
    const salt = newSalt();
    db.prepare('INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)')
      .run(name, salt, hashPassword(b.password, salt));
    return makeSession(res, name);
  }

  // POST /api/login
  if (parts[0] === 'api' && parts[1] === 'login' && req.method === 'POST') {
    const b = await bodyOf(req);
    const name = String(b.username || '').trim();
    const row = db.prepare('SELECT username, salt, hash FROM users WHERE username = ?').get(name);
    if (!row) return json(res, 401, { ok: false, error: '用户名或密码错误' });
    const expect = hashPassword(b.password, row.salt);
    const got = row.hash;
    if (expect.length !== got.length || !crypto.timingSafeEqual(Buffer.from(expect, 'hex'), Buffer.from(got, 'hex')))
      return json(res, 401, { ok: false, error: '用户名或密码错误' });
    return makeSession(res, name);
  }

  // POST /api/logout
  if (parts[0] === 'api' && parts[1] === 'logout' && req.method === 'POST') {
    const b = await bodyOf(req);
    db.prepare('DELETE FROM sessions WHERE token = ?').run(b.token || '');
    return json(res, 200, { ok: true });
  }

  // 以下接口需要登录
  const token = (req.headers['x-token'] || '').trim();
  const username = userOfToken(token);
  if (!username) return json(res, 401, { ok: false, error: '登录已失效，请重新登录' });

  // GET /api/records —— 我的全部难度最佳
  if (parts[0] === 'api' && parts[1] === 'records' && req.method === 'GET') {
    const rows = db.prepare('SELECT size, best_time FROM records WHERE username = ?').all(username);
    const map = {};
    for (const r of rows) map[String(r.size)] = r.best_time;
    return json(res, 200, { ok: true, records: map });
  }

  // POST /api/record {size, time} —— 提交一局成绩，仅当刷新纪录时写入
  if (parts[0] === 'api' && parts[1] === 'record' && req.method === 'POST') {
    const b = await bodyOf(req);
    const size = parseInt(b.size, 10);
    const time = parseFloat(b.time);
    if (![3, 4, 5, 6].includes(size)) return json(res, 400, { ok: false, error: '无效难度' });
    if (!(time > 0 && time < 3600)) return json(res, 400, { ok: false, error: '无效成绩' });

    const old = db.prepare('SELECT best_time FROM records WHERE username = ? AND size = ?').get(username, size);
    const prevBest = old ? old.best_time : null;
    const isRecord = prevBest === null || time < prevBest;
    if (isRecord) {
      db.prepare(`
        INSERT INTO records (username, size, best_time, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(username, size)
        DO UPDATE SET best_time = excluded.best_time, updated_at = datetime('now')
      `).run(username, size, time);
    }
    return json(res, 200, { ok: true, best: isRecord ? time : prevBest, isNewRecord: isRecord });
  }

  return json(res, 404, { ok: false, error: '接口不存在' });
}

/* ---------------- 静态文件服务 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
function sendStatic(req, res, url) {
  let p = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const full = path.normalize(path.join(ROOT, p));
  if (!full.startsWith(ROOT + path.sep) && full !== path.join(ROOT, 'index.html')) {
    return json(res, 403, { ok: false, error: '拒绝访问' });
  }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) return json(res, 404, { ok: false, error: '文件不存在' });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(full).pipe(res);
  });
}

/* ---------------- 服务 ---------------- */
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type, x-token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return sendStatic(req, res, url);
  } catch (e) {
    json(res, 500, { ok: false, error: '服务器内部错误' });
  }
});
server.listen(PORT, () => {
  console.log('');
  console.log('  舒尔特方格 · 账号存档服务已启动');
  console.log('  ───────────────────────────────');
  console.log(`  本机访问:  http://localhost:${PORT}`);
  console.log(`  局域网访问(手机/别的电脑): http://<本机IP>:${PORT}`);
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});