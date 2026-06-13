import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '../config/env';
import { parseOr400 } from '../middleware/validate';
import { getWeeklyReview, saveReflection } from '../services/weeklyReview.service';

const ReflectionSchema = z
  .object({
    blockers: z.string().max(2_000),
    repeat: z.string().max(2_000),
    stop: z.string().max(2_000),
  })
  .strict();

export const weeklyReviewRouter = Router();

weeklyReviewRouter.get('/api/weekly-review', (_req, res, next) => {
  const now = new Date();
  getWeeklyReview(now, getEnv().APP_TIMEZONE)
    .then((view) => res.json(view))
    .catch(next);
});

weeklyReviewRouter.put('/api/weekly-review/reflection', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(ReflectionSchema, req.body))
    .then((input) => saveReflection(now, getEnv().APP_TIMEZONE, input))
    .then((view) => res.json(view))
    .catch(next);
});
