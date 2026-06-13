import express from 'express';
import type { Express } from 'express';
import { errorHandler } from './middleware/error';
import { calendarRouter } from './routes/calendar.routes';
import { goalsRouter } from './routes/goals.routes';
import { ideasRouter } from './routes/ideas.routes';
import { postsRouter } from './routes/posts.routes';
import { reportsRouter } from './routes/reports.routes';
import { targetsRouter } from './routes/targets.routes';
import { todayRouter } from './routes/today.routes';
import { weeklyReviewRouter } from './routes/weeklyReview.routes';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(todayRouter);
  app.use(ideasRouter);
  app.use(postsRouter);
  app.use(targetsRouter);
  app.use(calendarRouter);
  app.use(goalsRouter);
  app.use(weeklyReviewRouter);
  app.use(reportsRouter);

  app.use(errorHandler);
  return app;
}
