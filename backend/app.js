import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth } from './auth.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createRecordRoutes, createLeaderboardRoutes } from './routes/recordRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db) {
  const app = express();
  const auth = createAuth(db);

  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createAuthRoutes(db, auth));
  app.use('/api', createLeaderboardRoutes(db)); // 榜单对游客开放
  app.use('/api', auth.requireAuth);
  app.use('/api', createRecordRoutes(db));

  const dist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(dist)) app.use(express.static(dist));

  app.use((req, res) => res.status(404).json({ ok: false, error: '接口不存在' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      // 5xx 对客户端隐藏细节，但堆栈要落日志供排查
      console.error(`[error] ${req.method} ${req.originalUrl}`, err.stack || err);
    }
    res.status(status).json({ ok: false, error: status >= 500 ? '服务器内部错误' : err.message });
  });
  return app;
}
