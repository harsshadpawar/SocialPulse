// Golden table S1–S14 (docs/selector-spec.md §5) + capabilities spot-checks.
import { describe, expect, it } from 'vitest';
import { deriveCapabilities } from './capabilities';
import { deriveCardState, selectTodayPost } from './selector';
import { mkPost, NOW, TARGET_830PM, TZ } from './testFixtures';

const at = (iso: string) => new Date(iso);

describe('selectTodayPost (S1–S14)', () => {
  it('S1: no posts → null (empty state)', () => {
    expect(selectTodayPost([], NOW, TZ)).toBeNull();
  });

  it('S2: one untargeted draft → that draft', () => {
    const draft = mkPost();
    expect(selectTodayPost([draft], NOW, TZ)?.id).toBe(draft.id);
    expect(deriveCardState(draft, NOW)).toBe('draft');
  });

  it('S3: ready, target later today → planned_ready card', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    expect(selectTodayPost([p], NOW, TZ)?.id).toBe(p.id);
    expect(deriveCardState(p, NOW)).toBe('planned_ready');
  });

  it('S4: due now → due card', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    const dueNow = at('2026-06-12T16:45:00Z'); // 8:45 PM Dubai, inside grace
    expect(selectTodayPost([p], dueNow, TZ)?.id).toBe(p.id);
    expect(deriveCardState(p, dueNow)).toBe('due');
  });

  it('S5: missed, unacknowledged → missed card', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    const past = at('2026-06-12T18:00:00Z'); // 10 PM Dubai
    expect(selectTodayPost([p], past, TZ)?.id).toBe(p.id);
    expect(deriveCardState(p, past)).toBe('missed');
  });

  it('S6: missed, acknowledged, nothing else → null', () => {
    const p = mkPost({
      readiness: 'ready',
      caption: 'cap',
      targetDatetime: TARGET_830PM,
      missedAcknowledgedAt: at('2026-06-12T18:30:00Z'),
    });
    expect(selectTodayPost([p], at('2026-06-12T19:00:00Z'), TZ)).toBeNull();
  });

  it('S7: yesterday missed (unack) + today due → DUE wins (spec §3)', () => {
    const missedYesterday = mkPost({
      readiness: 'ready',
      caption: 'old',
      targetDatetime: at('2026-06-11T16:30:00Z'),
    });
    const dueToday = mkPost({ readiness: 'ready', caption: 'new', targetDatetime: TARGET_830PM });
    const dueNow = at('2026-06-12T16:40:00Z');
    expect(selectTodayPost([missedYesterday, dueToday], dueNow, TZ)?.id).toBe(dueToday.id);
  });

  it('S8: two due → earliest target', () => {
    const a = mkPost({ readiness: 'ready', caption: 'a', targetDatetime: at('2026-06-12T16:20:00Z') });
    const b = mkPost({ readiness: 'ready', caption: 'b', targetDatetime: at('2026-06-12T16:30:00Z') });
    const dueNow = at('2026-06-12T16:40:00Z'); // both inside grace
    expect(selectTodayPost([b, a], dueNow, TZ)?.id).toBe(a.id);
  });

  it('S9: draft today + ready today → ready wins (class 3 > class 4)', () => {
    const draft = mkPost({ targetDatetime: at('2026-06-12T17:30:00Z') });
    const ready = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    expect(selectTodayPost([draft, ready], NOW, TZ)?.id).toBe(ready.id);
  });

  it('S10: posted today + draft targeted tomorrow → posted (future day invisible)', () => {
    const posted = mkPost({
      readiness: 'ready',
      caption: 'cap',
      targetDatetime: TARGET_830PM,
      actualDatetime: at('2026-06-12T16:42:00Z'),
    });
    const tomorrowDraft = mkPost({ targetDatetime: at('2026-06-13T05:00:00Z') });
    const evening = at('2026-06-12T17:30:00Z');
    expect(selectTodayPost([posted, tomorrowDraft], evening, TZ)?.id).toBe(posted.id);
  });

  it('S11: posted yesterday only → null', () => {
    const p = mkPost({
      readiness: 'ready',
      caption: 'cap',
      targetDatetime: at('2026-06-11T16:30:00Z'),
      actualDatetime: at('2026-06-11T16:40:00Z'),
    });
    expect(selectTodayPost([p], NOW, TZ)).toBeNull();
  });

  it('S12: ready targeted tomorrow → null today (day scope)', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: at('2026-06-13T05:00:00Z') });
    expect(selectTodayPost([p], NOW, TZ)).toBeNull();
  });

  it('S12b: UTC/Dubai boundary — target 23:00Z today is 03:00 Dubai TOMORROW → invisible today', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: at('2026-06-12T23:00:00Z') });
    expect(selectTodayPost([p], NOW, TZ)).toBeNull();
  });

  it('S13: determinism — same inputs twice → identical result', () => {
    const posts = [
      mkPost({ targetDatetime: at('2026-06-12T17:30:00Z') }),
      mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM }),
      mkPost(),
    ];
    const first = selectTodayPost(posts, NOW, TZ);
    const second = selectTodayPost(posts, NOW, TZ);
    expect(second).toBe(first);
  });

  it('S14: missed acknowledged + untargeted draft → draft', () => {
    const acked = mkPost({
      readiness: 'ready',
      caption: 'cap',
      targetDatetime: TARGET_830PM,
      missedAcknowledgedAt: at('2026-06-12T18:30:00Z'),
    });
    const draft = mkPost();
    expect(selectTodayPost([acked, draft], at('2026-06-12T19:00:00Z'), TZ)?.id).toBe(draft.id);
  });

  it('S15: draft-due + ready-planned-today → draft-due wins (class 1 ordering unchanged)', () => {
    const draftDue = mkPost({ caption: 'cap', targetDatetime: at('2026-06-12T16:20:00Z') }); // draft, in grace at 16:40Z
    const readyLater = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: at('2026-06-12T17:30:00Z') });
    expect(selectTodayPost([readyLater, draftDue], at('2026-06-12T16:40:00Z'), TZ)?.id).toBe(draftDue.id);
  });

  it('untargeted drafts tie-break: newest createdAt first', () => {
    const older = mkPost({ createdAt: at('2026-06-10T08:00:00Z') });
    const newer = mkPost({ createdAt: at('2026-06-11T08:00:00Z') });
    expect(selectTodayPost([older, newer], NOW, TZ)?.id).toBe(newer.id);
  });
});

describe('capabilities (spot checks vs spec §4)', () => {
  it('planned+ready: canMarkPosted (early posting #4), canEditTarget still true', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    const caps = deriveCapabilities(p, NOW);
    expect(caps.canMarkPosted).toBe(true);
    expect(caps.canEditTarget).toBe(true);
    expect(caps.canSetUrl).toBe(false);
  });

  it('due: target locked (frozen invariant #10)', () => {
    const p = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    const caps = deriveCapabilities(p, at('2026-06-12T16:45:00Z'));
    expect(caps.canEditTarget).toBe(false);
    expect(caps.canMarkPosted).toBe(true);
  });

  it('missed draft: cannot mark posted until Ready', () => {
    const p = mkPost({ targetDatetime: TARGET_830PM }); // draft
    const caps = deriveCapabilities(p, at('2026-06-12T18:00:00Z'));
    expect(caps.canMarkPosted).toBe(false);
    expect(caps.canMarkReady).toBe(true);
  });

  it('posted: actual+url editable, everything else closed', () => {
    const p = mkPost({
      readiness: 'ready',
      caption: 'cap',
      targetDatetime: TARGET_830PM,
      actualDatetime: at('2026-06-12T16:42:00Z'),
    });
    const caps = deriveCapabilities(p, at('2026-06-12T17:00:00Z'));
    expect(caps).toEqual({
      canEditPrepare: false,
      canEditTarget: false,
      canMarkReady: false,
      canMarkPosted: false,
      canAcknowledgeMissed: false,
      canEditActual: true,
      canSetUrl: true,
    });
  });
});
