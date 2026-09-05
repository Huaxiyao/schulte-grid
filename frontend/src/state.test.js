import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  state, saveAccount, clearSession, loadGuestRecords, saveGuestRecords, removeGuestRecord,
} from './state.js';
import { getItem, setItem, removeItem } from './storage.js';

const GUEST_KEY = 'schulte-guest-records';

describe('游客成绩本地持久化', () => {
  beforeEach(() => {
    removeItem(GUEST_KEY);
    state.token = null;
    state.user = null;
    state.records = {};
  });

  it('保存后可读取', () => {
    saveGuestRecords({ '3': 6.5, '5': 12.3 });
    expect(loadGuestRecords()).toEqual({ '3': 6.5, '5': 12.3 });
  });

  it('非法或超范围的值被过滤', () => {
    setItem(GUEST_KEY, JSON.stringify({ '3': 5, '5': -2, '6': 'abc', '4': 9999, '2': 1 }));
    expect(loadGuestRecords()).toEqual({ '3': 5 });
  });

  it('损坏的数据返回空对象', () => {
    setItem(GUEST_KEY, 'not-json');
    expect(loadGuestRecords()).toEqual({});
  });

  it('removeGuestRecord 删除指定难度，清空后移除整个 key', () => {
    saveGuestRecords({ '3': 6.5, '5': 12.3 });
    removeGuestRecord('3');
    expect(loadGuestRecords()).toEqual({ '5': 12.3 });
    removeGuestRecord('5');
    expect(getItem(GUEST_KEY)).toBe(null);
  });

  it('removeGuestRecord 对不存在的条目是 no-op', () => {
    saveGuestRecords({ '3': 6.5 });
    removeGuestRecord('6');
    expect(loadGuestRecords()).toEqual({ '3': 6.5 });
  });

  it('登录时云端记录与游客记录合并取最优', () => {
    saveGuestRecords({ '3': 10, '5': 8 });
    saveAccount('tk', '小明', { '3': 12, '4': 6 });
    expect(state.token).toBe('tk');
    expect(state.user).toBe('小明');
    expect(state.records).toEqual({ '3': 10, '4': 6, '5': 8 });
    expect(state.showAuth).toBe(false);
  });

  it('退出登录后恢复游客记录', () => {
    saveGuestRecords({ '5': 8 });
    saveAccount('tk', '小明', { '3': 12 });
    clearSession();
    expect(state.token).toBe(null);
    expect(state.user).toBe(null);
    expect(state.records).toEqual({ '5': 8 });
    expect(state.showAuth).toBe(true);
  });

  it('无 token 时初始 records 取自本地游客记录', async () => {
    vi.resetModules();
    const freshStorage = await import('./storage.js');
    freshStorage.setItem(GUEST_KEY, JSON.stringify({ '5': 8 }));
    const { state: fresh } = await import('./state.js');
    expect(fresh.records).toEqual({ '5': 8 });
  });

  it('有 token 时初始 records 为空，待服务器拉取', async () => {
    vi.resetModules();
    const freshStorage = await import('./storage.js');
    freshStorage.setItem('schulte-token', 'tk');
    freshStorage.setItem(GUEST_KEY, JSON.stringify({ '5': 8 }));
    const { state: fresh } = await import('./state.js');
    expect(fresh.token).toBe('tk');
    expect(fresh.records).toEqual({});
  });
});
