import { Router } from 'express';
import { z } from 'zod';
import { parseOr400 } from '../middleware/validate';
import { createIdeaWithPost } from '../services/ideas.service';

const CreateIdeaSchema = z.object({
  title: z.string().trim().min(1, 'Give the idea a title.'),
  coreMessage: z.string().trim().min(1, 'Capture the core message.'),
});

export const ideasRouter = Router();

ideasRouter.post('/api/ideas', (req, res, next) => {
  const now = new Date(); // single clock read per request (#29)
  Promise.resolve()
    .then(() => parseOr400(CreateIdeaSchema, req.body))
    .then((input) => createIdeaWithPost(input, now))
    .then((post) => res.status(201).json({ post }))
    .catch(next);
});
