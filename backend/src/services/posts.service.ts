// Service layer = enforcement + the applyTransition choke point (decision #24).
// All mutations re-derive state from a fresh row + injected `now` — UI staleness can't bypass rules.
import { deriveCapabilities } from '../domain/capabilities';
import { firstMissingForReady } from '../domain/readyGate';
import type { ReadyMissing } from '../domain/readyGate';
import { isValidPair } from '../domain/constants';
import type { Format, Platform } from '../domain/types';
import type { TransitionEvent } from '../domain/transitions';
import { AppError } from '../middleware/error';
import { prisma } from '../db/client';
import { toDomain, toView } from './today.service';
import type { PostView } from './today.service';

async function loadDomainPost(id: string) {
  const row = await prisma.platformPost.findUnique({ where: { id }, include: { idea: true } });
  if (!row) throw new AppError(404, 'post_not_found', 'This post does not exist.');
  return toDomain(row);
}

export async function getPostView(id: string, now: Date): Promise<PostView> {
  return toView(await loadDomainPost(id), now);
}

export interface UpdatePostInput {
  platform?: Platform;
  format?: Format;
  caption?: string;
  targetDatetime?: string | null; // ISO; explicit null clears (Draft only)
  actualDatetime?: string; // Posted only (#18, #21) — edits recompute adherence implicitly
  nativePostUrl?: string | null; // Posted only (#18); null clears
}

/** Small clock-skew allowance for "not in the future" checks. */
const FUTURE_SKEW_MS = 2 * 60_000;

function assertNotFuture(actual: Date, now: Date): void {
  if (actual.getTime() > now.getTime() + FUTURE_SKEW_MS) {
    throw new AppError(400, 'actual_in_future', "The posted time can't be in the future.");
  }
}

export async function updatePost(id: string, input: UpdatePostInput, now: Date): Promise<PostView> {
  const post = await loadDomainPost(id);
  const caps = deriveCapabilities(post, now);

  const touchesPrepare = input.platform !== undefined || input.format !== undefined || input.caption !== undefined;
  if (touchesPrepare && !caps.canEditPrepare) {
    throw new AppError(409, 'post_already_posted', 'This post is already posted — its content is settled.');
  }

  if (input.targetDatetime !== undefined && !caps.canEditTarget) {
    // Frozen invariant #10: target immutable from Due onward. Calm conflict, not a scolding.
    throw new AppError(409, 'target_locked', 'The target time is locked once a post is due.');
  }

  if (input.actualDatetime !== undefined) {
    if (!caps.canEditActual) {
      throw new AppError(409, 'not_posted_yet', 'The posted time exists only after Mark Posted.');
    }
    assertNotFuture(new Date(input.actualDatetime), now);
  }

  if (input.nativePostUrl !== undefined && !caps.canSetUrl) {
    // Tweak 3: the URL field must not exist before Mark Posted (#18).
    throw new AppError(409, 'not_posted_yet', 'The post link is added after Mark Posted.');
  }

  const platform = input.platform ?? post.platform;
  const format = input.format ?? post.format;
  if (!isValidPair(platform, format)) {
    throw new AppError(400, 'invalid_pair', `${format} is not the v0.1 format for ${platform}.`);
  }

  const updated = await prisma.platformPost.update({
    where: { id },
    data: {
      platform,
      format,
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.targetDatetime !== undefined
        ? { targetDatetime: input.targetDatetime === null ? null : new Date(input.targetDatetime) }
        : {}),
      ...(input.actualDatetime !== undefined ? { actualDatetime: new Date(input.actualDatetime) } : {}),
      ...(input.nativePostUrl !== undefined ? { nativePostUrl: input.nativePostUrl } : {}),
    },
    include: { idea: true },
  });

  return toView(toDomain(updated), now);
}

export interface MarkPostedInput {
  actualDatetime?: string; // ISO; defaults to now (the sheet prefill is editable)
  nativePostUrl?: string; // optional — "Skip link for now" is a first-class path
}

/** The Mark Posted attestation (brief §7). Works from Planned (#4), Due, and Missed (non-destructive). */
export async function markPosted(id: string, input: MarkPostedInput, now: Date): Promise<{ post: PostView; event: TransitionEvent }> {
  const post = await loadDomainPost(id);
  const caps = deriveCapabilities(post, now);

  if (post.actualDatetime !== null) {
    throw new AppError(409, 'post_already_posted', 'This post is already marked posted.');
  }
  if (!caps.canMarkPosted) {
    // Only remaining reason: not Ready (e.g. a missed draft) — gentle, plan-focused.
    throw new AppError(409, 'not_ready', 'Mark this post Ready before marking it posted.');
  }

  const actual = input.actualDatetime !== undefined ? new Date(input.actualDatetime) : now;
  assertNotFuture(actual, now);

  const updated = await prisma.platformPost.update({
    where: { id },
    data: {
      actualDatetime: actual,
      ...(input.nativePostUrl !== undefined && input.nativePostUrl !== '' ? { nativePostUrl: input.nativePostUrl } : {}),
    },
    include: { idea: true },
  });

  const event: TransitionEvent = { type: 'PostMarkedPosted', postId: id, at: now, actualDatetime: actual };
  // v0.2 hook: audit trail (AdherenceEvent) attaches to `event` here.
  return { post: toView(toDomain(updated), now), event };
}

export interface MarkReadyResult {
  ready: boolean;
  missing: ReadyMissing | null;
  post: PostView;
  event: TransitionEvent | null;
}

/** Gentle gate: incomplete is a 200 with guidance key — never an error (decision #20). */
export async function markReady(id: string, now: Date): Promise<MarkReadyResult> {
  const post = await loadDomainPost(id);

  if (post.actualDatetime !== null) {
    throw new AppError(409, 'post_already_posted', 'This post is already posted.');
  }
  if (post.readiness === 'ready') {
    return { ready: true, missing: null, post: toView(post, now), event: null }; // idempotent
  }

  const missing = firstMissingForReady(post);
  if (missing !== null) {
    return { ready: false, missing, post: toView(post, now), event: null };
  }

  const updated = await prisma.platformPost.update({
    where: { id },
    data: { readiness: 'ready' },
    include: { idea: true },
  });

  const event: TransitionEvent = { type: 'PostMarkedReady', postId: id, at: now };
  // v0.2 hook: reminder scheduling / audit log attaches to `event` here.
  return { ready: true, missing: null, post: toView(toDomain(updated), now), event };
}
