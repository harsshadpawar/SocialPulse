// Week-boundary golden cases (D20–D23) — 2026-06-12 is a Friday; Dubai = UTC+4.
import { describe, expect, it } from 'vitest';
import { isSameWeek, weekStartKey } from './time';

const TZ = 'Asia/Dubai';
const at = (iso: string) => new Date(iso);

describe('weekStartKey / isSameWeek (ISO Mon–Sun, Dubai)', () => {
  it('D20: Friday Jun 12 → week starts Monday Jun 8', () => {
    expect(weekStartKey(at('2026-06-12T12:00:00Z'), TZ)).toBe('2026-06-08');
  });

  it('D21: Sunday 23:59 Dubai and next Monday 00:01 Dubai are DIFFERENT weeks', () => {
    const sunLate = at('2026-06-14T19:59:00Z'); // Sun Jun 14, 23:59 Dubai
    const monEarly = at('2026-06-14T20:01:00Z'); // Mon Jun 15, 00:01 Dubai
    expect(isSameWeek(sunLate, monEarly, TZ)).toBe(false);
    expect(weekStartKey(monEarly, TZ)).toBe('2026-06-15');
  });

  it('D22: UTC/Dubai drift — Sun 21:00 UTC is already Monday in Dubai', () => {
    // 2026-06-14T21:00Z = Mon Jun 15, 01:00 Dubai → next week in Dubai even though UTC is still Sunday.
    expect(weekStartKey(at('2026-06-14T21:00:00Z'), TZ)).toBe('2026-06-15');
  });

  it('D23: week crossing a month boundary (Mon Jun 29 … Sun Jul 5)', () => {
    expect(isSameWeek(at('2026-06-30T12:00:00Z'), at('2026-07-04T12:00:00Z'), TZ)).toBe(true);
    expect(weekStartKey(at('2026-07-04T12:00:00Z'), TZ)).toBe('2026-06-29');
  });
});
