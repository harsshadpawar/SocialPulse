import { Router } from 'express';
import { z } from 'zod';
import { parseOr400 } from '../middleware/validate';
import { getPostView } from '../services/posts.service';

const IdParamSchema = z.object({ id: z.string().uuid('Not a valid post id.') });

export const postsRouter = Router();

postsRouter.get('/api/posts/:id', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(IdParamSchema, req.params))
    .then(({ id }) => getPostView(id, now))
    .then((post) => res.json({ post }))
    .catch(next);
});

// M3 adds: PATCH /api/posts/:id (Save Draft / fields), POST /api/posts/:id/ready
// M4 adds: POST /api/posts/:id/posted
// M5 adds: POST /api/posts/:id/keep-missed
