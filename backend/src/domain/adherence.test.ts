// Golden table D6–D8, D11–D13 (docs/selector-spec.md §5).
import { describe, expect, it } from 'vitest';
import { deriveAdherence } from './adherence';
import { mkPost } from './testFixtures';

const T = new Date('2026-06-12T16:30:00Z'); // 8:30 PM Dubai
const at = (iso: string) => new Date(iso);

describe('deriveAdherence', () => {
  it('not posted, not missed → not_applicable', () => {
    const p = mkPost({ targetDatetime: T });
    expect(deriveAdherence(p, at('2026-06-12T16:00:00Z'))).toBe('not_applicable');
  });

  it('not posted, grace lapsed → missed', () => {
    const p = mkPost({ targetDatetime: T });
    expect(deriveAdherence(p, at('2026-06-12T17:00:01Z'))).toBe('missed');
  });

  it('D6: actual == target + 30:00 exactly → on_time (boundary)', () => {
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T17:00:00Z') });
    expect(deriveAdherence(p, at('2026-06-12T18:00:00Z'))).toBe('on_time');
  });

  it('D7: actual == target + 30:01 → late', () => {
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T17:00:01Z') });
    expect(deriveAdherence(p, at('2026-06-12T18:00:00Z'))).toBe('late');
  });

  it('D8: target 23:55 Dubai, actual 00:10 Dubai next day → on_time (15 min, crosses midnight)', () => {
    const p = mkPost({
      targetDatetime: at('2026-06-12T19:55:00Z'), // 23:55 Dubai
      actualDatetime: at('2026-06-12T20:10:00Z'), // 00:10 Dubai Jun 13
    });
    expect(deriveAdherence(p, at('2026-06-13T05:00:00Z'))).toBe('on_time');
  });

  it('D11: early post (actual < target) → on_time, no Posted-Early status (decision #4)', () => {
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T15:00:00Z') });
    expect(deriveAdherence(p, at('2026-06-12T18:00:00Z'))).toBe('on_time');
  });

  it('D12: missed, then posted past grace → late', () => {
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T18:25:00Z') }); // 9:25 PM Dubai
    expect(deriveAdherence(p, at('2026-06-12T19:00:00Z'))).toBe('late');
  });

  it('D13: missed→posted, actual later edited into the grace window → on_time (derived rule wins, #9)', () => {
    // User marked posted at 9:25 PM (late), then edited actual to 8:50 PM — within grace.
    const p = mkPost({ targetDatetime: T, actualDatetime: at('2026-06-12T16:50:00Z') });
    expect(deriveAdherence(p, at('2026-06-12T19:00:00Z'))).toBe('on_time');
  });

  it('adherence verdict is independent of acknowledgement (attestation ≠ derivation)', () => {
    const p = mkPost({ targetDatetime: T, missedAcknowledgedAt: at('2026-06-12T18:00:00Z') });
    expect(deriveAdherence(p, at('2026-06-12T19:00:00Z'))).toBe('missed');
  });
});
