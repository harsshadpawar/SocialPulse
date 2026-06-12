// Golden additions D14–D19 (selector-spec v0.2a amendment).
import { describe, expect, it } from 'vitest';
import { deriveDraftSubState, deriveDueNotReady } from './subState';
import { mkPost, TARGET_830PM } from './testFixtures';

const at = (iso: string) => new Date(iso);

describe('deriveDraftSubState (D14–D17)', () => {
  it('D14: draft, caption blank → needs_caption (whitespace counts as blank)', () => {
    expect(deriveDraftSubState(mkPost({ caption: '  ' }))).toBe('needs_caption');
  });

  it('D15: draft, caption set, no target → needs_schedule', () => {
    expect(deriveDraftSubState(mkPost({ caption: 'Most banks…' }))).toBe('needs_schedule');
  });

  it('D16: draft, caption + target → ready_to_mark', () => {
    expect(deriveDraftSubState(mkPost({ caption: 'Most banks…', targetDatetime: TARGET_830PM }))).toBe('ready_to_mark');
  });

  it('D17: ready post → null', () => {
    expect(deriveDraftSubState(mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM }))).toBeNull();
  });

  it('posted post → null', () => {
    expect(
      deriveDraftSubState(
        mkPost({ caption: 'cap', targetDatetime: TARGET_830PM, actualDatetime: at('2026-06-12T16:40:00Z') }),
      ),
    ).toBeNull();
  });
});

describe('deriveDueNotReady (D18–D19)', () => {
  const draftDue = mkPost({ caption: 'cap', targetDatetime: TARGET_830PM }); // draft, targeted

  it('D18: draft inside [target, target+grace] → true', () => {
    expect(deriveDueNotReady(draftDue, at('2026-06-12T16:45:00Z'))).toBe(true);
  });

  it('D19: draft past grace → false (missed copy governs)', () => {
    expect(deriveDueNotReady(draftDue, at('2026-06-12T18:00:00Z'))).toBe(false);
  });

  it('ready post at due → false (normal due copy governs)', () => {
    const readyDue = mkPost({ readiness: 'ready', caption: 'cap', targetDatetime: TARGET_830PM });
    expect(deriveDueNotReady(readyDue, at('2026-06-12T16:45:00Z'))).toBe(false);
  });

  it('draft before target → false', () => {
    expect(deriveDueNotReady(draftDue, at('2026-06-12T12:00:00Z'))).toBe(false);
  });
});
