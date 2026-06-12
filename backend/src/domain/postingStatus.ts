// posting_status is DERIVED, never stored (ADR-2). First match wins (selector-spec §1).
import type { DomainPost, PostingStatus } from './types';

const MINUTE_MS = 60_000;

export function graceMs(post: Pick<DomainPost, 'graceWindowMinutes'>): number {
  return post.graceWindowMinutes * MINUTE_MS;
}

export function derivePostingStatus(post: DomainPost, now: Date): PostingStatus {
  if (post.actualDatetime !== null) return 'posted';
  if (post.targetDatetime === null) return 'planned'; // unscheduled draft
  const target = post.targetDatetime.getTime();
  const t = now.getTime();
  if (t < target) return 'planned';
  if (t <= target + graceMs(post)) return 'due'; // boundary inclusive
  return 'missed';
}
