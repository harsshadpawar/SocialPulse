// Platform variant rules (hifi/hifi-platforms.jsx): the UI never changes shape —
// only the badge dot, the platform name in copy, and the Open link.
// The brand dot is the ONLY brand color allowed in the UI.
import type { Platform } from '../api/types';

export interface PlatformMeta {
  label: string;
  color: string; // badge dot only — never buttons or fills
  formatLabel: string; // one format per platform in v0.1
  formatNoun: string; // for "Your {platform} {format-noun} is due now."
  openLabel: string;
  url: string;
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    formatLabel: 'Text post',
    formatNoun: 'post',
    openLabel: 'Open LinkedIn ↗',
    url: 'https://www.linkedin.com/feed/',
  },
  x: {
    label: 'X',
    color: '#111111',
    formatLabel: 'Post',
    formatNoun: 'post',
    openLabel: 'Open X ↗',
    url: 'https://x.com/home',
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0033',
    formatLabel: 'Video',
    formatNoun: 'video',
    openLabel: 'Open YouTube Studio ↗',
    url: 'https://studio.youtube.com/',
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    formatLabel: 'Reel',
    formatNoun: 'reel',
    openLabel: 'Open Instagram ↗',
    url: 'https://www.instagram.com/',
  },
};
