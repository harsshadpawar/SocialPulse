// The product's voice. Core strings VERBATIM from the handoff README; platform substitution
// per the hi-fi variants board: "Your {platform} {format-noun} is due now."
// Server owns state selection; this file owns the words (ADR-3 refinement).
import type { CardState, DraftSubState, EffortScore, GoalVerdict, Platform, ReadyMissing, WeeklyLoad, WeekState } from '../api/types';
import type { Tone } from '../components/ui';
import { PLATFORM_META } from './platform';

/** The slice of PostView the voice functions need (server-derived, ADR-3). */
export interface VoiceContext {
  platform: Platform;
  draftSubState: DraftSubState | null;
  dueNotReady: boolean;
}

/* ── Today's Command — one sentence, state-driven ── */

export function commandFor(state: CardState | 'empty', ctx?: VoiceContext): string {
  const meta = ctx ? PLATFORM_META[ctx.platform] : PLATFORM_META.linkedin;
  // The key failure mode (D-31): due while still draft.
  if (ctx?.dueNotReady) return `Your ${meta.label} ${meta.formatNoun} is due — it isn't marked ready yet.`;
  switch (state) {
    case 'empty':
      return "Today is clear. Prep tomorrow's post while you have energy.";
    case 'draft':
      // Sub-state refinement (D-30); first string verbatim from v0.1.
      switch (ctx?.draftSubState) {
        case 'needs_schedule':
          return 'The caption is written — now pick when it goes live.';
        case 'ready_to_mark':
          return "Everything's in place — mark it ready.";
        default:
          return 'One post is planned for today — it still needs a caption.';
      }
    case 'planned_ready':
      return 'One post is ready for today.';
    case 'due':
      return `Your ${meta.label} ${meta.formatNoun} is due now.`;
    case 'posted':
      return "You're on track — nothing left due today.";
    case 'missed':
      return "Today's plan slipped — the post can still go live.";
  }
}

/** Sub-line under the command (due states only). */
export function commandSub(state: CardState | 'empty', ctx?: VoiceContext): string | undefined {
  if (ctx?.dueNotReady) return 'Finish the last step and mark it ready — it can still go out.';
  if (state !== 'due') return undefined;
  const meta = ctx ? PLATFORM_META[ctx.platform] : PLATFORM_META.linkedin;
  return `Open ${meta.label}, publish, then mark it posted here.`;
}

/** Eyebrow per state (hi-fi HT map + D-31). Posted differentiates on-time vs late. */
export function eyebrowFor(state: CardState | 'empty', adherence?: string, dueNotReady?: boolean): [Tone, string] {
  if (dueNotReady) return ['accent', 'Due · not ready'];
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

export const DUE_NOT_READY_CARD =
  'This post hit its time while still in draft. Finish it, mark it ready, and it can still go live.';

/* ── Card messages (README verbatim, platform-substituted) ── */

export function dueMessage(platform: Platform): string {
  const { label } = PLATFORM_META[platform];
  return `Time to post your ${label} item. Open ${label}, publish, then mark it posted here.`;
}

export const MISSED_MESSAGE =
  "This post didn't go live within the planned window. You can still mark it posted if you published it later.";

export const COPY_CAPTION_DISABLED_HELPER = 'Add caption first';

export const EMPTY_CARD_BODY = 'Nothing is due. When you plan a post, it appears here as the one thing to do.';

/* ── v0.2b "Daily rhythm" — derived "Today's work is done" (D-34) ── */

export const WORK_DONE_EYEBROW = 'Day done';
export const WORK_DONE_COMMAND = "Today's work is done. Rest — tomorrow's plan is here when you are.";
/** Recap sub-line; counts are passed in so the words stay here (ADR-3). */
export function workDoneSub(postedOnDay: number, postedInWeek: number): string {
  return `${postedOnDay} posted today · ${postedInWeek} this week.`;
}

/* ── v0.2b Quick Start (D-35) — seed the caption from the core message ── */

export const QUICK_START = 'Quick Start';
export const QUICK_START_HELPER = 'Start from your core message — refine after.';

/* ── v0.2c "Width" — derived effort (D-38) + multi-platform repurpose (D-37) ── */

export const EFFORT_LABEL: Record<EffortScore, string> = {
  low: 'Low effort',
  medium: 'Medium effort',
  high: 'High effort',
};

const LOAD_WORD: Record<WeeklyLoad, string> = {
  light: 'light load',
  moderate: 'moderate load',
  full: 'full load',
};

/** Calm capacity line (CS-12). Empty when nothing is planned this week. */
export function weeklyEffortLine(posts: number, load: WeeklyLoad): string {
  if (posts === 0) return '';
  const noun = posts === 1 ? 'post' : 'posts';
  return `${posts} ${noun} planned this week · ${LOAD_WORD[load]}`;
}

export const REPURPOSE_HEADING = 'Repurpose this idea';
export const REPURPOSE_HELPER = 'Spin up a sibling post on another platform — starts from this copy.';
export function repurposeToLabel(platformLabel: string): string {
  return `Repurpose to ${platformLabel}`;
}

/* ── v0.2d Calendar Week View (D-45) — calm, never red ── */

export function calEyebrow(state: WeekState): [Tone, string] {
  switch (state) {
    case 'healthy':
      return ['success', 'On track'];
    case 'overload':
      return ['accent', 'Heads up'];
    case 'missed':
      return ['missed', 'One slipped'];
    case 'empty':
      return ['dim', 'Clear'];
  }
}

export function calCommand(state: WeekState): string {
  switch (state) {
    case 'healthy':
      return 'This week is realistic.';
    case 'overload':
      return 'This week may be heavy.';
    case 'missed':
      return "One post slipped — it's recoverable.";
    case 'empty':
      return 'Nothing scheduled yet.';
  }
}

export const CAL_EMPTY_BODY = 'Nothing planned this week. Add a post when you have energy — the week fills in as you go.';

export const REALISM_LABEL = 'Plan realism';
export const REALISM_HEADING = 'This week may be heavy.';
export function realismBody(heavyDayName: string | null, totalEffort: number, capacity: number | null): string {
  const parts: string[] = [];
  if (heavyDayName) parts.push(`${heavyDayName} has two high-effort posts`);
  if (capacity !== null && totalEffort > capacity) parts.push(`the week totals ${totalEffort} effort points against your capacity of ${capacity}`);
  if (parts.length === 0) return 'This week may be heavy. Consider reducing one high-effort post.';
  const joined = parts.join(', and ');
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
}
export function realismFix(heavyDayName: string | null): string {
  const what = heavyDayName ? `one ${heavyDayName} post` : 'one high-effort post';
  return `Suggested fix — move ${what} to next week, or drop it. You don't need to do more; just less, done well.`;
}
export const REALISM_ADJUST = 'Open the plan';
export const REALISM_KEEP = 'Keep as is';

export const CAL_MISSED_LABEL = 'Recoverable';
export function calMissedHeading(dayName: string | null): string {
  return dayName ? `${dayName}'s post didn't go live.` : "A post didn't go live this week.";
}
export const CAL_MISSED_BODY = "It's still recoverable. If you published it later, mark it posted — it just counts as Late.";
export const CAL_MISSED_RESOLVE = 'Resolve it';

/* ── v0.2d Goals (D-43/D-47) — controllable commitments, non-punitive ── */

export const GOALS_SETUP_EYEBROW = 'Commitments · not growth';
export const GOALS_SETUP_COMMAND = "Set this week's commitments.";
export const GOALS_SETUP_SUB = 'Targets you control — rhythm, not reach. Pick a couple you can actually keep.';
export const GOALS_SAVE = 'Save commitments';
export const GOALS_BANNED_LABEL = 'Only controllable behavior — these never appear';
export const GOALS_BANNED = ['Gain 100 followers', 'Reach 10k impressions', 'Get 500 likes'];

export const GOALS_EMPTY_EYEBROW = 'Commitments';
export const GOALS_EMPTY_COMMAND = 'No commitments yet.';
export const GOALS_EMPTY_BODY = "Set a couple of targets you can actually keep. Change them any week — they're commitments, not contracts.";
export const GOALS_EMPTY_CTA = 'Set commitments';
export const GOALS_EDIT = 'Edit commitments';

export const GOALS_PROGRESS_TITLE = "This week's commitments";
export function goalVerdictPill(v: GoalVerdict): [Tone, string] | null {
  if (v === 'on_rhythm') return ['success', 'On rhythm'];
  if (v === 'ran_short') return ['late', 'Ran short'];
  return null;
}
export function goalVerdictLine(v: GoalVerdict, publishTarget: number | null): string {
  if (v === 'ran_short') {
    if (publishTarget !== null && publishTarget > 2) {
      const fewer = publishTarget - 2;
      return `This week ran short of your plan. Next week, try planning ${fewer} instead of ${publishTarget} — ${fewer} realistic beats ${publishTarget} missed.`;
    }
    return 'This week ran short of your plan. Next week, try planning fewer — fewer realistic beats more missed.';
  }
  return "This plan is realistic. You're on rhythm.";
}

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
