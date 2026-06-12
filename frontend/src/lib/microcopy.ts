// The product's voice. Strings are VERBATIM from the handoff README + wireframes — do not edit casually.
// Server owns state selection; this file owns the words (ADR-3 refinement).
import type { CardState, Platform, ReadyMissing } from '../api/types';

export const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

export const FORMAT_LABEL: Record<string, string> = {
  text_post: 'Text post',
  short_post: 'Short post',
  short_video: 'Short video',
  reel: 'Reel',
};

/** Today's Command — one sentence, state-driven. */
export function commandFor(state: CardState | 'empty', platform?: Platform): string {
  switch (state) {
    case 'empty':
      return "Today is clear. Prep tomorrow's post while you have energy.";
    case 'draft':
      return 'One post is planned for today — it still needs a caption.';
    case 'planned_ready':
      return 'One post is ready for today.';
    case 'due':
      return `Your ${platform ? PLATFORM_LABEL[platform] : 'next'} post is due now.`;
    case 'posted':
      return "You're on track — nothing left due today.";
    case 'missed':
      return "Today's plan slipped — the post can still go live.";
  }
}

export function dueMessage(platform: Platform): string {
  const label = PLATFORM_LABEL[platform];
  return `Time to post your ${label} item. Open ${label}, publish, then mark it posted here.`;
}

export const MISSED_MESSAGE =
  "This post didn't go live within the planned window. You can still mark it posted if you published it later.";

export const COPY_CAPTION_DISABLED_HELPER = 'Add caption first';

export const EMPTY_CARD_BODY = 'Nothing due. No backlog list, no calendar — the day is simply clear.';

/** Primary CTA per card state (frozen CTA table). */
export const PRIMARY_CTA: Record<CardState, string> = {
  draft: 'Continue editing',
  planned_ready: 'View post',
  due: 'Mark Posted',
  posted: 'View result',
  missed: 'Resolve item',
};

export const EMPTY_CTA = '+ Create idea';

/* ---- New Idea (capture) ---- */
export const NEW_IDEA_LABEL = "capture — don't organize";
export const NEW_IDEA_HEADING = "What's the idea?";
export const NEW_IDEA_CTA = 'Next → create the LinkedIn post';

/* ---- Post Editor (staged workflow) ---- */
export const READY_CONFIRM = 'Ready to post.';

/** Gentle gating guidance — caption string verbatim from the README; siblings in the same voice (#20). */
export const READY_GUIDANCE: Record<ReadyMissing, string> = {
  caption: 'Add a caption before marking ready.',
  platform: 'Pick a platform before marking ready.',
  format: 'Pick a format before marking ready.',
  target: 'Pick a target time before marking ready.',
};

export function captionPlaceholder(platform: Platform): string {
  return `Write the post as it will be pasted into ${PLATFORM_LABEL[platform]}…`;
}

export const TARGET_PLACEHOLDER = 'Pick when this should go live';
export const SAVE_DRAFT = 'Save Draft';
export const MARK_READY = 'Mark Ready';
export const MARK_POSTED = 'Mark Posted';
export const TARGET_LOCKED_NOTE = 'Locked — the target can no longer move.';

/* ---- Mark Posted ritual + Result (the reward moment) ---- */
export const SHEET_TITLE = 'Nice. Add the post link?';
export const SHEET_URL_LABEL = 'Native post URL (optional)';
export const SHEET_TIME_LABEL = 'Actual posted time';
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

/* ---- Resolve item (missed — exactly two choices, nothing else in v0.1) ---- */
export const RESOLVE_MARK_POSTED = 'Mark Posted';
export const RESOLVE_MARK_POSTED_NOTE = '(becomes Late)';
export const RESOLVE_KEEP_MISSED = 'Keep as Missed';
