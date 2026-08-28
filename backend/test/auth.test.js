import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, http } from './helpers.js';

test('注册成功返回 token 与用户名', async () => {
  const app = makeApp();
  const res = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.token);
  assert.equal(res.body.username, '小明');
});

test('重复用户名注册返回 409', async () => {
  const app = makeApp();
  await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  const res = await http(app).post('/api/register').send({ username: '小明', password: '5678' });
  assert.equal(res.status, 409);
});

test('非法用户名 / 短密码注册返回 400', async () => {
  const app = makeApp();
  const r1 = await http(app).post('/api/register').send({ username: 'a', password: '1234' });
  assert.equal(r1.status, 400);
  const r2 = await http(app).post('/api/register').send({ username: '合法名', password: '123' });
  assert.equal(r2.status, 400);
});

test('登录成功 / 密码错误 / 用户不存在', async () => {
  const app = makeApp();
  await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  const ok = await http(app).post('/api/login').send({ username: '小明', password: '1234' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await http(app).post('/api/login').send({ username: '小明', password: 'wrong' });
  assert.equal(bad.status, 401);
  const noUser = await http(app).post('/api/login').send({ username: '不存在', password: '1234' });
  assert.equal(noUser.status, 401);
});

test('未登录访问受保护接口返回 401', async () => {
  const app = makeApp();
  const res = await http(app).get('/api/records');
  assert.equal(res.status, 401);
});

test('退出登录后令牌失效', async () => {
  const app = makeApp();
  const reg = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  const logout = await http(app).post('/api/logout').set('x-token', reg.body.token).send({});
  assert.equal(logout.status, 200);
  const after = await http(app).get('/api/records').set('x-token', reg.body.token);
  assert.equal(after.status, 401);
});
