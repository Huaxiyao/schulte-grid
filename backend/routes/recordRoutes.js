import { Router } from 'express';

const MIN_TIME = { 3: 0.5, 4: 0.8, 5: 1.2, 6: 1.8 };
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

export function createRecordRoutes(db) {
  const router = Router();
  const stmtSelectAll = db.prepare('SELECT size, best_time FROM records WHERE username = ?');
  const stmtSelectBest = db.prepare('SELECT best_time FROM records WHERE username = ? AND size = ?');
  const stmtUpsert = db.prepare(`
    INSERT INTO records (username, size, best_time, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(username, size)
    DO UPDATE SET best_time = excluded.best_time, updated_at = datetime('now')
  `);
  const submitLog = new Map();

  function overLimit(key) {
    const now = Date.now();
    const arr = (submitLog.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (arr.length >= RATE_LIMIT) {
      // 被拒的请求不计数：既避免高频刷接口时窗口日志无限增长，也不延长封锁
      submitLog.set(key, arr);
      return true;
    }
    arr.push(now);
    submitLog.set(key, arr);
    return false;
  }

  router.get('/records', (req, res) => {
    const rows = stmtSelectAll.all(req.username);
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
    if (time < MIN_TIME[size]) return res.status(400).json({ ok: false, error: '成绩无效，快于人类极限' });
    if (overLimit(req.username || req.ip)) {
      return res.status(429).json({ ok: false, error: '提交过于频繁，请稍后再试' });
    }

    const old = stmtSelectBest.get(req.username, size);
    const prevBest = old ? old.best_time : null;
    const isRecord = prevBest === null || time < prevBest;
    if (isRecord) {
      stmtUpsert.run(req.username, size, time);
    }
    return res.json({ ok: true, best: isRecord ? time : prevBest, isNewRecord: isRecord });
  });

  return router;
}

export function createLeaderboardRoutes(db) {
  const router = Router();
  const stmtTop = db.prepare(`
    SELECT username, best_time, updated_at
    FROM records
    WHERE size = ?
    ORDER BY best_time ASC
    LIMIT 10
  `);

  // 公开接口：游客也可查看，登录后成绩才能上榜
  router.get('/leaderboard', (req, res) => {
    const size = parseInt(req.query.size, 10);
    if (![3, 4, 5, 6].includes(size)) return res.status(400).json({ ok: false, error: '无效难度' });
    return res.json({ ok: true, list: stmtTop.all(size) });
  });

  return router;
}
