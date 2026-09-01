import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = path.join(__dirname, '..', 'schulte.db');

export function createDb(file = process.env.SCHULTE_DB || DEFAULT_DB) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT UNIQUE NOT NULL,
      salt       TEXT NOT NULL,
      hash       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
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
      expires_at TEXT NOT NULL DEFAULT (datetime('now', '+30 days')),
      FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    );
  `);
  const sessionCols = db.prepare('PRAGMA table_info(sessions)').all();
  if (sessionCols.length > 0 && !sessionCols.some((c) => c.name === 'expires_at')) {
    db.exec('ALTER TABLE sessions ADD COLUMN expires_at TEXT');
    db.exec("UPDATE sessions SET expires_at = datetime('now', '+30 days')");
  }
  return db;
}
