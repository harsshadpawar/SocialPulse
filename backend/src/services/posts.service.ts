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
    },
    include: { idea: true },
  });

  return toView(toDomain(updated), now);
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
