import express from 'express';
import type { Express } from 'express';
import { errorHandler } from './middleware/error';
import { ideasRouter } from './routes/ideas.routes';
import { postsRouter } from './routes/posts.routes';
import { todayRouter } from './routes/today.routes';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(todayRouter);
  app.use(ideasRouter);
  app.use(postsRouter);

  app.use(errorHandler);
  return app;
}
