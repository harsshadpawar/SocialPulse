import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '../config/env';
import { parseOr400 } from '../middleware/validate';
import { getGoals, setCommitments } from '../services/goals.service';

// v0.2d (D-43): all commitments nullable — a target left unset simply isn't judged.
const CommitmentsSchema = z
  .object({
    weeklyPublishTarget: z.number().int().min(1).max(50).nullable(),
    prepareAheadTarget: z.number().int().min(0).max(50).nullable(),
    completionTargetPct: z.number().int().min(0).max(100).nullable(),
    missedCeiling: z.number().int().min(0).max(50).nullable(),
    weeklyCapacity: z.number().int().min(1).max(100).nullable(),
  })
  .strict();

export const goalsRouter = Router();

goalsRouter.get('/api/goals', (_req, res, next) => {
  const now = new Date();
  getGoals(now, getEnv().APP_TIMEZONE)
    .then((view) => res.json(view))
    .catch(next);
});

goalsRouter.put('/api/goals', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(CommitmentsSchema, req.body))
    .then((input) => setCommitments(input, now, getEnv().APP_TIMEZONE))
    .then((view) => res.json(view))
    .catch(next);
});
