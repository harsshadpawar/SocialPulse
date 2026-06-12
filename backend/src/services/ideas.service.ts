// "Next" on New Idea: create the ContentIdea AND derive its first PlatformPost — one transaction.
// v0.1 derivation defaults: LinkedIn · text_post · Draft, empty caption, no target (decision #12 pairs).
import { prisma } from '../db/client';
import { toDomain, toView } from './today.service';
import type { PostView } from './today.service';
// (getPostView for the editor lives in posts.service.ts)

export interface CreateIdeaInput {
  title: string;
  coreMessage: string;
}

export async function createIdeaWithPost(input: CreateIdeaInput, now: Date): Promise<PostView> {
  // One transaction: idea + derived post + 'created' event (ADR-5).
  const idea = await prisma.$transaction(async (tx) => {
    const created = await tx.contentIdea.create({
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
    const post = created.posts[0];
    if (!post) throw new Error('Invariant violated: idea created without its derived post');
    await tx.adherenceEvent.create({
      data: { platformPostId: post.id, eventType: 'created', at: now, newValue: 'linkedin/text_post' },
    });
    return created;
  });

  const post = idea.posts[0];
  if (!post) throw new Error('Invariant violated: idea created without its derived post');

  return toView(toDomain({ ...post, idea: { title: idea.title, coreMessage: idea.coreMessage } }), now);
}
