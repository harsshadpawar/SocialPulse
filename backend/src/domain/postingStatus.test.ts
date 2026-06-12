// Golden table D1–D5, D9–D10 (docs/selector-spec.md §5).
import { describe, expect, it } from 'vitest';
import { derivePostingStatus } from './postingStatus';
import { mkPost } from './testFixtures';

const T = new Date('2026-06-12T16:30:00Z'); // 8:30 PM Dubai

const at = (iso: string) => new Date(iso);

describe('derivePostingStatus (D1–D5)', () => {
  it('D1: no target → planned', () => {
    expect(derivePostingStatus(mkPost(), at('2026-06-12T12:00:00Z'))).toBe('planned');
  });

  it('D2: now < target → planned', () => {
    const p = mkPost({ targetDatetime: T });
    expect(derivePostingStatus(p, at('2026-06-12T16:29:59Z'))).toBe('planned');
  });

  it('D3: now == target → due', () => {
    const p = mkPost({ targetDatetime: T });
    expect(derivePostingStatus(p, T)).toBe('due');
  });

  it('D4: now == target + 30:00 exactly → due (boundary inclusive)', () => {
    const p = mkPost({ targetDatetime: T });
    expect(derivePostingStatus(p, at('2026-06-12T17:00:00Z'))).toBe('due');
  });

  it('D5: now == target + 30:01 → missed', () => {
    const p = mkPost({ targetDatetime: T });
    expect(derivePostingStatus(p, at('2026-06-12T17:00:01Z'))).toBe('missed');
  });

  it('posted wins regardless of time', () => {
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T16:40:00Z') });
    expect(derivePostingStatus(p, at('2026-06-13T09:00:00Z'))).toBe('posted');
  });
});

describe('grace crossing midnight (D9–D10)', () => {
  // Target 23:50 Dubai Jun 12 == 19:50Z; grace ends 00:20 Dubai Jun 13 == 20:20Z.
  const lateTarget = at('2026-06-12T19:50:00Z');

  it('D9: 00:15 Dubai next day → still due', () => {
    const p = mkPost({ targetDatetime: lateTarget });
    expect(derivePostingStatus(p, at('2026-06-12T20:15:00Z'))).toBe('due');
  });

  it('D10: 00:21 Dubai next day → missed', () => {
    const p = mkPost({ targetDatetime: lateTarget });
    expect(derivePostingStatus(p, at('2026-06-12T20:21:00Z'))).toBe('missed');
  });

  it('respects per-post grace (60 min) over the default', () => {
    const p = mkPost({ targetDatetime: T, graceWindowMinutes: 60 });
    expect(derivePostingStatus(p, at('2026-06-12T17:25:00Z'))).toBe('due');
    expect(derivePostingStatus(p, at('2026-06-12T17:30:01Z'))).toBe('missed');
  });
});
