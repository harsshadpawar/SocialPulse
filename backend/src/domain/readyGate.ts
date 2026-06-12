// The Mark Ready gentle gate (brief §6): the button is always clickable;
// missing fields produce GUIDANCE, never a red validation error.
// Domain returns the missing-field KEY; the frontend owns the verbatim words (ADR-3 refinement).
import type { DomainPost } from './types';

export type ReadyMissing = 'caption' | 'platform' | 'format' | 'target';

/** First missing requirement for Mark Ready, or null when complete.
 *  Checks (in voice order): caption · platform · format · target time. */
export function firstMissingForReady(post: DomainPost): ReadyMissing | null {
  if (post.caption.trim() === '') return 'caption';
  if (!post.platform) return 'platform'; // defensive — platform/format default at creation
  if (!post.format) return 'format';
  if (post.targetDatetime === null) return 'target';
  return null;
}
