// v0.2k (D-64): Consistency Reports — a pure read/aggregation over the posts we already hold. Per ADR-3
// it derives STATE + NUMBERS only; the client owns every calm word. Never grades, never red.
// Reuses the same adherence/grace truth as Calendar & Goals, so Reports can't disagree with them.
import { deriveAdherence } from './adherence';
import { ALL_PLATFORMS } from './constants';
import { weekStartKey } from './time';
import type { Commitments, DomainPost, Platform } from './types';

const WINDOW = 12; // weeks of trend
const MONTHS = 6; // rollup depth
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type ReportState = 'early' | 'sparse' | 'rough' | 'rich';
export type PatternKind = 'reliable_weekday' | 'prepare_ahead_helps';

export interface MonthRollup {
  key: string; // 'YYYY-MM'
  name: string; // 'Jun'
  weeksHit: number;
  weeksOf: number;
  posts: number;
  onTimePct: number;
}
export interface PlatformConsistency {
  platform: Platform;
  weeksHit: number;
  weeksOf: number;
}
export interface ReportPattern {
  kind: PatternKind;
  weekday?: string; // for reliable_weekday
}

export interface ConsistencyReport {
  state: ReportState;
  windowWeeks: number; // weeks of history in the window (≤ 12)
  streak: number; // trailing consecutive weeks meeting light cadence
  weekDots: boolean[]; // last ≤8 weeks hit/miss (oldest → newest)
  trend: number[]; // completion % per week (oldest → newest), length = windowWeeks
  capacityLinePct: number; // dashed reference line
  months: MonthRollup[]; // most-recent first, ≤ 6
  platforms: PlatformConsistency[];
  patterns: ReportPattern[];
  postsThisMonth: number; // published in the current calendar month (the verdict reads it)
  weeksHitInWindow: number;
}

const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 100) : 0);
function noonUtc(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12));
}
function addDaysKey(key: string, days: number): string {
  const dt = noonUtc(key);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// A published post = it was actually posted (early/on-time/late all count), bucketed by its TARGET week
// (same convention as the shared weekly metrics).
const isPublished = (p: DomainPost): boolean => p.actualDatetime !== null;

export function deriveConsistencyReport(
  posts: readonly DomainPost[],
  now: Date,
  tz: string,
  commitments: Commitments,
): ConsistencyReport {
  const dated = posts.filter((p) => p.targetDatetime !== null);
  const nowWeek = weekStartKey(now, tz);

  // How many weeks of history exist (earliest target week … now), capped at WINDOW.
  let windowWeeks = 0;
  if (dated.length > 0) {
    const earliest = dated.reduce((min, p) => (p.targetDatetime! < min ? p.targetDatetime! : min), dated[0]!.targetDatetime!);
    const earliestWeek = weekStartKey(earliest, tz);
    const spanWeeks = Math.round((noonUtc(nowWeek).getTime() - noonUtc(earliestWeek).getTime()) / (7 * 86_400_000)) + 1;
    windowWeeks = Math.min(WINDOW, Math.max(1, spanWeeks));
  }

  // Window week-start keys, oldest → newest (ending at the current week).
  const weekKeys: string[] = [];
  for (let i = windowWeeks - 1; i >= 0; i--) weekKeys.push(addDaysKey(nowWeek, -7 * i));

  // Bucket posts by target week.
  const byWeek = new Map<string, DomainPost[]>(weekKeys.map((k) => [k, []]));
  for (const p of dated) {
    const wk = weekStartKey(p.targetDatetime!, tz);
    byWeek.get(wk)?.push(p);
  }

  // Per-week completion + hit (light cadence = published ≥ 1, the kindest, streak-protective bar — D-64).
  const trend: number[] = [];
  const hits: boolean[] = [];
  let totalPublished = 0;
  for (const wk of weekKeys) {
    const wkPosts = byWeek.get(wk) ?? [];
    const published = wkPosts.filter(isPublished).length;
    trend.push(pct(published, wkPosts.length));
    hits.push(published >= 1);
    totalPublished += published;
  }

  // Trailing streak.
  let streak = 0;
  for (let i = hits.length - 1; i >= 0 && hits[i]; i--) streak += 1;
  const weeksHitInWindow = hits.filter(Boolean).length;
  const weekDots = hits.slice(-8);

  // Per-platform: weeks (in window) with ≥1 published on that platform. Only platforms the creator used.
  const platforms: PlatformConsistency[] = [];
  for (const plat of ALL_PLATFORMS) {
    const used = dated.some((p) => p.platform === plat);
    if (!used) continue;
    let weeksHit = 0;
    for (const wk of weekKeys) {
      if ((byWeek.get(wk) ?? []).some((p) => p.platform === plat && isPublished(p))) weeksHit += 1;
    }
    platforms.push({ platform: plat, weeksHit, weeksOf: windowWeeks });
  }

  // Months: assign each window week to the calendar month of its Monday; published posts by target month.
  const monthAgg = new Map<string, { weeksHit: number; weeksOf: number; posts: number; onTime: number }>();
  weekKeys.forEach((wk, i) => {
    const mk = wk.slice(0, 7);
    const a = monthAgg.get(mk) ?? { weeksHit: 0, weeksOf: 0, posts: 0, onTime: 0 };
    a.weeksOf += 1;
    if (hits[i]) a.weeksHit += 1;
    monthAgg.set(mk, a);
  });
  for (const p of dated) {
    if (!isPublished(p)) continue;
    const mk = weekStartKey(p.targetDatetime!, tz).slice(0, 7); // by its week's month, consistent with weeksOf
    const a = monthAgg.get(mk);
    if (!a) continue;
    a.posts += 1;
    if (deriveAdherence(p, now) !== 'late') a.onTime += 1;
  }
  const months: MonthRollup[] = [...monthAgg.entries()]
    .sort((x, y) => y[0].localeCompare(x[0]))
    .slice(0, MONTHS)
    .map(([key, a]) => ({
      key,
      name: MONTH_NAMES[Number(key.slice(5, 7)) - 1]!,
      weeksHit: a.weeksHit,
      weeksOf: a.weeksOf,
      posts: a.posts,
      onTimePct: pct(a.onTime, a.posts),
    }));

  const nowMonth = monthKeyOf(now, tz);
  const postsThisMonth = dated.filter((p) => isPublished(p) && monthKeyOf(p.targetDatetime!, tz) === nowMonth).length;

  // State (ADR-3: server derives the state; client owns the verdict words).
  let state: ReportState;
  if (windowWeeks < 2 || totalPublished === 0) state = 'early';
  else if (windowWeeks < 4) state = 'sparse';
  else {
    const recentHits = hits.slice(-4).filter(Boolean).length;
    state = recentHits <= 1 || streak === 0 ? 'rough' : 'rich';
  }

  // Gentle patterns — only with honest signal, and only in the rich state.
  const patterns: ReportPattern[] = [];
  if (state === 'rich') {
    const weekday = topWeekday(dated.filter(isPublished), tz);
    if (weekday) patterns.push({ kind: 'reliable_weekday', weekday });
    const preparedAheadEver = dated.some((p) => isPublished(p) && p.readiness === 'ready');
    if (preparedAheadEver && patterns.length < 2) patterns.push({ kind: 'prepare_ahead_helps' });
  }

  return {
    state,
    windowWeeks,
    streak,
    weekDots,
    trend,
    capacityLinePct: commitments.completionTargetPct ?? 80,
    months,
    platforms,
    patterns,
    postsThisMonth,
    weeksHitInWindow,
  };
}

function monthKeyOf(instant: Date, tz: string): string {
  // reuse dayKey via weekStartKey's tz handling indirectly: format month in tz
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: tz }).format(instant).slice(0, 7);
}

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function topWeekday(published: DomainPost[], tz: string): string | null {
  if (published.length < 3) return null;
  const counts = new Array(7).fill(0);
  for (const p of published) {
    const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(p.targetDatetime!);
    const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd);
    if (idx >= 0) counts[idx] += 1;
  }
  let best = 0;
  for (let i = 1; i < 7; i++) if (counts[i] > counts[best]) best = i;
  // Need a clear mode: the top day must be strictly the single max and appear ≥2×.
  if (counts[best] < 2) return null;
  if (counts.filter((c) => c === counts[best]).length > 1) return null;
  return WD[best]!;
}
