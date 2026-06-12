// Shared test builder. Dubai = UTC+4, no DST: 8:30 PM Dubai == 16:30Z same day.
import type { DomainPost } from './types';

let seq = 0;

export function mkPost(overrides: Partial<DomainPost> = {}): DomainPost {
  seq += 1;
  return {
    id: overrides.id ?? `post-${String(seq).padStart(3, '0')}`,
    ideaTitle: 'AI credit scoring must be explainable',
    coreMessage: 'Banks owe customers a reason, not a verdict.',
    platform: 'linkedin',
    format: 'text_post',
    caption: '',
    targetDatetime: null,
    readiness: 'draft',
    actualDatetime: null,
    nativePostUrl: null,
    graceWindowMinutes: 30,
    missedAcknowledgedAt: null,
    createdAt: new Date('2026-06-10T08:00:00Z'),
    ...overrides,
  };
}

export const TZ = 'Asia/Dubai';

/** 2026-06-12 16:00 Dubai (4 PM) — the reference "now" for most cases. */
export const NOW = new Date('2026-06-12T12:00:00Z');

/** 2026-06-12 20:30 Dubai (8:30 PM) — the canonical target from the validation example. */
export const TARGET_830PM = new Date('2026-06-12T16:30:00Z');
