import express from 'express';
import type { Express } from 'express';
import { errorHandler } from './middleware/error';
import { todayRouter } from './routes/today.routes';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(todayRouter);

  // M2 adds: POST /api/ideas
  // M3+ adds: GET/PATCH /api/posts/:id, /ready, /posted, /keep-missed

  app.use(errorHandler);
  return app;
}
