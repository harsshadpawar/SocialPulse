import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const VALID = {
  DATABASE_URL: 'postgresql://user:pw@localhost:5432/db',
};

describe('loadEnv', () => {
  it('applies defaults for PORT, BIND, APP_TIMEZONE', () => {
    const env = loadEnv(VALID);
    expect(env.PORT).toBe(3001);
    expect(env.BIND).toBe('127.0.0.1');
    expect(env.APP_TIMEZONE).toBe('Asia/Dubai');
  });

  it('coerces PORT from string', () => {
    const env = loadEnv({ ...VALID, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() => loadEnv({ DATABASE_URL: 'mysql://nope' })).toThrow(/postgresql/);
  });
});
