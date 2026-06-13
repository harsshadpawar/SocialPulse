// v0.2d (D-45): Calendar week realism — the overload rule, computed once, words owned by the client.
// Server returns facts (effort, capacity, the heavy day, missed count) + a derived state enum; the
// client maps to the calm microcopy. Never red. Pure; clock + tz injected.
import { deriveEffort, deriveWeeklyEffort } from './effort';
import { derivePostingStatus } from './postingStatus';
import { dayKey, isSameWeek } from './time';
import type { DomainPost } from './types';

export type WeekState = 'empty' | 'healthy' | 'overload' | 'missed';

export interface WeekRealism {
  /** Sum of effort points this week (low 1 · med 2 · high 3) — the capacity meter's "used". */
  totalEffort: number;
  capacity: number | null;
  overCapacity: boolean;
  /** A Dubai day with ≥2 high-effort posts (the second overload trigger), or null. */
  heavyDayKey: string | null;
  missedCount: number;
  hasPosts: boolean;
  state: WeekState;
}

/** Overload fires when effort exceeds capacity OR two+ high-effort posts land on one day (§7).
 *  v0.2h: `weekRef` selects WHICH week (defaults to now); post STATUS (missed) is always derived
 *  against the real `now`, so a navigated future week reads its posts as planned, not missed. */
export function deriveWeekRealism(
  posts: readonly DomainPost[],
  now: Date,
  tz: string,
  capacity: number | null,
  weekRef: Date = now,
): WeekRealism {
  const inWeek = posts.filter((p) => p.targetDatetime !== null && isSameWeek(p.targetDatetime, weekRef, tz));
  const totalEffort = deriveWeeklyEffort(posts, now, tz, weekRef).score; // one effort derivation (v0.2c)

  const highByDay = new Map<string, number>();
  for (const p of inWeek) {
    if (deriveEffort(p.format) === 'high' && p.targetDatetime !== null) {
      const k = dayKey(p.targetDatetime, tz);
      highByDay.set(k, (highByDay.get(k) ?? 0) + 1);
    }
  }
  let heavyDayKey: string | null = null;
  for (const [k, n] of highByDay) {
    if (n >= 2) {
      heavyDayKey = k;
      break;
    }
  }

  const missedCount = inWeek.filter((p) => derivePostingStatus(p, now) === 'missed').length;
  const overCapacity = capacity !== null && totalEffort > capacity;
  const hasPosts = inWeek.length > 0;

  let state: WeekState;
  if (!hasPosts) state = 'empty';
  else if (overCapacity || heavyDayKey !== null) state = 'overload';
  else if (missedCount > 0) state = 'missed';
  else state = 'healthy';

  return { totalEffort, capacity, overCapacity, heavyDayKey, missedCount, hasPosts, state };
}
