import express from 'express';
import type { Express } from 'express';
import { errorHandler } from './middleware/error';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // M1 adds: GET /api/today
  // M2 adds: POST /api/ideas
  // M3+ adds: GET/PATCH /api/posts/:id, /ready, /posted, /keep-missed

  app.use(errorHandler);
  return app;
}
