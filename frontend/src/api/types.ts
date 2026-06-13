// Hand-mirrored from backend services/today.service.ts (frozen after v0.1 — decision: no shared package yet).
// The frontend renders these; it NEVER re-derives status (ADR-3).

export type Platform = 'linkedin' | 'x' | 'youtube' | 'instagram';
export type Format = 'text_post' | 'short_post' | 'short_video' | 'reel';
export type Readiness = 'draft' | 'ready';
export type PostingStatus = 'planned' | 'due' | 'posted' | 'missed';
export type AdherenceStatus = 'not_applicable' | 'on_time' | 'late' | 'missed';
export type CardState = 'draft' | 'planned_ready' | 'due' | 'posted' | 'missed';
export type DraftSubState = 'needs_caption' | 'needs_schedule' | 'ready_to_mark';
export type EffortScore = 'low' | 'medium' | 'high';
export type WeeklyLoad = 'light' | 'moderate' | 'full';

export interface WeeklyEffort {
  posts: number;
  score: number;
  load: WeeklyLoad;
}

export interface Capabilities {
  canEditPrepare: boolean;
  canEditTarget: boolean;
  canMarkReady: boolean;
  canMarkPosted: boolean;
  canAcknowledgeMissed: boolean;
  canEditActual: boolean;
  canSetUrl: boolean;
  canQuickStart: boolean;
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
  draftSubState: DraftSubState | null;
  dueNotReady: boolean;
  effortScore: EffortScore;
  repurposeTargets: Platform[];
  capabilities: Capabilities;
}

export interface TodayView {
  state: CardState | 'empty';
  post: PostView | null;
  plannedTodayCount: number;
  postedTodayCount: number;
  postedOnDayCount: number;
  postedInWeekCount: number;
  target: TargetView;
  /** v0.2b (D-34): derived "Today's work is done" — nothing actionable left + posted today. */
  workIsDone: boolean;
  /** v0.2c (D-38): planned effort for this Dubai ISO week. */
  weeklyEffort: WeeklyEffort;
}

export interface TargetView {
  dailyTarget: number | null;
  weeklyTarget: number | null;
}

export type ReadyMissing = 'caption' | 'platform' | 'format' | 'target';

export interface MarkReadyResponse {
  ready: boolean;
  missing: ReadyMissing | null;
  post: PostView;
}

export interface UpdatePostInput {
  platform?: Platform;
  format?: Format;
  caption?: string;
  targetDatetime?: string | null;
  actualDatetime?: string; // Posted only — server enforces
  nativePostUrl?: string | null; // Posted only — server enforces
}
