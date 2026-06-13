// v0.2c (D-38): effort is DERIVED from format — never stored (PRD §6.2). Pure; no schema.
// Capacity awareness (CS-12) is a derived weekly sum, surfaced as a calm informational line.
import { isSameWeek } from './time';
import type { DomainPost, EffortScore, Format } from './types';

// v0.2f: effort is per-format. Text/short posts/images are quick; carousels/threads/reels/short videos
// are medium; full videos are the heavy lift.
const EFFORT_BY_FORMAT: Record<Format, EffortScore> = {
  text_post: 'low',
  short_post: 'low',
  image: 'low',
  thread: 'medium',
  carousel: 'medium',
  reel: 'medium',
  short_video: 'medium',
  video: 'high',
  long_video: 'high',
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

/** v0.2c (D-38): planned effort for a Dubai ISO week — fully derived, no storage.
 *  Counts posts whose target falls in the week containing `weekRef` (defaults to now, so existing
 *  current-week callers are unaffected; the calendar passes a navigated anchor). v0.2h. */
export function deriveWeeklyEffort(posts: readonly DomainPost[], now: Date, tz: string, weekRef: Date = now): WeeklyEffort {
  const inWeek = posts.filter((p) => p.targetDatetime !== null && isSameWeek(p.targetDatetime, weekRef, tz));
  const score = inWeek.reduce((sum, p) => sum + WEIGHT[deriveEffort(p.format)], 0);
  return { posts: inWeek.length, score, load: loadFor(score) };
}
