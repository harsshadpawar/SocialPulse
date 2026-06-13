// domain/ is PURE: imports nothing but types, performs no IO, never reads the clock.
// (Decisions #26, #28, #29 — see docs/selector-spec.md)

export type Platform = 'linkedin' | 'x' | 'youtube' | 'instagram';
// v0.2f: formats are chosen per post (editable), no longer fixed one-per-platform.
export type Format =
  | 'text_post'
  | 'short_post'
  | 'short_video'
  | 'reel'
  | 'thread'
  | 'carousel'
  | 'video'
  | 'long_video'
  | 'image';
export type Readiness = 'draft' | 'ready';

/** Derived — never stored (ADR-2). */
export type PostingStatus = 'planned' | 'due' | 'posted' | 'missed';
export type AdherenceStatus = 'not_applicable' | 'on_time' | 'late' | 'missed';

/** Drives Today's Command line, chips, primary CTA, microcopy (selector-spec §1). */
export type CardState = 'draft' | 'planned_ready' | 'due' | 'posted' | 'missed';

/** v0.2a (D-30): derived refinement of Draft — never stored. Null for non-drafts. */
export type DraftSubState = 'needs_caption' | 'needs_schedule' | 'ready_to_mark';

/** v0.2c (D-38): derived from format — never stored. */
export type EffortScore = 'low' | 'medium' | 'high';

/** v0.2d (D-43): the Goal Setup commitments — one inline-edited row, all NULL-able.
 *  weeklyPublishTarget is the same column as the v0.2a posting target's weeklyTarget. */
export interface Commitments {
  weeklyPublishTarget: number | null;
  prepareAheadTarget: number | null;
  completionTargetPct: number | null;
  missedCeiling: number | null;
  weeklyCapacity: number | null;
}

/** Plain domain object — services map Prisma rows into this; Prisma types never cross this line. */
export interface DomainPost {
  id: string;
  ideaTitle: string;
  coreMessage: string;
  platform: Platform;
  format: Format;
  caption: string;
  targetDatetime: Date | null;
  readiness: Readiness;
  actualDatetime: Date | null;
  nativePostUrl: string | null;
  graceWindowMinutes: number;
  missedAcknowledgedAt: Date | null;
  createdAt: Date;
}

/** Domain possibilities, not UI verbs (decision #22). The frontend decides rendering. */
export interface Capabilities {
  canEditPrepare: boolean;
  canEditTarget: boolean;
  canMarkReady: boolean;
  canMarkPosted: boolean;
  canAcknowledgeMissed: boolean;
  canEditActual: boolean;
  canSetUrl: boolean;
  /** v0.2b (D-35): seed the caption from the idea's core message — blank-caption drafts only. */
  canQuickStart: boolean;
}
