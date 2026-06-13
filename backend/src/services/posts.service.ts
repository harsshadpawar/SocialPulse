// Service layer = enforcement + the applyTransition choke point (decision #24).
// All mutations re-derive state from a fresh row + injected `now` — UI staleness can't bypass rules.
import { deriveCapabilities } from '../domain/capabilities';
import { firstMissingForReady } from '../domain/readyGate';
import type { ReadyMissing } from '../domain/readyGate';
import { ALL_PLATFORMS, PLATFORM_FORMATS, isValidPair } from '../domain/constants';
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

/** v0.2c (D-37): the platforms this idea has no post on yet — repurpose targets. */
function repurposeTargetsFor(usedPlatforms: Platform[]): Platform[] {
  const used = new Set(usedPlatforms);
  return ALL_PLATFORMS.filter((p) => !used.has(p));
}

export async function getPostView(id: string, now: Date): Promise<PostView> {
  const row = await prisma.platformPost.findUnique({
    where: { id },
    include: { idea: { include: { posts: { select: { platform: true } } } } },
  });
  if (!row) throw new AppError(404, 'post_not_found', 'This post does not exist.');
  const targets = repurposeTargetsFor(row.idea.posts.map((p) => p.platform));
  return toView(toDomain(row), now, targets);
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

  // ADR-5: adherence-relevant edits are logged in the same transaction.
  const newTarget =
    input.targetDatetime !== undefined ? (input.targetDatetime === null ? null : new Date(input.targetDatetime)) : undefined;
  const targetChanged =
    newTarget !== undefined && (newTarget?.getTime() ?? null) !== (post.targetDatetime?.getTime() ?? null);
  const newActual = input.actualDatetime !== undefined ? new Date(input.actualDatetime) : undefined;
  const actualChanged = newActual !== undefined && newActual.getTime() !== post.actualDatetime?.getTime();

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.platformPost.update({
      where: { id },
      data: {
        platform,
        format,
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
        ...(newTarget !== undefined ? { targetDatetime: newTarget } : {}),
        ...(newActual !== undefined ? { actualDatetime: newActual } : {}),
        ...(input.nativePostUrl !== undefined ? { nativePostUrl: input.nativePostUrl } : {}),
      },
      include: { idea: true },
    });
    if (targetChanged) {
      await tx.adherenceEvent.create({
        data: {
          platformPostId: id,
          eventType: 'target_edited',
          at: now,
          oldValue: post.targetDatetime?.toISOString() ?? null,
          newValue: newTarget?.toISOString() ?? null,
        },
      });
    }
    if (actualChanged) {
      await tx.adherenceEvent.create({
        data: {
          platformPostId: id,
          eventType: 'actual_edited',
          at: now,
          oldValue: post.actualDatetime?.toISOString() ?? null,
          newValue: newActual?.toISOString() ?? null,
        },
      });
    }
    return row;
  });

  return toView(toDomain(updated), now);
}

/** Repurpose (v0.2c, D-37): spawn a sibling PlatformPost on another platform under the same idea.
 *  Caption seeds from the SOURCE post's caption; falls back to the idea's core message when blank
 *  (real repurposing starts from existing copy). One post per platform per idea. Logs 'created'. */
export async function repurpose(id: string, platform: Platform, now: Date): Promise<PostView> {
  const source = await prisma.platformPost.findUnique({
    where: { id },
    include: { idea: { include: { posts: { select: { platform: true } } } } },
  });
  if (!source) throw new AppError(404, 'post_not_found', 'This post does not exist.');
  const used = source.idea.posts.map((p) => p.platform);
  if (used.includes(platform)) {
    throw new AppError(409, 'platform_exists', `This idea already has a ${platform} post.`);
  }
  const format = PLATFORM_FORMATS[platform][0]!; // v0.1 has exactly one format per platform
  const seededCaption = source.caption.trim() !== '' ? source.caption : source.idea.coreMessage;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.platformPost.create({
      data: { contentIdeaId: source.contentIdeaId, platform, format, caption: seededCaption },
      include: { idea: true },
    });
    await tx.adherenceEvent.create({
      data: { platformPostId: row.id, eventType: 'created', at: now, newValue: `${platform}/${format}` },
    });
    return row;
  });

  return toView(toDomain(created), now, repurposeTargetsFor([...used, platform]));
}

/** Quick Start (v0.2b, D-35): seed the caption from the idea's core message so a blank draft can
 *  move. Never schedules, marks ready, or posts — those stay the creator's attestations. No event
 *  logged (caption edits aren't in ADR-5; logging would need a schema change we're deferring). */
export async function quickStart(id: string, now: Date): Promise<PostView> {
  const post = await loadDomainPost(id);
  const caps = deriveCapabilities(post, now);
  if (!caps.canQuickStart) {
    throw new AppError(409, 'cannot_quick_start', 'Quick Start needs a blank caption and a saved core message.');
  }
  const updated = await prisma.platformPost.update({
    where: { id },
    data: { caption: post.coreMessage.trim() },
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

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.platformPost.update({
      where: { id },
      data: {
        actualDatetime: actual,
        ...(input.nativePostUrl !== undefined && input.nativePostUrl !== '' ? { nativePostUrl: input.nativePostUrl } : {}),
      },
      include: { idea: true },
    });
    await tx.adherenceEvent.create({
      data: { platformPostId: id, eventType: 'marked_posted', at: now, newValue: actual.toISOString() },
    });
    return row;
  });

  const event: TransitionEvent = { type: 'PostMarkedPosted', postId: id, at: now, actualDatetime: actual };
  return { post: toView(toDomain(updated), now), event };
}

/** "Keep as Missed" — files the miss (decision #17). The verdict stays Missed (derived);
 *  this attestation only tells the Today selector to stop surfacing it. Idempotent. */
export async function acknowledgeMissed(id: string, now: Date): Promise<{ post: PostView; event: TransitionEvent | null }> {
  const post = await loadDomainPost(id);
  const caps = deriveCapabilities(post, now);

  if (post.missedAcknowledgedAt !== null) {
    return { post: toView(post, now), event: null }; // already filed
  }
  if (!caps.canAcknowledgeMissed) {
    throw new AppError(409, 'not_missed', 'Only a missed post can be kept as missed.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.platformPost.update({
      where: { id },
      data: { missedAcknowledgedAt: now },
      include: { idea: true },
    });
    await tx.adherenceEvent.create({
      data: { platformPostId: id, eventType: 'missed_acknowledged', at: now },
    });
    return row;
  });

  const event: TransitionEvent = { type: 'MissedAcknowledged', postId: id, at: now };
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

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.platformPost.update({
      where: { id },
      data: { readiness: 'ready' },
      include: { idea: true },
    });
    await tx.adherenceEvent.create({
      data: { platformPostId: id, eventType: 'marked_ready', at: now, oldValue: 'draft', newValue: 'ready' },
    });
    return row;
  });

  const event: TransitionEvent = { type: 'PostMarkedReady', postId: id, at: now };
  return { ready: true, missing: null, post: toView(toDomain(updated), now), event };
}
