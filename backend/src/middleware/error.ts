import type { NextFunction, Request, Response } from 'express';

/** Typed application error — services throw these; the handler renders them. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Central error handler — never swallow, never leak internals. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // Unknown error: log it fully, return a generic body.
  console.error(err);
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong.' } });
}
