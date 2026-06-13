// ADR-4: "The selector is the executable representation of the product promise:
// 'interpret the day for the creator.'"
//
// The selector may evolve. The inputs may evolve. The ranking may evolve.
// The selector must remain pure. Time is injected, forever (#26, #29).
// Output ordering is deterministic: no randomization, no time reads, no hidden state.
//
// Priority order (docs/selector-spec.md §3) — declared data, not nested ifs:
//   1. Due (earliest target)            — the only time-critical class; its window is burning
//   2. Missed, unacknowledged           — needs filing, but has no deadline
//   3. Ready+Planned targeted today     — earliest target
//   4. Draft (targeted today, then untargeted newest)
//   5. Posted today (latest actual)
//   none → null → empty state
import { derivePostingStatus } from './postingStatus';
import { isSameDay } from './time';
import type { CardState, DomainPost, PostingStatus } from './types';

interface Candidate {
  post: DomainPost;
  status: PostingStatus;
}

/** Lower index = higher priority. Returns null when the candidate belongs to no class. */
function classOf(c: Candidate, now: Date, tz: string): number | null {
  const { post, status } = c;
  if (status === 'due') return 1;
  if (status === 'missed') return post.missedAcknowledgedAt === null ? 2 : null;
  if (status === 'planned') {
    const targetedToday = post.targetDatetime !== null && isSameDay(post.targetDatetime, now, tz);
    if (post.readiness === 'ready') return targetedToday ? 3 : null; // future days invisible (S12)
    // Drafts: targeted today OR untargeted (untargeted must never be lost — no list view exists)
    return targetedToday || post.targetDatetime === null ? 4 : null;
  }
  // posted — visible only on the day it was posted
  if (post.actualDatetime !== null && isSameDay(post.actualDatetime, now, tz)) return 5;
  return null;
}

/** Within-class order. Classes 1–4: earliest target first, nulls last; class 5: latest actual first.
 *  Ties: newest createdAt, then id — fully deterministic. */
function compareWithinClass(a: Candidate, b: Candidate, cls: number): number {
  if (cls === 5) {
    const diff = (b.post.actualDatetime?.getTime() ?? 0) - (a.post.actualDatetime?.getTime() ?? 0);
    if (diff !== 0) return diff;
  } else {
    const at = a.post.targetDatetime?.getTime();
    const bt = b.post.targetDatetime?.getTime();
    if (at !== undefined && bt !== undefined && at !== bt) return at - bt;
    if (at !== undefined && bt === undefined) return -1; // targeted before untargeted
    if (at === undefined && bt !== undefined) return 1;
  }
  const created = b.post.createdAt.getTime() - a.post.createdAt.getTime(); // newest first
  if (created !== 0) return created;
  return a.post.id < b.post.id ? -1 : a.post.id > b.post.id ? 1 : 0;
}

export function selectTodayPost(posts: readonly DomainPost[], now: Date, tz: string): DomainPost | null {
  let best: { candidate: Candidate; cls: number } | null = null;
  for (const post of posts) {
    const candidate: Candidate = { post, status: derivePostingStatus(post, now) };
    const cls = classOf(candidate, now, tz);
    if (cls === null) continue;
    if (
      best === null ||
      cls < best.cls ||
      (cls === best.cls && compareWithinClass(candidate, best.candidate, cls) < 0)
    ) {
      best = { candidate, cls };
    }
  }
  return best?.candidate.post ?? null;
}

/** v0.2b (D-34): a post still needs action *today* — selector classes 1–4 (due, unacknowledged
 *  missed, ready+planned-today, loose draft). Class 5 (posted-today) and out-of-scope posts are NOT
 *  actionable. Pure; shares classOf with the selector so the two can never drift. */
export function isActionableToday(post: DomainPost, now: Date, tz: string): boolean {
  const cls = classOf({ post, status: derivePostingStatus(post, now) }, now, tz);
  return cls !== null && cls <= 4;
}

/** v0.2b (D-34): "Today's work is done" — fully DERIVED, no persistence (day_closure deferred until
 *  30–50 real cycles). True when nothing remains actionable today AND at least one post went live
 *  on today's Dubai day. A clear day with nothing posted stays `empty`, not done. */
export function deriveWorkIsDone(posts: readonly DomainPost[], now: Date, tz: string): boolean {
  const nothingActionable = !posts.some((p) => isActionableToday(p, now, tz));
  const postedToday = posts.some((p) => p.actualDatetime !== null && isSameDay(p.actualDatetime, now, tz));
  return nothingActionable && postedToday;
}

/** Card state key — drives command line, chips, CTA, microcopy (selector-spec §1). */
export function deriveCardState(post: DomainPost, now: Date): CardState {
  const status = derivePostingStatus(post, now);
  if (status === 'posted') return 'posted';
  if (status === 'missed') return 'missed';
  if (post.readiness === 'draft') return 'draft'; // incl. draft-past-target: due-but-not-ready prompt is v0.2
  return status === 'due' ? 'due' : 'planned_ready';
}
