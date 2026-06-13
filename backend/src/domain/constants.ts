import type { Format, Platform } from './types';

export const DEFAULT_GRACE_MINUTES = 30;

/** All v0.1 platforms, in display order. Used by v0.2c repurpose to offer unused platforms. */
export const ALL_PLATFORMS: readonly Platform[] = ['linkedin', 'x', 'youtube', 'instagram'];

/** v0.1 fixed platform→format pairs (decision #12). Enforced in the service layer, not the DB. */
export const PLATFORM_FORMATS: Record<Platform, readonly Format[]> = {
  linkedin: ['text_post'],
  x: ['short_post'],
  youtube: ['short_video'],
  instagram: ['reel'],
};

export function isValidPair(platform: Platform, format: Format): boolean {
  return PLATFORM_FORMATS[platform].includes(format);
}
