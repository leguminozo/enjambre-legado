import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from './ratelimit';

describe('ratelimit', () => {
  const env = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...env };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = env;
  });

  it('enforces in-memory limits when Upstash is not configured', async () => {
    const identifier = `test-ip-${Date.now()}`;
    const config = { identifier, limit: 2, window: '1 m' as const };

    const first = await checkRateLimit(config);
    const second = await checkRateLimit(config);
    const third = await checkRateLimit(config);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });
});