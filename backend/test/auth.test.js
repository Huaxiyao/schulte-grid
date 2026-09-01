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

test('过期会话返回 401，且在下次登录时被清理', async () => {
  const app = makeApp();
  const reg = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  app.db.prepare("UPDATE sessions SET expires_at = datetime('now', '-1 second')").run();
  const res = await http(app).get('/api/records').set('x-token', reg.body.token);
  assert.equal(res.status, 401);
  // 认证路径保持只读；过期会话由登录/注册时的低频清理回收
  await http(app).post('/api/login').send({ username: '小明', password: '1234' });
  const left = app.db.prepare('SELECT COUNT(*) AS n FROM sessions').get();
  assert.equal(left.n, 1);
});

test('未过期会话正常使用', async () => {
  const app = makeApp();
  const reg = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  const res = await http(app).get('/api/records').set('x-token', reg.body.token);
  assert.equal(res.status, 200);
});

function daysLeft(app, token) {
  const row = app.db.prepare('SELECT expires_at FROM sessions WHERE token = ?').get(token);
  return (Date.parse(row.expires_at.replace(' ', 'T') + 'Z') - Date.now()) / 86400000;
}

test('剩余不足 15 天的会话自动续期到约 30 天', async () => {
  const app = makeApp();
  const reg = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  app.db.prepare("UPDATE sessions SET expires_at = datetime('now', '+10 days')").run();
  const res = await http(app).get('/api/records').set('x-token', reg.body.token);
  assert.equal(res.status, 200);
  assert.ok(daysLeft(app, reg.body.token) > 28, '应续期到约 30 天');
});

test('剩余超过 15 天的会话不触发续期', async () => {
  const app = makeApp();
  const reg = await http(app).post('/api/register').send({ username: '小明', password: '1234' });
  app.db.prepare("UPDATE sessions SET expires_at = datetime('now', '+20 days')").run();
  await http(app).get('/api/records').set('x-token', reg.body.token);
  const left = daysLeft(app, reg.body.token);
  assert.ok(left < 25 && left > 15, '不应续期，实际剩余 ' + left + ' 天');
});
