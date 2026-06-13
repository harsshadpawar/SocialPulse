// Service layer: fetch facts (Prisma), map to plain domain objects, derive truth (domain/),
// shape the DTO. Prisma types never leave this layer (decision #28).
import { deriveAdherence } from '../domain/adherence';
import { deriveCapabilities } from '../domain/capabilities';
import { deriveCardState, deriveWorkIsDone, selectTodayPost } from '../domain/selector';
import { derivePostingStatus } from '../domain/postingStatus';
import { deriveDraftSubState, deriveDueNotReady } from '../domain/subState';
import { isSameDay, isSameWeek } from '../domain/time';
import type { AdherenceStatus, Capabilities, CardState, DomainPost, DraftSubState, Format, Platform, PostingStatus, Readiness } from '../domain/types';
import { prisma } from '../db/client';

/** Wire DTO — dates as ISO strings, everything derived server-side (ADR-3). */
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
  /** v0.2a (D-30): derived refinement of Draft; null for non-drafts. */
  draftSubState: DraftSubState | null;
  /** v0.2a (D-31): the key failure mode — due while still draft. */
  dueNotReady: boolean;
  capabilities: Capabilities;
}

export interface TodayView {
  state: CardState | 'empty';
  post: PostView | null;
  /** Posts targeted on today's Dubai day (any state) — drives "N of N planned today". */
  plannedTodayCount: number;
  /** Of those, how many are already posted. */
  postedTodayCount: number;
  /** D-32: posted (actual_datetime) on today's Dubai day / in this Dubai ISO week — late counts. */
  postedOnDayCount: number;
  postedInWeekCount: number;
  /** D-33: NULL = no target set for that period. */
  target: { dailyTarget: number | null; weeklyTarget: number | null };
  /** v0.2b (D-34): derived "Today's work is done" — nothing actionable left + posted today. */
  workIsDone: boolean;
}

/** Prisma row (with idea) → plain domain object. The only place this mapping exists. */
interface PostRowShape {
  id: string;
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
  idea: { title: string; coreMessage: string };
}

export function toDomain(row: PostRowShape): DomainPost {
  return {
    id: row.id,
    ideaTitle: row.idea.title,
    coreMessage: row.idea.coreMessage,
    platform: row.platform,
    format: row.format,
    caption: row.caption,
    targetDatetime: row.targetDatetime,
    readiness: row.readiness,
    actualDatetime: row.actualDatetime,
    nativePostUrl: row.nativePostUrl,
    graceWindowMinutes: row.graceWindowMinutes,
    missedAcknowledgedAt: row.missedAcknowledgedAt,
    createdAt: row.createdAt,
  };
}

export function toView(post: DomainPost, now: Date): PostView {
  return {
    id: post.id,
    ideaTitle: post.ideaTitle,
    coreMessage: post.coreMessage,
    platform: post.platform,
    format: post.format,
    caption: post.caption,
    targetDatetime: post.targetDatetime?.toISOString() ?? null,
    readiness: post.readiness,
    postingStatus: derivePostingStatus(post, now),
    adherenceStatus: deriveAdherence(post, now),
    actualDatetime: post.actualDatetime?.toISOString() ?? null,
    nativePostUrl: post.nativePostUrl,
    graceWindowMinutes: post.graceWindowMinutes,
    cardState: deriveCardState(post, now),
    draftSubState: deriveDraftSubState(post),
    dueNotReady: deriveDueNotReady(post, now),
    capabilities: deriveCapabilities(post, now),
  };
}

/** Two reads per render (posts + the one-row target). `now` injected once per request (#29). */
export async function getTodayView(now: Date, tz: string): Promise<TodayView> {
  const [rows, targetRow] = await Promise.all([
    prisma.platformPost.findMany({ include: { idea: true } }),
    prisma.postingTarget.findUnique({ where: { id: 1 } }),
  ]);
  const posts = rows.map(toDomain);

  const targetedToday = posts.filter((p) => p.targetDatetime !== null && isSameDay(p.targetDatetime, now, tz));
  const plannedTodayCount = targetedToday.length;
  const postedTodayCount = targetedToday.filter((p) => p.actualDatetime !== null).length;

  // D-32: target progress counts by when it was POSTED, not when it was planned. Late counts.
  const postedOnDayCount = posts.filter((p) => p.actualDatetime !== null && isSameDay(p.actualDatetime, now, tz)).length;
  const postedInWeekCount = posts.filter((p) => p.actualDatetime !== null && isSameWeek(p.actualDatetime, now, tz)).length;

  const base = {
    plannedTodayCount,
    postedTodayCount,
    postedOnDayCount,
    postedInWeekCount,
    target: { dailyTarget: targetRow?.dailyTarget ?? null, weeklyTarget: targetRow?.weeklyTarget ?? null },
    workIsDone: deriveWorkIsDone(posts, now, tz),
  };

  const selected = selectTodayPost(posts, now, tz);
  if (selected === null) return { state: 'empty', post: null, ...base };
  const view = toView(selected, now);
  return { state: view.cardState, post: view, ...base };
}
