import { Router } from 'express';
import { z } from 'zod';
import { parseOr400 } from '../middleware/validate';
import { acknowledgeMissed, getPostView, markPosted, markReady, quickStart, updatePost } from '../services/posts.service';

const IdParamSchema = z.object({ id: z.string().uuid('Not a valid post id.') });

const UpdatePostSchema = z
  .object({
    platform: z.enum(['linkedin', 'x', 'youtube', 'instagram']).optional(),
    format: z.enum(['text_post', 'short_post', 'short_video', 'reel']).optional(),
    caption: z.string().max(10_000).optional(),
    targetDatetime: z.string().datetime({ offset: true }).nullable().optional(),
    actualDatetime: z.string().datetime({ offset: true }).optional(), // Posted only — service enforces
    nativePostUrl: z.string().url().max(2_000).nullable().optional(), // Posted only — service enforces
  })
  .strict();

const MarkPostedSchema = z
  .object({
    actualDatetime: z.string().datetime({ offset: true }).optional(),
    nativePostUrl: z.union([z.string().url().max(2_000), z.literal('')]).optional(),
  })
  .strict();

export const postsRouter = Router();

postsRouter.get('/api/posts/:id', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(IdParamSchema, req.params))
    .then(({ id }) => getPostView(id, now))
    .then((post) => res.json({ post }))
    .catch(next);
});

postsRouter.patch('/api/posts/:id', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => ({
      params: parseOr400(IdParamSchema, req.params),
      body: parseOr400(UpdatePostSchema, req.body),
    }))
    .then(({ params, body }) => updatePost(params.id, body, now))
    .then((post) => res.json({ post }))
    .catch(next);
});

postsRouter.post('/api/posts/:id/ready', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(IdParamSchema, req.params))
    .then(({ id }) => markReady(id, now))
    .then(({ ready, missing, post }) => res.json({ ready, missing, post }))
    .catch(next);
});

postsRouter.post('/api/posts/:id/posted', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => ({
      params: parseOr400(IdParamSchema, req.params),
      body: parseOr400(MarkPostedSchema, req.body ?? {}),
    }))
    .then(({ params, body }) => markPosted(params.id, body, now))
    .then(({ post }) => res.json({ post }))
    .catch(next);
});

postsRouter.post('/api/posts/:id/quick-start', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(IdParamSchema, req.params))
    .then(({ id }) => quickStart(id, now))
    .then((post) => res.json({ post }))
    .catch(next);
});

postsRouter.post('/api/posts/:id/keep-missed', (req, res, next) => {
  const now = new Date();
  Promise.resolve()
    .then(() => parseOr400(IdParamSchema, req.params))
    .then(({ id }) => acknowledgeMissed(id, now))
    .then(({ post }) => res.json({ post }))
    .catch(next);
});
