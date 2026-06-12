import { Router } from 'express';
import { getEnv } from '../config/env';
import { getTodayView } from '../services/today.service';

export const todayRouter = Router();

todayRouter.get('/api/today', (req, res, next) => {
  // The single wall-clock read for this request (#29) — everything downstream receives it.
  const now = new Date();
  getTodayView(now, getEnv().APP_TIMEZONE)
    .then((view) => res.json(view))
    .catch(next);
});
