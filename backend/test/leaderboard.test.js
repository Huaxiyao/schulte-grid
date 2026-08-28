import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, http } from './helpers.js';

async function registerAs(app, name) {
  const res = await http(app).post('/api/register').send({ username: name, password: '1234' });
  return res.body.token;
}
async function submit(app, token, size, time) {
  return http(app).post('/api/record').set('x-token', token).send({ size, time });
}

test('排行榜按成绩升序排列', async () => {
  const app = makeApp();
  const t1 = await registerAs(app, '选手甲');
  const t2 = await registerAs(app, '选手乙');
  const t3 = await registerAs(app, '选手丙');
  await submit(app, t1, 5, 15);
  await submit(app, t2, 5, 9);
  await submit(app, t3, 5, 12);
  const res = await http(app).get('/api/leaderboard?size=5').set('x-token', t1);
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.deepEqual(res.body.list.map(r => r.username), ['选手乙', '选手丙', '选手甲']);
  assert.deepEqual(res.body.list.map(r => r.best_time), [9, 12, 15]);
});

test('同一用户各难度独立排名，最多返回 10 人', async () => {
  const app = makeApp();
  const t1 = await registerAs(app, '选手甲');
  for (let i = 1; i <= 12; i++) {
    const t = await registerAs(app, '玩家' + i);
    await submit(app, t, 4, 20 + i);
  }
  await submit(app, t1, 3, 6);
  const res = await http(app).get('/api/leaderboard?size=4').set('x-token', t1);
  assert.equal(res.body.list.length, 10);
  // 最快的先
  assert.equal(res.body.list[0].best_time, 21);
  const res3 = await http(app).get('/api/leaderboard?size=3').set('x-token', t1);
  assert.deepEqual(res3.body.list.map(r => r.username), ['选手甲']);
});

test('未登录 / 非法难度被拒绝', async () => {
  const app = makeApp();
  const noAuth = await http(app).get('/api/leaderboard?size=5');
  assert.equal(noAuth.status, 401);
  const token = await registerAs(app, '选手甲');
  const bad = await http(app).get('/api/leaderboard?size=7').set('x-token', token);
  assert.equal(bad.status, 400);
});
