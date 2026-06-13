// v0.2d (D-44): the ONE shared weekly-metrics derivation. Calendar and Goals both read this —
// never recompute per screen, or a Goal card could disagree with the Calendar. Pure; clock injected.
import { deriveAdherence } from './adherence';
import { derivePostingStatus } from './postingStatus';
import { isSameWeek } from './time';
import type { Commitments, DomainPost } from './types';

export interface WeeklyMetrics {
  /** Posts targeted in this Dubai ISO week — the denominator. */
  planned: number;
  /** Posted this week (early/on-time/late all count as published). */
  published: number;
  /** Ready ahead of time, not yet posted, not missed. */
  preparedAhead: number;
  /** Targets this week that lapsed unposted. */
  missed: number;
  completionPct: number; // published / planned
  onTimePct: number; // on-time / published
  executionScore: number; // (on-time + late·0.5) / planned · 100 (PRD §5.3)
}

const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 100) : 0);

function postsInWeek(posts: readonly DomainPost[], now: Date, tz: string): DomainPost[] {
  return posts.filter((p) => p.targetDatetime !== null && isSameWeek(p.targetDatetime, now, tz));
}

export function deriveWeeklyMetrics(posts: readonly DomainPost[], now: Date, tz: string): WeeklyMetrics {
  const inWeek = postsInWeek(posts, now, tz);
  let published = 0;
  let missed = 0;
  let onTime = 0;
  let late = 0;
  let preparedAhead = 0;
  for (const p of inWeek) {
    if (p.actualDatetime !== null) {
      published += 1;
      if (deriveAdherence(p, now) === 'late') late += 1;
      else onTime += 1; // early folds into on-time (decision #4)
    } else if (derivePostingStatus(p, now) === 'missed') {
      missed += 1;
    } else if (p.readiness === 'ready') {
      preparedAhead += 1;
    }
  }
  const planned = inWeek.length;
  return {
    planned,
    published,
    preparedAhead,
    missed,
    completionPct: pct(published, planned),
    onTimePct: pct(onTime, published),
    executionScore: planned > 0 ? Math.round(((onTime + late * 0.5) / planned) * 100) : 0,
  };
}

export type GoalVerdict = 'on_rhythm' | 'ran_short' | 'none';

/** D-47 (non-punitive): never "ran short" mid-week on incomplete progress.
 *  Ran short only when missed reaches the ceiling, or the week's posts are ALL resolved
 *  (posted or missed) and completion fell short of target. Otherwise on rhythm. */
export function deriveVerdict(posts: readonly DomainPost[], now: Date, tz: string, c: Commitments): GoalVerdict {
  const hasCommitment =
    c.weeklyPublishTarget !== null ||
    c.prepareAheadTarget !== null ||
    c.completionTargetPct !== null ||
    c.missedCeiling !== null;
  if (!hasCommitment) return 'none';

  const m = deriveWeeklyMetrics(posts, now, tz);
  if (c.missedCeiling !== null && m.missed >= c.missedCeiling) return 'ran_short';

  const inWeek = postsInWeek(posts, now, tz);
  const allResolved =
    inWeek.length > 0 && inWeek.every((p) => p.actualDatetime !== null || derivePostingStatus(p, now) === 'missed');
  if (allResolved && c.completionTargetPct !== null && m.completionPct < c.completionTargetPct) return 'ran_short';

  return 'on_rhythm';
}
