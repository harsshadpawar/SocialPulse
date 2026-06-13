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
import type { AdherenceStatus, CardState, DomainPost, EffortScore, Platform, PostingStatus, Readiness } from '../domain/types';
import { prisma } from '../db/client';
import { getCommitments } from './commitments.service';
import { toDomain } from './today.service';

export interface CalPostView {
  id: string;
  ideaTitle: string;
  platform: Platform;
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
    targetDatetime: p.targetDatetime!.toISOString(),
    readiness: p.readiness,
    postingStatus: status,
    adherenceStatus: deriveAdherence(p, now),
    cardState: deriveCardState(p, now),
    effortScore: deriveEffort(p.format),
    missed: status === 'missed',
  };
}

export async function getCalendarWeek(now: Date, tz: string): Promise<CalendarView> {
  const startKey = weekStartKey(now, tz);
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
    isToday: k === todayKey,
    posts: (byDay.get(k) ?? [])
      .sort((a, b) => a.targetDatetime!.getTime() - b.targetDatetime!.getTime())
      .map((p) => calPost(p, now)),
  }));

  return {
    weekStartKey: startKey,
    weekEndKey: endKey,
    label: weekLabel(startKey, endKey),
    days,
    effort: { used: deriveWeeklyEffort(posts, now, tz).score, capacity: commitments.weeklyCapacity },
    realism: deriveWeekRealism(posts, now, tz, commitments.weeklyCapacity),
  };
}
