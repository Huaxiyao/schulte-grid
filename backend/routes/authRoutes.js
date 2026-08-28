import { Router } from 'express';
import {
  hashPassword, newSalt, validUser, validPass, verifyPassword, createAuth,
} from '../auth.js';

export function createAuthRoutes(db) {
  const router = Router();
  const { makeSession } = createAuth(db);

  router.post('/register', (req, res) => {
    const b = req.body || {};
    const name = String(b.username || '').trim();
    if (!validUser(name)) return res.status(400).json({ ok: false, error: '用户名需 2-16 位中文/字母/数字/下划线' });
    if (!validPass(b.password)) return res.status(400).json({ ok: false, error: '密码需 4-64 位' });
    if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(name)) {
      return res.status(409).json({ ok: false, error: '该用户名已被注册' });
    }
    const salt = newSalt();
    db.prepare('INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)')
      .run(name, salt, hashPassword(b.password, salt));
    return makeSession(res, name);
  });

  router.post('/login', (req, res) => {
    const b = req.body || {};
    const name = String(b.username || '').trim();
    const row = db.prepare('SELECT username, salt, hash FROM users WHERE username = ?').get(name);
    if (!row || !verifyPassword(String(b.password || ''), row.salt, row.hash)) {
      return res.status(401).json({ ok: false, error: '用户名或密码错误' });
    }
    return makeSession(res, name);
  });

  router.post('/logout', (req, res) => {
    const token = (req.headers['x-token'] || '').trim() || (req.body && req.body.token) || '';
    if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return res.json({ ok: true });
  });

  return router;
}
