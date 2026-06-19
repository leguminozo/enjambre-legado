import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getInternalApiSecret, verifyInternalApiKey } from './internal-api-secret';

describe('internal-api-secret', () => {
  const env = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...env };
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = env;
  });

  it('prefers INTERNAL_API_SECRET when set', () => {
    process.env.INTERNAL_API_SECRET = 'dedicated-secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';

    expect(getInternalApiSecret()).toBe('dedicated-secret');
    expect(verifyInternalApiKey('dedicated-secret')).toBe(true);
    expect(verifyInternalApiKey('service-role')).toBe(false);
  });

  it('falls back to service role only outside production', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dev-service-role';

    expect(getInternalApiSecret()).toBe('dev-service-role');
    expect(verifyInternalApiKey('dev-service-role')).toBe(true);
  });

  it('rejects service role fallback in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'prod-service-role';

    expect(getInternalApiSecret()).toBeNull();
    expect(verifyInternalApiKey('prod-service-role')).toBe(false);
  });

  it('returns null when no secret is configured', () => {
    expect(getInternalApiSecret()).toBeNull();
    expect(verifyInternalApiKey(undefined)).toBe(false);
  });
});