// The ONLY Prisma import site outside prisma/ and scripts/ (decision #28: Prisma is persistence only).
// Routes never import this; services do. domain/ imports nothing.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
