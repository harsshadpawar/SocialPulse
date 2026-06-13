// v0.2c (D-38): effort derived from format; weekly capacity is a derived sum. Dubai = UTC+4.
import { describe, expect, it } from 'vitest';
import { deriveEffort, deriveWeeklyEffort } from './effort';
import { mkPost, NOW, TZ } from './testFixtures';

describe('deriveEffort (v0.2f per-format)', () => {
  it('maps each format to its effort', () => {
    expect(deriveEffort('text_post')).toBe('low');
    expect(deriveEffort('short_post')).toBe('low');
    expect(deriveEffort('image')).toBe('low');
    expect(deriveEffort('thread')).toBe('medium');
    expect(deriveEffort('carousel')).toBe('medium');
    expect(deriveEffort('reel')).toBe('medium');
    expect(deriveEffort('short_video')).toBe('medium');
    expect(deriveEffort('video')).toBe('high');
    expect(deriveEffort('long_video')).toBe('high');
  });
});

describe('deriveWeeklyEffort (v0.2c D-38)', () => {
  // NOW = Fri 2026-06-12 (Dubai). This ISO week is Mon Jun 8 – Sun Jun 14.
  it('a week with no targeted posts is light/0', () => {
    expect(deriveWeeklyEffort([], NOW, TZ)).toEqual({ posts: 0, score: 0, load: 'light' });
    // untargeted drafts do not count toward planned effort
    expect(deriveWeeklyEffort([mkPost({ targetDatetime: null })], NOW, TZ)).toEqual({ posts: 0, score: 0, load: 'light' });
  });

  it('sums effort weights for posts targeted this week', () => {
    const posts = [
      mkPost({ format: 'text_post', targetDatetime: new Date('2026-06-09T09:00:00Z') }), // low = 1
      mkPost({ format: 'reel', targetDatetime: new Date('2026-06-11T09:00:00Z') }), // medium = 2
      mkPost({ format: 'video', targetDatetime: new Date('2026-06-13T09:00:00Z') }), // high = 3
    ];
    expect(deriveWeeklyEffort(posts, NOW, TZ)).toEqual({ posts: 3, score: 6, load: 'moderate' });
  });

  it('excludes posts targeted in other weeks', () => {
    const posts = [
      mkPost({ format: 'text_post', targetDatetime: new Date('2026-06-10T09:00:00Z') }), // this week, low
      mkPost({ format: 'short_video', targetDatetime: new Date('2026-06-20T09:00:00Z') }), // next week — excluded
    ];
    expect(deriveWeeklyEffort(posts, NOW, TZ)).toEqual({ posts: 1, score: 1, load: 'light' });
  });

  it('load tiers: <=3 light, <=6 moderate, >6 full', () => {
    const lows = (n: number) =>
      Array.from({ length: n }, () => mkPost({ format: 'text_post', targetDatetime: new Date('2026-06-10T09:00:00Z') }));
    expect(deriveWeeklyEffort(lows(3), NOW, TZ).load).toBe('light');
    expect(deriveWeeklyEffort(lows(6), NOW, TZ).load).toBe('moderate');
    expect(deriveWeeklyEffort(lows(7), NOW, TZ).load).toBe('full');
  });
});
