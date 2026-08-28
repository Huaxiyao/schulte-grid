import request from 'supertest';
import { createDb } from '../db.js';
import { createApp } from '../app.js';

export function makeApp() {
  return createApp(createDb(':memory:'));
}
export function http(app) {
  return request(app);
}
