import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from './state.js';
import { syncGuestRecords } from './sync.js';
import { setItem, removeItem } from './storage.js';

const GUEST_KEY = 'schulte-guest-records';

function mockFetch(handler) {
  const fn = vi.fn(handler);
  vi.stubGlobal('fetch', fn);
  return fn;
}
const okRes = (body) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

describe('游客成绩云同步', () => {
  beforeEach(() => {
    removeItem(GUEST_KEY);
    state.token = 'tk';
    state.records = {};
  });

  it('无 token 时不发请求', async () => {
    setItem(GUEST_KEY, JSON.stringify({ '5': 8 }));
    state.token = null;
    const fn = mockFetch(() => okRes({}));
    await syncGuestRecords({ '5': 10 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('无服务器记录参数时不发请求', async () => {
    setItem(GUEST_KEY, JSON.stringify({ '5': 8 }));
    const fn = mockFetch(() => okRes({}));
    await syncGuestRecords(null);
    expect(fn).not.toHaveBeenCalled();
  });

  it('无本地游客记录时不发请求', async () => {
    const fn = mockFetch(() => okRes({}));
    await syncGuestRecords({ '5': 10 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('本地更优的成绩被提交，并采纳服务器返回的最优', async () => {
    setItem(GUEST_KEY, JSON.stringify({ '3': 10, '5': 8 }));
    state.records = { '3': 10, '5': 8 };
    const fn = mockFetch(() => okRes({ ok: true, best: 9.5 }));
    await syncGuestRecords({ '3': 12, '5': 8 });
    expect(fn).toHaveBeenCalledTimes(1); // 只有 3×3 更优；5×5 持平不同步
    const [, init] = fn.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ size: 3, time: 10 });
    expect(state.records['3']).toBe(9.5);
  });

  it('服务器缺失的难度会被补齐', async () => {
    setItem(GUEST_KEY, JSON.stringify({ '4': 7 }));
    state.records = { '4': 7 };
    const fn = mockFetch(() => okRes({ ok: true, best: 7 }));
    await syncGuestRecords({}); // 服务器无任何记录
    expect(fn).toHaveBeenCalledTimes(1);
    expect(state.records['4']).toBe(7);
  });

  it('不优于服务器的成绩不同步', async () => {
    setItem(GUEST_KEY, JSON.stringify({ '3': 12, '5': 30 }));
    const fn = mockFetch(() => okRes({}));
    await syncGuestRecords({ '3': 10, '5': 30 });
    expect(fn).not.toHaveBeenCalled();
  });
});
