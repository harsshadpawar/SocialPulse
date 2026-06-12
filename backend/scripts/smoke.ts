// M0 smoke check: one real DB round-trip through Prisma.
// Proves: Docker PG up + migration applied + seed present + client generated.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const posts = await prisma.platformPost.findMany({ include: { idea: true } });
  if (posts.length === 0) {
    throw new Error('Smoke FAILED: no posts found. Did you run `npm run seed`?');
  }
  const p = posts[0]!;
  console.log(
    `Smoke OK — "${p.idea.title}" · ${p.platform} · ${p.format} · readiness=${p.readiness} · target=${
      p.targetDatetime?.toISOString() ?? 'none'
    }`,
  );
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
