// v0.2d (D-45): Calendar Week View assembly. Current Dubai ISO week (Mon–Sun); the hi-fi shows one
// week with no nav arrows, so month/prev-next are out of scope here. Reads the shared effort/realism
// derivations; the client owns the calm microcopy.
import { deriveAdherence } from '../domain/adherence';
import { deriveEffort, deriveWeeklyEffort } from '../domain/effort';
import { deriveWeekRealism } from '../domain/planning';
import type { WeekRealism } from '../domain/planning';
import { derivePostingStatus } from '../domain/postingStatus';
import { deriveCardState } from '../domain/selector';
import { dayKey, weekStartKey } from '../domain/time';
import type { AdherenceStatus, CardState, DomainPost, EffortScore, Format, Platform, PostingStatus, Readiness } from '../domain/types';
import { prisma } from '../db/client';
import { getCommitments } from './commitments.service';
import { toDomain } from './today.service';

export interface CalPostView {
  id: string;
  ideaTitle: string;
  platform: Platform;
  format: Format;
  targetDatetime: string; // ISO — calendar items are always scheduled
  readiness: Readiness;
  postingStatus: PostingStatus;
  adherenceStatus: AdherenceStatus;
  cardState: CardState;
  effortScore: EffortScore;
  missed: boolean;
}

export interface CalDay {
  dayKey: string; // YYYY-MM-DD (Dubai)
  dow: string; // Mon..Sun
  dayNum: number;
  isToday: boolean;
  posts: CalPostView[];
}

export interface CalendarView {
  weekStartKey: string;
  weekEndKey: string;
  label: string; // "Jun 8 – 14"
  days: CalDay[];
  effort: { used: number; capacity: number | null };
  realism: WeekRealism;
  // v0.2h navigation
  prevAnchor: string; // ISO date in the previous week
  nextAnchor: string; // ISO date in the next week
  isCurrentWeek: boolean;
}

/* ── v0.2h Month view — lighter overview across 5–6 weeks ── */

export interface CompactPost {
  id: string;
  ideaTitle: string;
  platform: Platform;
  format: Format;
  postingStatus: PostingStatus;
  cardState: CardState;
  missed: boolean;
}

export interface MonthDay {
  dayKey: string;
  dayNum: number;
  inMonth: boolean; // false for leading/trailing days from adjacent months
  isToday: boolean;
  posts: CompactPost[];
}

export interface MonthView {
  monthKey: string; // 'YYYY-MM'
  label: string; // "June 2026"
  days: MonthDay[]; // 35 or 42 cells, Mon-first
  prevAnchor: string; // ISO date in the previous month
  nextAnchor: string; // ISO date in the next month
  isCurrentMonth: boolean;
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function noonUtc(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12));
}

function weekLabel(startKey: string, endKey: string): string {
  const fmtMD = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const fmtD = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' });
  const sameMonth = startKey.slice(0, 7) === endKey.slice(0, 7);
  return `${fmtMD.format(noonUtc(startKey))} – ${sameMonth ? fmtD.format(noonUtc(endKey)) : fmtMD.format(noonUtc(endKey))}`;
}

function calPost(p: DomainPost, now: Date): CalPostView {
  const status = derivePostingStatus(p, now);
  return {
    id: p.id,
    ideaTitle: p.ideaTitle,
    platform: p.platform,
    format: p.format,
    targetDatetime: p.targetDatetime!.toISOString(),
    readiness: p.readiness,
    postingStatus: status,
    adherenceStatus: deriveAdherence(p, now),
    cardState: deriveCardState(p, now),
    effortScore: deriveEffort(p.format),
    missed: status === 'missed',
  };
}

export async function getCalendarWeek(now: Date, tz: string, anchorIso?: string): Promise<CalendarView> {
  const anchor = anchorIso ? new Date(anchorIso) : now;
  const startKey = weekStartKey(anchor, tz);
  const [y, m, d] = startKey.split('-').map(Number);
  const dayKeys = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y!, m! - 1, d! + i, 12)).toISOString().slice(0, 10));
  const endKey = dayKeys[6]!;

  const [rows, commitments] = await Promise.all([
    prisma.platformPost.findMany({ include: { idea: true } }),
    getCommitments(),
  ]);
  const posts = rows.map(toDomain);
  const todayKey = dayKey(now, tz);

  const byDay = new Map<string, DomainPost[]>(dayKeys.map((k) => [k, []]));
  for (const p of posts) {
    if (p.targetDatetime === null) continue;
    byDay.get(dayKey(p.targetDatetime, tz))?.push(p);
  }

  const days: CalDay[] = dayKeys.map((k, i) => ({
    dayKey: k,
    dow: DOW[i]!,
    dayNum: Number(k.split('-')[2]),
    isToday: k === todayKey, // against the real clock, even on a navigated week
    posts: (byDay.get(k) ?? [])
      .sort((a, b) => a.targetDatetime!.getTime() - b.targetDatetime!.getTime())
      .map((p) => calPost(p, now)),
  }));

  const startNoon = noonUtc(startKey);
  return {
    weekStartKey: startKey,
    weekEndKey: endKey,
    label: weekLabel(startKey, endKey),
    days,
    // effort/realism for the DISPLAYED week (anchor), but post status always vs real now.
    effort: { used: deriveWeeklyEffort(posts, now, tz, anchor).score, capacity: commitments.weeklyCapacity },
    realism: deriveWeekRealism(posts, now, tz, commitments.weeklyCapacity, anchor),
    prevAnchor: new Date(startNoon.getTime() - 7 * 86_400_000).toISOString(),
    nextAnchor: new Date(startNoon.getTime() + 7 * 86_400_000).toISOString(),
    isCurrentWeek: weekStartKey(now, tz) === startKey,
  };
}

function compactPost(p: DomainPost, now: Date): CompactPost {
  const status = derivePostingStatus(p, now);
  return {
    id: p.id,
    ideaTitle: p.ideaTitle,
    platform: p.platform,
    format: p.format,
    postingStatus: status,
    cardState: deriveCardState(p, now),
    missed: status === 'missed',
  };
}

export async function getCalendarMonth(now: Date, tz: string, anchorIso?: string): Promise<MonthView> {
  const anchor = anchorIso ? new Date(anchorIso) : now;
  const monthKey = dayKey(anchor, tz).slice(0, 7); // 'YYYY-MM'
  const [yy, mm] = monthKey.split('-').map(Number); // mm is 1-based
  const firstKey = `${monthKey}-01`;
  const lastDayNum = new Date(Date.UTC(yy!, mm!, 0)).getUTCDate();
  const lastKey = `${monthKey}-${String(lastDayNum).padStart(2, '0')}`;

  const gridStartNoon = noonUtc(weekStartKey(noonUtc(firstKey), tz)); // Monday on/before the 1st
  const gridEndNoon = new Date(noonUtc(weekStartKey(noonUtc(lastKey), tz)).getTime() + 6 * 86_400_000); // Sun of last week

  const dayKeys: string[] = [];
  for (let t = gridStartNoon.getTime(); t <= gridEndNoon.getTime(); t += 86_400_000) {
    dayKeys.push(new Date(t).toISOString().slice(0, 10));
  }

  const rows = await prisma.platformPost.findMany({ include: { idea: true } });
  const posts = rows.map(toDomain);
  const todayKey = dayKey(now, tz);
  const byDay = new Map<string, DomainPost[]>(dayKeys.map((k) => [k, []]));
  for (const p of posts) {
    if (p.targetDatetime === null) continue;
    const k = dayKey(p.targetDatetime, tz);
    byDay.get(k)?.push(p);
  }

  const days: MonthDay[] = dayKeys.map((k) => ({
    dayKey: k,
    dayNum: Number(k.split('-')[2]),
    inMonth: k.slice(0, 7) === monthKey,
    isToday: k === todayKey,
    posts: (byDay.get(k) ?? [])
      .sort((a, b) => a.targetDatetime!.getTime() - b.targetDatetime!.getTime())
      .map((p) => compactPost(p, now)),
  }));

  const prevMonthFirst = new Date(Date.UTC(yy!, mm! - 2, 1, 12)).toISOString(); // mm-1 (0-based) − 1
  const nextMonthFirst = new Date(Date.UTC(yy!, mm!, 1, 12)).toISOString(); // mm (0-based) = next month
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(noonUtc(firstKey));

  return {
    monthKey,
    label: monthLabel,
    days,
    prevAnchor: prevMonthFirst,
    nextAnchor: nextMonthFirst,
    isCurrentMonth: dayKey(now, tz).slice(0, 7) === monthKey,
  };
}
