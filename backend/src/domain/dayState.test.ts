// v0.2b (D-34): "Today's work is done" is fully derived — no persistence. These golden cases pin
// the rule: nothing actionable today AND at least one post live today. Dubai = UTC+4, NOW = Fri Jun 12 4PM.
import { describe, expect, it } from 'vitest';
import { deriveWorkIsDone, isActionableToday } from './selector';
import { mkPost, NOW, TZ } from './testFixtures';

/** A post published earlier today (2PM Dubai), targeted earlier the same day. */
const postedToday = () =>
  mkPost({
    readiness: 'ready',
    targetDatetime: new Date('2026-06-12T09:00:00Z'),
    actualDatetime: new Date('2026-06-12T10:00:00Z'),
  });

describe('isActionableToday (v0.2b D-34)', () => {
  it('a posted-today post is NOT actionable (it is done, not pending)', () => {
    expect(isActionableToday(postedToday(), NOW, TZ)).toBe(false);
  });

  it('a loose untargeted draft IS actionable (must never be lost)', () => {
    expect(isActionableToday(mkPost({ caption: '' }), NOW, TZ)).toBe(true);
  });

  it('a post past its target but within grace (Due) IS actionable', () => {
    const due = mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-12T11:50:00Z') }); // due until 12:20Z
    expect(isActionableToday(due, NOW, TZ)).toBe(true);
  });

  it('a draft staged for a future day is NOT actionable today', () => {
    const tomorrow = mkPost({ caption: 'drafted', targetDatetime: new Date('2026-06-13T09:00:00Z') });
    expect(isActionableToday(tomorrow, NOW, TZ)).toBe(false);
  });

  it('an unacknowledged miss IS actionable; acknowledging clears it', () => {
    const missed = mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-12T10:00:00Z') }); // grace gone → missed
    expect(isActionableToday(missed, NOW, TZ)).toBe(true);
    const acked = mkPost({
      readiness: 'ready',
      targetDatetime: new Date('2026-06-12T10:00:00Z'),
      missedAcknowledgedAt: new Date('2026-06-12T11:00:00Z'),
    });
    expect(isActionableToday(acked, NOW, TZ)).toBe(false);
  });
});

describe('deriveWorkIsDone (v0.2b D-34)', () => {
  it('an empty plan is "clear", not "done"', () => {
    expect(deriveWorkIsDone([], NOW, TZ)).toBe(false);
  });

  it('posted today with nothing else outstanding → done', () => {
    expect(deriveWorkIsDone([postedToday()], NOW, TZ)).toBe(true);
  });

  it('posted today but a loose draft remains → not done', () => {
    expect(deriveWorkIsDone([postedToday(), mkPost({ caption: '' })], NOW, TZ)).toBe(false);
  });

  it('posted today + tomorrow staged in draft → done (future prep does not block)', () => {
    const tomorrow = mkPost({ caption: 'drafted', targetDatetime: new Date('2026-06-13T09:00:00Z') });
    expect(deriveWorkIsDone([postedToday(), tomorrow], NOW, TZ)).toBe(true);
  });

  it('a Due post outstanding → not done even if something else was posted', () => {
    const due = mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-12T11:50:00Z') });
    expect(deriveWorkIsDone([due, postedToday()], NOW, TZ)).toBe(false);
  });

  it('posted only on a previous day → not done (nothing live today)', () => {
    const yesterday = mkPost({
      readiness: 'ready',
      targetDatetime: new Date('2026-06-11T09:00:00Z'),
      actualDatetime: new Date('2026-06-11T10:00:00Z'),
    });
    expect(deriveWorkIsDone([yesterday], NOW, TZ)).toBe(false);
  });

  it('an unacknowledged miss blocks done; acknowledging unblocks it', () => {
    const missed = mkPost({ readiness: 'ready', targetDatetime: new Date('2026-06-12T10:00:00Z') });
    expect(deriveWorkIsDone([missed, postedToday()], NOW, TZ)).toBe(false);
    const acked = mkPost({
      readiness: 'ready',
      targetDatetime: new Date('2026-06-12T10:00:00Z'),
      missedAcknowledgedAt: new Date('2026-06-12T11:00:00Z'),
    });
    expect(deriveWorkIsDone([acked, postedToday()], NOW, TZ)).toBe(true);
  });
});
