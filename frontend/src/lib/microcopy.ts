// The product's voice. Strings are VERBATIM from the handoff README + wireframes — do not edit casually.
// Server owns state selection; this file owns the words (ADR-3 refinement).
import type { CardState, Platform } from '../api/types';

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
