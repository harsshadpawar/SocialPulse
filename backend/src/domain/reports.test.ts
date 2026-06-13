// v0.2k (D-64): consistency report aggregation. NOW = Fri Jun 12 2026 (Dubai); current week = Mon Jun 8.
import { describe, expect, it } from 'vitest';
import { deriveConsistencyReport } from './reports';
import { mkPost, NOW, TZ } from './testFixtures';
import type { Commitments, Platform } from './types';

const NONE: Commitments = {
  weeklyPublishTarget: null,
  prepareAheadTarget: null,
  completionTargetPct: null,
  missedCeiling: null,
  weeklyCapacity: null,
};

// A post published in the week of `monday` (target = monday+2d 09:00Z, posted 10 min later → on-time).
const published = (monday: string, platform: Platform = 'linkedin') =>
  mkPost({
    platform,
    readiness: 'ready',
    targetDatetime: new Date(`${monday}T05:00:00Z`),
    actualDatetime: new Date(`${monday}T05:10:00Z`),
  });
// A planned-but-missed post in the week of `monday` (target in the past, no actual).
const missed = (monday: string, platform: Platform = 'linkedin') =>
  mkPost({ platform, readiness: 'ready', targetDatetime: new Date(`${monday}T05:00:00Z`) });

describe('deriveConsistencyReport (v0.2k D-64)', () => {
  it('empty → early state, no streak, empty trend', () => {
    const r = deriveConsistencyReport([], NOW, TZ, NONE);
    expect(r.state).toBe('early');
    expect(r.windowWeeks).toBe(0);
    expect(r.streak).toBe(0);
    expect(r.trend).toEqual([]);
    expect(r.platforms).toEqual([]);
  });

  it('one week of history → still early', () => {
    const r = deriveConsistencyReport([published('2026-06-08')], NOW, TZ, NONE);
    expect(r.windowWeeks).toBe(1);
    expect(r.state).toBe('early');
  });

  it('rich: 5 consecutive hit weeks → streak 5, full trend, per-platform', () => {
    const weeks = ['2026-05-11', '2026-05-18', '2026-05-25', '2026-06-01', '2026-06-08'];
    const posts = weeks.map((w) => published(w));
    posts.push(published('2026-06-01', 'x')); // X used in one week
    const r = deriveConsistencyReport(posts, NOW, TZ, NONE);
    expect(r.windowWeeks).toBe(5);
    expect(r.streak).toBe(5);
    expect(r.state).toBe('rich');
    expect(r.trend).toEqual([100, 100, 100, 100, 100]);
    expect(r.weeksHitInWindow).toBe(5);
    const li = r.platforms.find((p) => p.platform === 'linkedin')!;
    expect(li).toMatchObject({ weeksHit: 5, weeksOf: 5 });
    const x = r.platforms.find((p) => p.platform === 'x')!;
    expect(x.weeksHit).toBe(1);
    expect(r.platforms.some((p) => p.platform === 'youtube')).toBe(false); // unused platform omitted
  });

  it('rough: recent weeks missed → streak 0, rough state, months still show the stronger past', () => {
    const posts = [
      published('2026-05-11'),
      published('2026-05-18'),
      missed('2026-05-25'),
      missed('2026-06-01'),
      missed('2026-06-08'),
    ];
    const r = deriveConsistencyReport(posts, NOW, TZ, NONE);
    expect(r.windowWeeks).toBe(5);
    expect(r.streak).toBe(0);
    expect(r.state).toBe('rough');
    expect(r.trend).toEqual([100, 100, 0, 0, 0]);
  });

  it('completion % is published / planned within a week', () => {
    const r = deriveConsistencyReport([published('2026-06-08'), missed('2026-06-08')], NOW, TZ, NONE);
    expect(r.trend.at(-1)).toBe(50); // 1 of 2
    expect(r.weekDots.at(-1)).toBe(true); // ≥1 published → hit
  });

  it('capacity line follows the completion target when set', () => {
    const c: Commitments = { ...NONE, completionTargetPct: 70 };
    const r = deriveConsistencyReport([published('2026-06-08')], NOW, TZ, c);
    expect(r.capacityLinePct).toBe(70);
  });
});
