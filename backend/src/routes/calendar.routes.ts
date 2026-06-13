import { Router } from 'express';
import { z } from 'zod';
import { getEnv } from '../config/env';
import { parseOr400 } from '../middleware/validate';
import { getCalendarMonth, getCalendarWeek } from '../services/calendar.service';

const AnchorSchema = z.object({ anchor: z.string().datetime({ offset: true }).optional() }).passthrough();

export const calendarRouter = Router();

calendarRouter.get('/api/calendar', (req, res, next) => {
  const now = new Date(); // single wall-clock read per request (#29)
  Promise.resolve()
    .then(() => parseOr400(AnchorSchema, req.query))
    .then(({ anchor }) => getCalendarWeek(now, getEnv().APP_TIMEZONE, anchor))
    .then((view) => res.json(view))
    .catch(next);
});

calendarRouter.get('/api/calendar/month', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(AnchorSchema, req.query))
    .then(({ anchor }) => getCalendarMonth(now, getEnv().APP_TIMEZONE, anchor))
    .then((view) => res.json(view))
    .catch(next);
});
