import { describe, expect, it } from 'vitest';
import { firstMissingForReady } from './readyGate';
import { mkPost, TARGET_830PM } from './testFixtures';

describe('firstMissingForReady (gentle gate, brief §6)', () => {
  it('empty caption → caption (whitespace does not count)', () => {
    expect(firstMissingForReady(mkPost({ caption: '   ' }))).toBe('caption');
  });

  it('caption present, no target → target', () => {
    expect(firstMissingForReady(mkPost({ caption: 'Most banks…' }))).toBe('target');
  });

  it('all present → null (Ready to post.)', () => {
    expect(firstMissingForReady(mkPost({ caption: 'Most banks…', targetDatetime: TARGET_830PM }))).toBeNull();
  });
});
