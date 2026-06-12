import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine((u) => u.startsWith('postgresql://') || u.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a postgresql:// URL',
    }),
  PORT: z.coerce.number().int().positive().default(3001),
  BIND: z.string().default('127.0.0.1'),
  APP_TIMEZONE: z.string().default('Asia/Dubai'),
});

export type Env = z.infer<typeof EnvSchema>;

/** Parse + validate environment. Throws with a readable message on misconfiguration. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}

let cached: Env | undefined;

/** Lazy singleton — call sites get one validated Env; tests use loadEnv() directly. */
export function getEnv(): Env {
  cached ??= loadEnv();
  return cached;
}
