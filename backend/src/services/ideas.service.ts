// "Next" on New Idea: create the ContentIdea AND derive its first PlatformPost — one transaction.
// v0.1 derivation defaults: LinkedIn · text_post · Draft, empty caption, no target (decision #12 pairs).
import { prisma } from '../db/client';
import { toDomain, toView } from './today.service';
import type { PostView } from './today.service';

export interface CreateIdeaInput {
  title: string;
  coreMessage: string;
}

export async function createIdeaWithPost(input: CreateIdeaInput, now: Date): Promise<PostView> {
  // Nested create = single transactional statement; no partial idea-without-post possible.
  const idea = await prisma.contentIdea.create({
    data: {
      title: input.title,
      coreMessage: input.coreMessage,
      posts: {
        create: {
          platform: 'linkedin',
          format: 'text_post',
        },
      },
    },
    include: { posts: true },
  });

  const post = idea.posts[0];
  if (!post) throw new Error('Invariant violated: idea created without its derived post');

  return toView(toDomain({ ...post, idea: { title: idea.title, coreMessage: idea.coreMessage } }), now);
}
