import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { api } from './api.js';
import { state, saveAccount } from './state.js';

beforeEach(() => {
  state.token = null; state.user = null; state.showAuth = false; state.records = {};
});
afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('网络失败时返回友好错误', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const res = await api('/records');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('无法连接服务器');
  });

  it('非 JSON 响应（后端未启动时代理回 500 页）返回明确错误', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response('<html>Internal Server Error</html>', { status: 500 }))
    ));
    const res = await api('/login', { json: { username: 'stajia', password: 'x' } });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('后端');
  });

  it('自动附带 x-token 请求头', async () => {
    saveAccount('tok123', '小明', {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true, records: {} }), { status: 200 }))
    ));
    await api('/records');
    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/api/records');
    expect(opts.headers['x-token']).toBe('tok123');
  });

  it('401 时清除会话并要求重新登录', async () => {
    saveAccount('tok123', '小明', {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false, error: '登录已失效，请重新登录' }), { status: 401 }))
    ));
    const res = await api('/records');
    expect(res.ok).toBe(false);
    expect(state.token).toBe(null);
    expect(state.showAuth).toBe(true);
  });

  it('游客收到 401 不弹登录框', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false, error: '未登录' }), { status: 401 }))
    ));
    const res = await api('/leaderboard');
    expect(res.ok).toBe(false);
    expect(state.token).toBe(null);
    expect(state.showAuth).toBe(false);
  });

  it('POST json 请求体正确序列化', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    ));
    await api('/record', { json: { size: 5, time: 10 } });
    const opts = vi.mocked(fetch).mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ size: 5, time: 10 });
  });
});
