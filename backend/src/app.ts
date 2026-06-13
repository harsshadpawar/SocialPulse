import fs from 'node:fs';
import path from 'node:path';
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

  // Single-port local deploy: when the frontend has been built, the API also serves the static app
  // and SPA-falls-back to index.html for client routes (never for /api/*). In dev there's no dist —
  // Vite serves the frontend on :5173 and proxies /api here, so this block is simply skipped.
  const clientDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
