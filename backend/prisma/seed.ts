// Idempotent demo seed — the validation example from the handoff README:
// "AI credit scoring must be explainable" · LinkedIn · text post · Draft.
// Fixed UUIDs so re-running seed never duplicates.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const IDEA_ID = '5e9a1c1e-0000-4000-8000-000000000001';
const POST_ID = '5e9a1c1e-0000-4000-8000-000000000002';

async function main(): Promise<void> {
  await prisma.contentIdea.upsert({
    where: { id: IDEA_ID },
    update: {},
    create: {
      id: IDEA_ID,
      title: 'AI credit scoring must be explainable',
      coreMessage:
        'Banks adopting AI scoring owe customers a reason, not a verdict. Explainability is the product, not a feature.',
    },
  });

  await prisma.platformPost.upsert({
    where: { id: POST_ID },
    update: {},
    create: {
      id: POST_ID,
      contentIdeaId: IDEA_ID,
      platform: 'linkedin',
      format: 'text_post',
      // caption empty, no target — exactly where the New Idea → "Next" flow drops the user.
    },
  });

  console.log('Seeded: 1 idea + 1 LinkedIn draft post.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
