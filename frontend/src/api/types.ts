// Hand-mirrored from backend services/today.service.ts (frozen after v0.1 — decision: no shared package yet).
// The frontend renders these; it NEVER re-derives status (ADR-3).

export type Platform = 'linkedin' | 'x' | 'youtube' | 'instagram';
export type Format = 'text_post' | 'short_post' | 'short_video' | 'reel';
export type Readiness = 'draft' | 'ready';
export type PostingStatus = 'planned' | 'due' | 'posted' | 'missed';
export type AdherenceStatus = 'not_applicable' | 'on_time' | 'late' | 'missed';
export type CardState = 'draft' | 'planned_ready' | 'due' | 'posted' | 'missed';

export interface Capabilities {
  canEditPrepare: boolean;
  canEditTarget: boolean;
  canMarkReady: boolean;
  canMarkPosted: boolean;
  canAcknowledgeMissed: boolean;
  canEditActual: boolean;
  canSetUrl: boolean;
}

export interface PostView {
  id: string;
  ideaTitle: string;
  coreMessage: string;
  platform: Platform;
  format: Format;
  caption: string;
  targetDatetime: string | null;
  readiness: Readiness;
  postingStatus: PostingStatus;
  adherenceStatus: AdherenceStatus;
  actualDatetime: string | null;
  nativePostUrl: string | null;
  graceWindowMinutes: number;
  cardState: CardState;
  capabilities: Capabilities;
}

export interface TodayView {
  state: CardState | 'empty';
  post: PostView | null;
}
