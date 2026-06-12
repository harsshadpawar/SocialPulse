// The product's voice. Core strings VERBATIM from the handoff README; platform substitution
// per the hi-fi variants board: "Your {platform} {format-noun} is due now."
// Server owns state selection; this file owns the words (ADR-3 refinement).
import type { CardState, Platform, ReadyMissing } from '../api/types';
import type { Tone } from '../components/ui';
import { PLATFORM_META } from './platform';

/* ── Today's Command — one sentence, state-driven ── */

export function commandFor(state: CardState | 'empty', platform?: Platform): string {
  switch (state) {
    case 'empty':
      return "Today is clear. Prep tomorrow's post while you have energy.";
    case 'draft':
      return 'One post is planned for today — it still needs a caption.';
    case 'planned_ready':
      return 'One post is ready for today.';
    case 'due': {
      const meta = platform ? PLATFORM_META[platform] : PLATFORM_META.linkedin;
      return `Your ${meta.label} ${meta.formatNoun} is due now.`;
    }
    case 'posted':
      return "You're on track — nothing left due today.";
    case 'missed':
      return "Today's plan slipped — the post can still go live.";
  }
}

/** Sub-line under the command (hi-fi: due state only). */
export function commandSub(state: CardState | 'empty', platform?: Platform): string | undefined {
  if (state !== 'due') return undefined;
  const meta = platform ? PLATFORM_META[platform] : PLATFORM_META.linkedin;
  return `Open ${meta.label}, publish, then mark it posted here.`;
}

/** Eyebrow per state (hi-fi HT map). Posted differentiates on-time vs late. */
export function eyebrowFor(state: CardState | 'empty', adherence?: string): [Tone, string] {
  switch (state) {
    case 'empty':
      return ['dim', 'All clear'];
    case 'draft':
      return ['dim', 'Planned · in draft'];
    case 'planned_ready':
      return ['accent', 'Ready'];
    case 'due':
      return ['accent', 'Due now'];
    case 'posted':
      return adherence === 'late' ? ['late', 'Posted · late'] : ['success', 'Posted · on time'];
    case 'missed':
      return ['missed', 'Missed · still resolvable'];
  }
}

/* ── Card messages (README verbatim, platform-substituted) ── */

export function dueMessage(platform: Platform): string {
  const { label } = PLATFORM_META[platform];
  return `Time to post your ${label} item. Open ${label}, publish, then mark it posted here.`;
}

export const MISSED_MESSAGE =
  "This post didn't go live within the planned window. You can still mark it posted if you published it later.";

export const COPY_CAPTION_DISABLED_HELPER = 'Add caption first';

export const EMPTY_CARD_BODY = 'Nothing is due. When you plan a post, it appears here as the one thing to do.';

/* ── CTAs (frozen CTA table) ── */

export const PRIMARY_CTA: Record<CardState, string> = {
  draft: 'Continue editing',
  planned_ready: 'View post',
  due: 'Mark Posted',
  posted: 'View result',
  missed: 'Resolve item',
};

export const EMPTY_CTA = 'Create idea';

/* ── New Idea (capture) ── */

export const NEW_IDEA_EYEBROW = 'Capture';
export const NEW_IDEA_HEADING = "What's the idea?";
export const NEW_IDEA_SUB = "Title and core message — that's all. The post itself comes next.";
export const NEW_IDEA_CTA = 'Next → create the LinkedIn post';

/* ── Post Editor (staged workflow) ── */

export const READY_CONFIRM = 'Ready to post.';

/** Gentle gating guidance — caption string verbatim from the README; siblings in the same voice (#20). */
export const READY_GUIDANCE: Record<ReadyMissing, string> = {
  caption: 'Add a caption before marking ready.',
  platform: 'Pick a platform before marking ready.',
  format: 'Pick a format before marking ready.',
  target: 'Pick a target time before marking ready.',
};

export function captionPlaceholder(platform: Platform): string {
  return `Write the post exactly as it will be pasted into ${PLATFORM_META[platform].label}…`;
}

export const SCHEDULE_HELPER = 'Timezone: Asia/Dubai · 30-min grace window';
export const SAVE_DRAFT = 'Save Draft';
export const MARK_READY = 'Mark Ready';
export const MARK_POSTED = 'Mark Posted';
export const PUBLISH_LOCKED = 'Unlocks when the post is Ready';

/* ── Mark Posted ritual + Result (the reward moment) ── */

export const SHEET_EYEBROW = 'Posted ✓';
export const SHEET_TITLE = 'Nice. Add the post link?';
export const SHEET_URL_LABEL = 'Native post URL · optional';
export const SHEET_TIME_LABEL = 'Actual posted time';
export const SHEET_TIME_HELPER = 'Captured automatically — edit if you posted earlier. Result recalculates.';
export const SAVE_RESULT = 'Save result';
export const SKIP_LINK = 'Skip link for now';
export const BACK_TO_TODAY = 'Back to Today';

export const RESULT_TITLE: Record<'on_time' | 'late', string> = {
  on_time: 'Posted on time',
  late: "Posted — it's live",
};

export const RESULT_VOICE: Record<'on_time' | 'late', string> = {
  on_time: "Posted on time. That's the rhythm.",
  late: "Posted — a bit past your target, but it's live. Still counts.",
};

/* ── Resolve item (missed — exactly two choices, nothing else in v0.1) ── */

export const RESOLVE_LABEL = 'Resolve item';
export const RESOLVE_MARK_POSTED = 'Mark Posted';
export const RESOLVE_MARK_POSTED_NOTE = '· counts as Late';
export const RESOLVE_KEEP_MISSED = 'Keep as Missed';
