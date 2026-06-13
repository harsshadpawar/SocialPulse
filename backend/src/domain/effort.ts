// v0.2c (D-38): effort is DERIVED from format — never stored (PRD §6.2). Pure; no schema.
// Capacity awareness (CS-12) is a derived weekly sum, surfaced as a calm informational line.
import { isSameWeek } from './time';
import type { DomainPost, EffortScore, Format } from './types';

const EFFORT_BY_FORMAT: Record<Format, EffortScore> = {
  text_post: 'low', // LinkedIn text post
  short_post: 'low', // X post
  reel: 'medium', // Instagram reel
  short_video: 'high', // YouTube video
};

export function deriveEffort(format: Format): EffortScore {
  return EFFORT_BY_FORMAT[format];
}

const WEIGHT: Record<EffortScore, number> = { low: 1, medium: 2, high: 3 };

export type WeeklyLoad = 'light' | 'moderate' | 'full';

export interface WeeklyEffort {
  /** Posts targeted in this Dubai ISO week. */
  posts: number;
  /** Sum of effort weights (low 1 · medium 2 · high 3). */
  score: number;
  load: WeeklyLoad;
}

function loadFor(score: number): WeeklyLoad {
  if (score <= 3) return 'light';
  if (score <= 6) return 'moderate';
  return 'full';
}

/** v0.2c (D-38): planned effort for the current Dubai ISO week — fully derived, no storage.
 *  Counts posts whose target falls in this week (reuses the v0.2a isSameWeek helper). */
export function deriveWeeklyEffort(posts: readonly DomainPost[], now: Date, tz: string): WeeklyEffort {
  const inWeek = posts.filter((p) => p.targetDatetime !== null && isSameWeek(p.targetDatetime, now, tz));
  const score = inWeek.reduce((sum, p) => sum + WEIGHT[deriveEffort(p.format)], 0);
  return { posts: inWeek.length, score, load: loadFor(score) };
}
