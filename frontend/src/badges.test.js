import { afterEach, describe, expect, it, vi } from 'vitest';
import { arrivalTime, routeBadge, worstIsFlagged } from './badges';

describe('routeBadge', () => {
  it('returns LOW when the average is at the threshold', () => {
    expect(routeBadge({ avg_density: 100 }, 100)).toBe('LOW');
  });

  it('returns LOW when the average is below the threshold', () => {
    expect(routeBadge({ avg_density: 62 }, 100)).toBe('LOW');
  });

  it('returns HIGH when the average is above the threshold', () => {
    expect(routeBadge({ avg_density: 148 }, 100)).toBe('HIGH');
  });

  it('returns NO DATA when there is no average — never assumed calm', () => {
    expect(routeBadge({ avg_density: null }, 100)).toBe('NO DATA');
    expect(routeBadge({ avg_density: undefined }, 100)).toBe('NO DATA');
    expect(routeBadge({}, 100)).toBe('NO DATA');
  });
});

describe('worstIsFlagged', () => {
  it('flags only a true outlier: above the threshold and more than double the average', () => {
    expect(
      worstIsFlagged({ avg_density: 60, worst: { value: 141 } }, 100),
    ).toBe(true);
  });

  it('does not flag a busy-but-typical point close to the route average', () => {
    expect(
      worstIsFlagged({ avg_density: 140, worst: { value: 150 } }, 100),
    ).toBe(false);
  });

  it('does not flag a spike that is still at or below the user limit', () => {
    expect(
      worstIsFlagged({ avg_density: 20, worst: { value: 80 } }, 100),
    ).toBe(false);
  });

  it('does not flag when there is no worst point or no average', () => {
    expect(worstIsFlagged({ avg_density: 60 }, 100)).toBe(false);
    expect(worstIsFlagged({ avg_density: null, worst: { value: 200 } }, 100)).toBe(
      false,
    );
  });
});

describe('arrivalTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats now plus the walk duration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T02:00:00.000Z'));
    const spoken = arrivalTime(15);
    expect(spoken).toMatch(/\d{1,2}:\d{2}/);
    expect(spoken.length).toBeGreaterThan(0);
  });
});
