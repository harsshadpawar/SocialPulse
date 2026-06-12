// v0.2a (D-30/D-31, selector-spec amendment): derived draft sub-state + due-but-not-ready flag.
// Pure, stored nowhere — caption/target presence IS the state (ADR-2).
import { derivePostingStatus } from './postingStatus';
import type { DomainPost, DraftSubState } from './types';

/** Refinement of Draft. Null when the post isn't a draft (or is posted). */
export function deriveDraftSubState(post: DomainPost): DraftSubState | null {
  if (post.readiness !== 'draft' || post.actualDatetime !== null) return null;
  if (post.caption.trim() === '') return 'needs_caption';
  if (post.targetDatetime === null) return 'needs_schedule';
  return 'ready_to_mark';
}

/** The key failure mode (spec §9): the moment arrived but the post isn't marked ready.
 *  Due only — once grace lapses, the missed copy governs (D19). */
export function deriveDueNotReady(post: DomainPost, now: Date): boolean {
  return post.readiness === 'draft' && derivePostingStatus(post, now) === 'due';
}
