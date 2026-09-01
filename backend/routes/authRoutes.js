import { Router } from 'express';
import {
  hashPassword, newSalt, validUser, validPass, verifyPassword,
} from '../auth.js';

export function createAuthRoutes(db, auth) {
  const router = Router();
  const { makeSession } = auth;
  const stmtExists = db.prepare('SELECT 1 FROM users WHERE username = ?');
  const stmtInsertUser = db.prepare('INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)');
  const stmtFindUser = db.prepare('SELECT username, salt, hash FROM users WHERE username = ?');
  const stmtDeleteSession = db.prepare('DELETE FROM sessions WHERE token = ?');

  router.post('/register', (req, res) => {
    const b = req.body || {};
    const name = String(b.username || '').trim();
    if (!validUser(name)) return res.status(400).json({ ok: false, error: '用户名需 2-16 位中文/字母/数字/下划线' });
    if (!validPass(b.password)) return res.status(400).json({ ok: false, error: '密码需 4-64 位' });
    if (stmtExists.get(name)) {
      return res.status(409).json({ ok: false, error: '该用户名已被注册' });
    }
    const salt = newSalt();
    stmtInsertUser.run(name, salt, hashPassword(b.password, salt));
    return makeSession(res, name);
  });

  router.post('/login', (req, res) => {
    const b = req.body || {};
    const name = String(b.username || '').trim();
    const row = stmtFindUser.get(name);
    if (!row || !verifyPassword(String(b.password || ''), row.salt, row.hash)) {
      return res.status(401).json({ ok: false, error: '用户名或密码错误' });
    }
    return makeSession(res, name);
  });

  router.post('/logout', (req, res) => {
    const token = (req.headers['x-token'] || '').trim() || (req.body && req.body.token) || '';
    if (token) stmtDeleteSession.run(token);
    return res.json({ ok: true });
  });

  return router;
}
