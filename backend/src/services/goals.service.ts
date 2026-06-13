// v0.2d (D-44/D-47): Goals — persisted commitments + derived progress reading the SHARED weekly
// metrics (same module the Calendar consumes), so the two surfaces never disagree.
import { deriveVerdict, deriveWeeklyMetrics } from '../domain/metrics';
import type { GoalVerdict } from '../domain/metrics';
import type { Commitments } from '../domain/types';
import { prisma } from '../db/client';
import { getCommitments, saveCommitments } from './commitments.service';
import { toDomain } from './today.service';

export interface GoalMeter {
  value: number;
  total: number | null; // null = this commitment isn't set, so it isn't judged
}

export interface GoalsView {
  commitments: Commitments;
  progress: {
    published: GoalMeter;
    preparedAhead: GoalMeter;
    completion: GoalMeter;
    missed: GoalMeter;
    verdict: GoalVerdict;
    hasCommitments: boolean;
  };
}

export async function getGoals(now: Date, tz: string): Promise<GoalsView> {
  const [rows, commitments] = await Promise.all([
    prisma.platformPost.findMany({ include: { idea: true } }),
    getCommitments(),
  ]);
  const posts = rows.map(toDomain);
  const m = deriveWeeklyMetrics(posts, now, tz);
  return {
    commitments,
    progress: {
      published: { value: m.published, total: commitments.weeklyPublishTarget },
      preparedAhead: { value: m.preparedAhead, total: commitments.prepareAheadTarget },
      completion: { value: m.completionPct, total: commitments.completionTargetPct },
      missed: { value: m.missed, total: commitments.missedCeiling },
      verdict: deriveVerdict(posts, now, tz, commitments),
      hasCommitments: Object.values(commitments).some((v) => v !== null),
    },
  };
}

export async function setCommitments(input: Commitments, now: Date, tz: string): Promise<GoalsView> {
  await saveCommitments(input);
  return getGoals(now, tz);
}
