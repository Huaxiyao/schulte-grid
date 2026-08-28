import { describe, it, expect } from 'vitest';
import { shuffled, ratingFor, fmt } from './gameLogic.js';

describe('shuffled', () => {
  it('对 1..n 每个数字恰好出现一次', () => {
    for (const n of [3, 4, 5, 6, 9, 25]) {
      const a = shuffled(n);
      expect(a).toHaveLength(n);
      expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    }
  });
  it('多次运行并非总是一致', () => {
    const seen = new Set([JSON.stringify(shuffled(25))]);
    for (let i = 0; i < 10; i++) seen.add(JSON.stringify(shuffled(25)));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('ratingFor', () => {
  it('按每格秒数分档', () => {
    expect(ratingFor(0.5)).toBe('行云流水');
    expect(ratingFor(1.0)).toBe('渐入佳境');
    expect(ratingFor(1.5)).toBe('稳扎稳打');
    expect(ratingFor(2.5)).toBe('初窥门径');
    expect(ratingFor(60)).toBe('初窥门径');
  });
});

describe('fmt', () => {
  it('保留两位小数', () => {
    expect(fmt(1.234)).toBe('1.23');
    expect(fmt(0)).toBe('0.00');
  });
});
