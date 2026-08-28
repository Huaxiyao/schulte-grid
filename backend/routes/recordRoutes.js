import { Router } from 'express';

export function createRecordRoutes(db) {
  const router = Router();

  router.get('/records', (req, res) => {
    const rows = db.prepare('SELECT size, best_time FROM records WHERE username = ?').all(req.username);
    const map = {};
    for (const r of rows) map[String(r.size)] = r.best_time;
    return res.json({ ok: true, records: map });
  });

  router.post('/record', (req, res) => {
    const b = req.body || {};
    const size = parseInt(b.size, 10);
    const time = parseFloat(b.time);
    if (![3, 4, 5, 6].includes(size)) return res.status(400).json({ ok: false, error: '无效难度' });
    if (!(time > 0 && time < 3600)) return res.status(400).json({ ok: false, error: '无效成绩' });

    const old = db.prepare('SELECT best_time FROM records WHERE username = ? AND size = ?').get(req.username, size);
    const prevBest = old ? old.best_time : null;
    const isRecord = prevBest === null || time < prevBest;
    if (isRecord) {
      db.prepare(`
        INSERT INTO records (username, size, best_time, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(username, size)
        DO UPDATE SET best_time = excluded.best_time, updated_at = datetime('now')
      `).run(req.username, size, time);
    }
    return res.json({ ok: true, best: isRecord ? time : prevBest, isNewRecord: isRecord });
  });

  router.get('/leaderboard', (req, res) => {
    const size = parseInt(req.query.size, 10);
    if (![3, 4, 5, 6].includes(size)) return res.status(400).json({ ok: false, error: '无效难度' });
    const rows = db.prepare(`
      SELECT username, best_time, updated_at
      FROM records
      WHERE size = ?
      ORDER BY best_time ASC
      LIMIT 10
    `).all(size);
    return res.json({ ok: true, list: rows });
  });

  return router;
}
