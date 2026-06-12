// Posting targets (D-32/D-33): one row, targets-as-data. NULL = no target for that period.
import { prisma } from '../db/client';

export interface TargetView {
  dailyTarget: number | null;
  weeklyTarget: number | null;
}

export async function getTarget(): Promise<TargetView> {
  const row = await prisma.postingTarget.findUnique({ where: { id: 1 } });
  return { dailyTarget: row?.dailyTarget ?? null, weeklyTarget: row?.weeklyTarget ?? null };
}

export async function setTarget(input: TargetView): Promise<TargetView> {
  const row = await prisma.postingTarget.upsert({
    where: { id: 1 },
    update: { dailyTarget: input.dailyTarget, weeklyTarget: input.weeklyTarget },
    create: { id: 1, dailyTarget: input.dailyTarget, weeklyTarget: input.weeklyTarget },
  });
  return { dailyTarget: row.dailyTarget, weeklyTarget: row.weeklyTarget };
}
