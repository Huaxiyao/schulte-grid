import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, http } from './helpers.js';

async function register(app) {
  const res = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  return res.body.token;
}

test('首次提交成绩成为纪录', async () => {
  const app = makeApp();
  const token = await register(app);
  const res = await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 12.34 });
  assert.equal(res.status, 200);
  assert.equal(res.body.isNewRecord, true);
  assert.equal(res.body.best, 12.34);
});

test('更差的成绩不覆盖纪录', async () => {
  const app = makeApp();
  const token = await register(app);
  await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 10 });
  const res = await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 20 });
  assert.equal(res.body.isNewRecord, false);
  assert.equal(res.body.best, 10);
});

test('更好的成绩覆盖纪录', async () => {
  const app = makeApp();
  const token = await register(app);
  await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 10 });
  const res = await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 8 });
  assert.equal(res.body.isNewRecord, true);
  assert.equal(res.body.best, 8);
});

test('GET /api/records 返回各难度最佳', async () => {
  const app = makeApp();
  const token = await register(app);
  await http(app).post('/api/record').set('x-token', token).send({ size: 3, time: 5 });
  await http(app).post('/api/record').set('x-token', token).send({ size: 5, time: 15 });
  const res = await http(app).get('/api/records').set('x-token', token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.records, { '3': 5, '5': 15 });
});

test('无效难度 / 无效成绩返回 400', async () => {
  const app = makeApp();
  const token = await register(app);
  const send = (body) => http(app).post('/api/record').set('x-token', token).send(body);
  assert.equal((await send({ size: 7, time: 10 })).status, 400);
  assert.equal((await send({ size: 5, time: -1 })).status, 400);
});
