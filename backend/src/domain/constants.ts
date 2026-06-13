import type { Format, Platform } from './types';

export const DEFAULT_GRACE_MINUTES = 30;

/** All v0.1 platforms, in display order. Used by v0.2c repurpose to offer unused platforms. */
export const ALL_PLATFORMS: readonly Platform[] = ['linkedin', 'x', 'youtube', 'instagram'];

/** v0.2f platform→format options. First entry is the default (used on create / repurpose / platform
 *  switch). Enforced in the service layer, not the DB (keeps schema.prisma the single authority). */
export const PLATFORM_FORMATS: Record<Platform, readonly Format[]> = {
  linkedin: ['text_post', 'carousel', 'video'],
  x: ['short_post', 'thread', 'video'],
  youtube: ['short_video', 'long_video'],
  instagram: ['reel', 'carousel', 'image'],
};

export function isValidPair(platform: Platform, format: Format): boolean {
  return PLATFORM_FORMATS[platform].includes(format);
}

/** The default format for a platform (create, repurpose, and platform-switch fallback). */
export function defaultFormat(platform: Platform): Format {
  return PLATFORM_FORMATS[platform][0]!;
}
