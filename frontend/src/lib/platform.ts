// Platform variant rules (hifi/hifi-platforms.jsx): the UI never changes shape —
// only the badge dot, the platform name in copy, and the Open link.
// The brand dot is the ONLY brand color allowed in the UI.
import type { Platform } from '../api/types';

export interface PlatformMeta {
  label: string;
  color: string; // badge dot only — never buttons or fills
  openLabel: string;
  url: string;
}

// v0.2f: format label/noun moved to FORMAT_META (lib/formatMeta.ts) — formats are per-post now.
export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  linkedin: { label: 'LinkedIn', color: '#0A66C2', openLabel: 'Open LinkedIn ↗', url: 'https://www.linkedin.com/feed/' },
  x: { label: 'X', color: '#111111', openLabel: 'Open X ↗', url: 'https://x.com/home' },
  youtube: { label: 'YouTube', color: '#FF0033', openLabel: 'Open YouTube Studio ↗', url: 'https://studio.youtube.com/' },
  instagram: { label: 'Instagram', color: '#E1306C', openLabel: 'Open Instagram ↗', url: 'https://www.instagram.com/' },
};
