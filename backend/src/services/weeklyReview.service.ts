// Phase 2 (D-48/D-49): Weekly Review. The summary reads the SHARED deriveWeeklyMetrics ONLY — it
// never recomputes completion/on-time/execution/missed. Reflection notes (blockers/repeat/stop) are
// user-authored artifacts, persisted per Dubai ISO week via raw SQL. Current week only (D-51).
import { deriveWeeklyMetrics } from '../domain/metrics';
import type { WeeklyMetrics } from '../domain/metrics';
import { weekStartKey } from '../domain/time';
import { prisma } from '../db/client';
import { toDomain } from './today.service';

export interface Reflection {
  blockers: string;
  repeat: string;
  stop: string;
}

export interface WeeklyReviewView {
  weekStartKey: string;
  label: string;
  metrics: WeeklyMetrics;
  reflection: Reflection;
}

function noonUtc(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12));
}

function weekLabel(startKey: string): string {
  const start = noonUtc(startKey);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 6);
  const endKey = end.toISOString().slice(0, 10);
  const fmtMD = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const fmtD = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' });
  const sameMonth = startKey.slice(0, 7) === endKey.slice(0, 7);
  return `${fmtMD.format(start)} – ${sameMonth ? fmtD.format(end) : fmtMD.format(end)}`;
}

interface ReflectionRow {
  blockers: string;
  repeat: string;
  stop: string;
}

async function readReflection(key: string): Promise<Reflection> {
  const rows = await prisma.$queryRaw<ReflectionRow[]>`
    SELECT "blockers", "repeat", "stop" FROM "weekly_review" WHERE "week_start_key" = ${key}
  `;
  const r = rows[0];
  return { blockers: r?.blockers ?? '', repeat: r?.repeat ?? '', stop: r?.stop ?? '' };
}

export async function getWeeklyReview(now: Date, tz: string): Promise<WeeklyReviewView> {
  const key = weekStartKey(now, tz);
  const [rows, reflection] = await Promise.all([
    prisma.platformPost.findMany({ include: { idea: true } }),
    readReflection(key),
  ]);
  return {
    weekStartKey: key,
    label: weekLabel(key),
    metrics: deriveWeeklyMetrics(rows.map(toDomain), now, tz),
    reflection,
  };
}

export async function saveReflection(now: Date, tz: string, input: Reflection): Promise<WeeklyReviewView> {
  const key = weekStartKey(now, tz);
  await prisma.$executeRaw`
    INSERT INTO "weekly_review" ("week_start_key", "blockers", "repeat", "stop", "updated_at")
    VALUES (${key}, ${input.blockers}, ${input.repeat}, ${input.stop}, now())
    ON CONFLICT ("week_start_key") DO UPDATE SET
      "blockers" = ${input.blockers}, "repeat" = ${input.repeat}, "stop" = ${input.stop}, "updated_at" = now()
  `;
  return getWeeklyReview(now, tz);
}
