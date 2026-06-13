import { Router } from 'express';
import { getEnv } from '../config/env';
import { getCalendarWeek } from '../services/calendar.service';

export const calendarRouter = Router();

calendarRouter.get('/api/calendar', (_req, res, next) => {
  const now = new Date(); // single wall-clock read per request (#29)
  getCalendarWeek(now, getEnv().APP_TIMEZONE)
    .then((view) => res.json(view))
    .catch(next);
});
