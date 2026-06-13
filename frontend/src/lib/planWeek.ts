// v0.2g (D-53): "Plan week from this idea" — fixed-ladder proposer. Transparent, not effort-budget:
// cadence = how deep down each platform's curated spoke order. Mirrors the approved ladder model.
import type { Format, Platform } from '../api/types';

export type Cadence = 'light' | 'medium' | 'heavy';
export const CADENCES: { id: Cadence; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'one piece per platform' },
  { id: 'medium', label: 'Medium', hint: 'two per platform' },
  { id: 'heavy', label: 'Heavy', hint: 'the full spoke' },
];

const LADDER: Record<Platform, Record<Cadence, Format[]>> = {
  linkedin: { light: ['text_post'], medium: ['text_post', 'carousel'], heavy: ['text_post', 'carousel', 'video'] },
  youtube: { light: ['short_video'], medium: ['short_video', 'long_video'], heavy: ['short_video', 'long_video'] },
  x: { light: ['short_post'], medium: ['short_post', 'thread'], heavy: ['short_post', 'thread', 'video'] },
  instagram: { light: ['reel'], medium: ['reel', 'carousel'], heavy: ['reel', 'carousel', 'image'] },
};

export interface ProposedPiece {
  platform: Platform;
  format: Format;
}

export function proposeWeekPieces(platforms: Platform[], cadence: Cadence): ProposedPiece[] {
  const out: ProposedPiece[] = [];
  for (const pl of platforms) for (const fmt of LADDER[pl][cadence]) out.push({ platform: pl, format: fmt });
  return out;
}

// Effort mirror (source of truth: backend deriveEffort) — for the live total as the user toggles.
const FORMAT_EFFORT: Record<Format, 'low' | 'medium' | 'high'> = {
  text_post: 'low',
  short_post: 'low',
  image: 'low',
  thread: 'medium',
  carousel: 'medium',
  reel: 'medium',
  short_video: 'medium',
  video: 'high',
  long_video: 'high',
};
const PTS: Record<'low' | 'medium' | 'high', number> = { low: 1, medium: 2, high: 3 };
export function effortPoints(format: Format): number {
  return PTS[FORMAT_EFFORT[format]];
}

export type Load = 'light' | 'moderate' | 'full';
export function loadFor(points: number): Load {
  return points <= 3 ? 'light' : points <= 6 ? 'moderate' : 'full';
}

// Cadence → proposed spread (gap days between pieces). Every date stays editable/clearable after.
const GAP: Record<Cadence, number> = { light: 3, medium: 2, heavy: 1 };
export function proposeDateStr(index: number, cadence: Cadence, startKey: string): string {
  const [y, m, d] = startKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + index * GAP[cadence], 12));
  return dt.toISOString().slice(0, 10);
}
