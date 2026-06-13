// v0.2k (D-64): Consistency Reports service — loads posts + commitments, returns the pure derivation.
import { deriveConsistencyReport } from '../domain/reports';
import type { ConsistencyReport } from '../domain/reports';
import { prisma } from '../db/client';
import { getCommitments } from './commitments.service';
import { toDomain } from './today.service';

export async function getConsistencyReport(now: Date, tz: string): Promise<ConsistencyReport> {
  const [rows, commitments] = await Promise.all([
    prisma.platformPost.findMany({ include: { idea: true } }),
    getCommitments(),
  ]);
  return deriveConsistencyReport(rows.map(toDomain), now, tz, commitments);
}
