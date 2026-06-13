// v0.2k (D-64): GET /api/reports — consistency over weeks & months (read-only aggregation).
import { Router } from 'express';
import { getEnv } from '../config/env';
import { getConsistencyReport } from '../services/reports.service';

export const reportsRouter = Router();

reportsRouter.get('/api/reports', (_req, res, next) => {
  const now = new Date(); // single wall-clock read per request (#29)
  getConsistencyReport(now, getEnv().APP_TIMEZONE)
    .then((view) => res.json(view))
    .catch(next);
});
