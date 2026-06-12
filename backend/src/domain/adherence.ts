// adherence_status is DERIVED from target vs actual + grace — never set by hand (ADR-2, decision #9).
// Editing actual_datetime recomputes this implicitly: there is nothing else to update.
import { derivePostingStatus, graceMs } from './postingStatus';
import type { AdherenceStatus, DomainPost } from './types';

export function deriveAdherence(post: DomainPost, now: Date): AdherenceStatus {
  if (post.actualDatetime === null) {
    return derivePostingStatus(post, now) === 'missed' ? 'missed' : 'not_applicable';
  }
  // Invariant: actual implies target (Mark Posted requires Ready, Ready requires target).
  // Defensive: if violated by bad data, report not_applicable rather than guessing.
  if (post.targetDatetime === null) return 'not_applicable';
  const limit = post.targetDatetime.getTime() + graceMs(post);
  // Early posts (actual < target) are On-time — no "Posted Early" status in v0.1 (decision #4).
  return post.actualDatetime.getTime() <= limit ? 'on_time' : 'late';
}
