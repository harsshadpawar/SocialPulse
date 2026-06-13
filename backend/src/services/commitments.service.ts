// v0.2d (D-43): the commitments store — the same one-row posting_target table, now carrying Goal
// Setup's five fields. weeklyPublishTarget is the existing weekly_target column; daily_target is left
// to the v0.2a targets strip and never touched here.
import { prisma } from '../db/client';
import type { Commitments } from '../domain/types';

export async function getCommitments(): Promise<Commitments> {
  const row = await prisma.postingTarget.findUnique({ where: { id: 1 } });
  return {
    weeklyPublishTarget: row?.weeklyTarget ?? null,
    prepareAheadTarget: row?.prepareAheadTarget ?? null,
    completionTargetPct: row?.completionTargetPct ?? null,
    missedCeiling: row?.missedCeiling ?? null,
    weeklyCapacity: row?.weeklyCapacity ?? null,
  };
}

export async function saveCommitments(c: Commitments): Promise<Commitments> {
  const fields = {
    weeklyTarget: c.weeklyPublishTarget,
    prepareAheadTarget: c.prepareAheadTarget,
    completionTargetPct: c.completionTargetPct,
    missedCeiling: c.missedCeiling,
    weeklyCapacity: c.weeklyCapacity,
  };
  await prisma.postingTarget.upsert({
    where: { id: 1 },
    update: fields, // leaves daily_target (the targets strip's field) untouched
    create: { id: 1, ...fields },
  });
  return getCommitments();
}
