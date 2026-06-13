// v0.2f: format is now chosen per post. Labels/nouns live per FORMAT (not per platform), and each
// platform offers its valid formats. Mirrors backend constants.ts PLATFORM_FORMATS + effort.ts.
import type { Format, Platform } from '../api/types';

export const FORMAT_META: Record<Format, { label: string; noun: string }> = {
  text_post: { label: 'Text post', noun: 'post' },
  short_post: { label: 'Post', noun: 'post' },
  thread: { label: 'Thread', noun: 'thread' },
  carousel: { label: 'Carousel', noun: 'carousel' },
  video: { label: 'Video', noun: 'video' },
  short_video: { label: 'Short video', noun: 'video' },
  long_video: { label: 'Long video', noun: 'video' },
  reel: { label: 'Reel', noun: 'reel' },
  image: { label: 'Image', noun: 'post' },
};

/** Valid formats per platform — first is the default. Mirrors backend PLATFORM_FORMATS. */
export const PLATFORM_FORMATS: Record<Platform, Format[]> = {
  linkedin: ['text_post', 'carousel', 'video'],
  x: ['short_post', 'thread', 'video'],
  youtube: ['short_video', 'long_video'],
  instagram: ['reel', 'carousel', 'image'],
};

export function defaultFormat(platform: Platform): Format {
  return PLATFORM_FORMATS[platform][0]!;
}
