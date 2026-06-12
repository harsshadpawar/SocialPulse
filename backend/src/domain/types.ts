// domain/ is PURE: imports nothing but types, performs no IO, never reads the clock.
// (Decisions #26, #28, #29 — see docs/selector-spec.md)

export type Platform = 'linkedin' | 'x' | 'youtube' | 'instagram';
export type Format = 'text_post' | 'short_post' | 'short_video' | 'reel';
export type Readiness = 'draft' | 'ready';

/** Derived — never stored (ADR-2). */
export type PostingStatus = 'planned' | 'due' | 'posted' | 'missed';
export type AdherenceStatus = 'not_applicable' | 'on_time' | 'late' | 'missed';

/** Drives Today's Command line, chips, primary CTA, microcopy (selector-spec §1). */
export type CardState = 'draft' | 'planned_ready' | 'due' | 'posted' | 'missed';

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
}
