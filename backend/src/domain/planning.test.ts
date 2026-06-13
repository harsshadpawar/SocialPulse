// v0.2d (D-45): Calendar week realism / overload rule. NOW = Fri Jun 12 (Dubai); week Jun 8–14.
// Planning scenarios use the week's still-future days (Sat 13 / Sun 14) so posts read as Planned,
// not Missed. (Dubai = UTC+4: keep UTC times ≤ 19:00 to stay on the intended calendar day.)
import { describe, expect, it } from 'vitest';
import { deriveWeekRealism } from './planning';
import { mkPost, NOW, TZ } from './testFixtures';

const at = (iso: string) => new Date(iso);
const video = (iso: string) => mkPost({ platform: 'youtube', format: 'long_video', targetDatetime: at(iso) }); // effort 3 (high)
const textPost = (iso: string) => mkPost({ format: 'text_post', targetDatetime: at(iso) }); // effort 1
const reel = (iso: string) => mkPost({ platform: 'instagram', format: 'reel', targetDatetime: at(iso) }); // effort 2

describe('deriveWeekRealism (v0.2d D-45)', () => {
  it('no posts → empty', () => {
    const r = deriveWeekRealism([], NOW, TZ, 5);
    expect(r.state).toBe('empty');
    expect(r.totalEffort).toBe(0);
    expect(r.hasPosts).toBe(false);
  });

  it('light week under capacity, no heavy day, no miss → healthy', () => {
    const r = deriveWeekRealism([textPost('2026-06-13T09:00:00Z'), reel('2026-06-14T09:00:00Z')], NOW, TZ, 5);
    expect(r.totalEffort).toBe(3); // 1 + 2
    expect(r.state).toBe('healthy');
    expect(r.overCapacity).toBe(false);
    expect(r.heavyDayKey).toBeNull();
  });

  it('effort over capacity (videos on different days) → overload by capacity', () => {
    const r = deriveWeekRealism([video('2026-06-13T15:00:00Z'), video('2026-06-14T06:00:00Z')], NOW, TZ, 5);
    expect(r.totalEffort).toBe(6); // 3 + 3
    expect(r.overCapacity).toBe(true);
    expect(r.heavyDayKey).toBeNull();
    expect(r.state).toBe('overload');
  });

  it('two high-effort posts on the same day → overload by heavy day (even under capacity)', () => {
    const r = deriveWeekRealism([video('2026-06-14T06:00:00Z'), video('2026-06-14T08:00:00Z')], NOW, TZ, 10);
    expect(r.overCapacity).toBe(false); // 6 <= 10
    expect(r.heavyDayKey).toBe('2026-06-14');
    expect(r.state).toBe('overload');
  });

  it('the canonical overloaded week (one day ×1, next day ×2 videos, capacity 5) overloads', () => {
    const r = deriveWeekRealism(
      [video('2026-06-13T15:00:00Z'), video('2026-06-14T06:00:00Z'), video('2026-06-14T08:00:00Z')],
      NOW,
      TZ,
      5,
    );
    expect(r.totalEffort).toBe(9); // 3×3
    expect(r.overCapacity).toBe(true);
    expect(r.heavyDayKey).toBe('2026-06-14'); // the day with two
    expect(r.state).toBe('overload');
  });

  it('a missed post, otherwise calm → missed state', () => {
    const r = deriveWeekRealism([mkPost({ readiness: 'ready', targetDatetime: at('2026-06-11T09:00:00Z') })], NOW, TZ, 5);
    expect(r.missedCount).toBe(1);
    expect(r.state).toBe('missed');
  });

  it('capacity unset never flags over-capacity (soft form is the client default)', () => {
    const r = deriveWeekRealism([video('2026-06-13T15:00:00Z'), video('2026-06-14T06:00:00Z')], NOW, TZ, null);
    expect(r.overCapacity).toBe(false);
    expect(r.capacity).toBeNull();
    expect(r.state).toBe('healthy'); // no heavy day, no miss
  });
});
