import request from 'supertest';
import { createDb } from '../db.js';
import { createApp } from '../app.js';

export function makeApp() {
  const db = createDb(':memory:');
  const app = createApp(db);
  app.db = db;
  return app;
}
export function http(app) {
  return request(app);
}
