// v0.2d (D-44/D-47): shared weekly metrics + non-punitive verdict. NOW = Fri Jun 12 (Dubai);
// this ISO week = Mon Jun 8 – Sun Jun 14.
import { describe, expect, it } from 'vitest';
import { deriveVerdict, deriveWeeklyMetrics } from './metrics';
import { mkPost, NOW, TZ } from './testFixtures';
import type { Commitments } from './types';

const NONE: Commitments = {
  weeklyPublishTarget: null,
  prepareAheadTarget: null,
  completionTargetPct: null,
  missedCeiling: null,
  weeklyCapacity: null,
};

const postedOnTime = () =>
  mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-09T09:00:00Z'), actualDatetime: new Date('2026-06-09T09:10:00Z') });
const postedLate = () =>
  mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-10T09:00:00Z'), actualDatetime: new Date('2026-06-10T10:00:00Z') });
const missedPost = () => mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-11T09:00:00Z') }); // grace gone → missed
const readyAhead = () => mkPost({ readiness: 'ready', caption: 'x', targetDatetime: new Date('2026-06-13T09:00:00Z') });
const draftFuture = () => mkPost({ caption: 'x', targetDatetime: new Date('2026-06-13T10:00:00Z') });

describe('deriveWeeklyMetrics (v0.2d D-44)', () => {
  it('counts published / prepared / missed and derives completion + execution score', () => {
    const m = deriveWeeklyMetrics([postedOnTime(), postedLate(), missedPost(), readyAhead(), draftFuture()], NOW, TZ);
    expect(m.planned).toBe(5);
    expect(m.published).toBe(2);
    expect(m.missed).toBe(1);
    expect(m.preparedAhead).toBe(1);
    expect(m.completionPct).toBe(40); // 2 / 5
    expect(m.onTimePct).toBe(50); // 1 on-time of 2 published
    expect(m.executionScore).toBe(30); // (1 + 0.5) / 5
  });

  it('empty week is all zeros', () => {
    expect(deriveWeeklyMetrics([], NOW, TZ)).toMatchObject({ planned: 0, published: 0, completionPct: 0, executionScore: 0 });
  });
});

describe('deriveVerdict (v0.2d D-47, non-punitive)', () => {
  it('no commitments → none', () => {
    expect(deriveVerdict([postedOnTime()], NOW, TZ, NONE)).toBe('none');
  });

  it('mid-week with unresolved posts stays on rhythm even below completion target', () => {
    // posted 2 of 5, but readyAhead + draftFuture are still pending → not judged yet
    const c: Commitments = { ...NONE, completionTargetPct: 80, missedCeiling: 2 };
    expect(deriveVerdict([postedOnTime(), postedLate(), readyAhead(), draftFuture()], NOW, TZ, c)).toBe('on_rhythm');
  });

  it('missed at/over the ceiling → ran short', () => {
    const c: Commitments = { ...NONE, missedCeiling: 1 };
    expect(deriveVerdict([missedPost(), postedOnTime()], NOW, TZ, c)).toBe('ran_short');
  });

  it('week fully resolved and completion below target → ran short', () => {
    const c: Commitments = { ...NONE, completionTargetPct: 80 };
    // 1 posted + 1 missed, nothing pending → resolved; completion 50 < 80
    expect(deriveVerdict([postedOnTime(), missedPost()], NOW, TZ, c)).toBe('ran_short');
  });

  it('week fully resolved and completion meets target → on rhythm', () => {
    const c: Commitments = { ...NONE, completionTargetPct: 80, missedCeiling: 2 };
    expect(deriveVerdict([postedOnTime(), postedLate()], NOW, TZ, c)).toBe('on_rhythm'); // 2/2 = 100%
  });
});
