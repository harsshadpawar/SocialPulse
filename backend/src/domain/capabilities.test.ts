// v0.2b (D-35): canQuickStart gates the "seed caption from core message" action.
import { describe, expect, it } from 'vitest';
import { deriveCapabilities } from './capabilities';
import { mkPost, NOW } from './testFixtures';

describe('canQuickStart (v0.2b D-35)', () => {
  it('blank-caption draft with a core message → true', () => {
    expect(deriveCapabilities(mkPost({ caption: '' }), NOW).canQuickStart).toBe(true);
  });

  it('whitespace-only caption still counts as blank → true', () => {
    expect(deriveCapabilities(mkPost({ caption: '   ' }), NOW).canQuickStart).toBe(true);
  });

  it('a draft that already has a caption → false (nothing to seed)', () => {
    expect(deriveCapabilities(mkPost({ caption: 'already written' }), NOW).canQuickStart).toBe(false);
  });

  it('no core message to seed from → false', () => {
    expect(deriveCapabilities(mkPost({ caption: '', coreMessage: '' }), NOW).canQuickStart).toBe(false);
  });

  it('a Ready (non-draft) post → false', () => {
    expect(deriveCapabilities(mkPost({ readiness: 'ready', caption: '' }), NOW).canQuickStart).toBe(false);
  });

  it('a posted post → false', () => {
    const posted = mkPost({
      readiness: 'ready',
      caption: '',
      targetDatetime: new Date('2026-06-12T09:00:00Z'),
      actualDatetime: new Date('2026-06-12T10:00:00Z'),
    });
    expect(deriveCapabilities(posted, NOW).canQuickStart).toBe(false);
  });
});
