import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAuth } from './auth.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createRecordRoutes } from './routes/recordRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db) {
  const app = express();
  const { requireAuth } = createAuth(db);

  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createAuthRoutes(db));
  app.use('/api', requireAuth);
  app.use('/api', createRecordRoutes(db));

  const dist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(dist)) app.use(express.static(dist));

  app.use((req, res) => res.status(404).json({ ok: false, error: '接口不存在' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ ok: false, error: status >= 500 ? '服务器内部错误' : err.message });
  });
  return app;
}
