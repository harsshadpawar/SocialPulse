// Domain possibilities (decision #22). Server-derived; the UI maps these to buttons.
import { derivePostingStatus } from './postingStatus';
import type { Capabilities, DomainPost } from './types';

export function deriveCapabilities(post: DomainPost, now: Date): Capabilities {
  const status = derivePostingStatus(post, now);
  const posted = post.actualDatetime !== null;
  return {
    canEditPrepare: !posted,
    // Frozen invariant (#10): target is immutable from Due onward.
    canEditTarget: !posted && status === 'planned',
    canMarkReady: !posted && post.readiness === 'draft',
    // Works from Planned (early posting, decision #4), Due, and Missed (non-destructive).
    canMarkPosted: !posted && post.readiness === 'ready',
    canAcknowledgeMissed: !posted && status === 'missed' && post.missedAcknowledgedAt === null,
    canEditActual: posted,
    canSetUrl: posted, // URL field must not exist before Posted (decision #18)
  };
}
