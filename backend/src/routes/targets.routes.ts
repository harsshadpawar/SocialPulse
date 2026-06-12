import { Router } from 'express';
import { z } from 'zod';
import { parseOr400 } from '../middleware/validate';
import { getTarget, setTarget } from '../services/targets.service';

const TargetSchema = z
  .object({
    dailyTarget: z.number().int().min(1).max(50).nullable(),
    weeklyTarget: z.number().int().min(1).max(200).nullable(),
  })
  .strict();

export const targetsRouter = Router();

targetsRouter.get('/api/target', (_req, res, next) => {
  getTarget()
    .then((t) => res.json(t))
    .catch(next);
});

targetsRouter.put('/api/target', (req, res, next) => {
  Promise.resolve()
    .then(() => parseOr400(TargetSchema, req.body))
    .then((input) => setTarget(input))
    .then((t) => res.json(t))
    .catch(next);
});
