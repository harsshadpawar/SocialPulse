// Validate ALL input at the edge (engineering rail). Throws typed AppError → central handler.
import type { ZodSchema } from 'zod';
import { AppError } from './error';

export function parseOr400<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.join('.') || 'input';
    throw new AppError(400, 'invalid_input', `${where}: ${first?.message ?? 'invalid'}`);
  }
  return result.data;
}
