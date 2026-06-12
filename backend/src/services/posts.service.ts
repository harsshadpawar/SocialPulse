import { AppError } from '../middleware/error';
import { prisma } from '../db/client';
import { toDomain, toView } from './today.service';
import type { PostView } from './today.service';

export async function getPostView(id: string, now: Date): Promise<PostView> {
  const row = await prisma.platformPost.findUnique({ where: { id }, include: { idea: true } });
  if (!row) throw new AppError(404, 'post_not_found', 'This post does not exist.');
  return toView(toDomain(row), now);
}
