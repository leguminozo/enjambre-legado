import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildNucleoEnvRuntimeStatus } from './env-runtime-status';

describe('buildNucleoEnvRuntimeStatus', () => {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_API_SECRET',
    'NEXT_PUBLIC_URL_TIENDA',
    'SII_CLAVE_ENCRYPTION_KEY',
    'CRON_SECRET',
    'FLOW_API_KEY',
    'FLOW_SECRET',
    'FLOW_API_URL',
    'VERCEL_ENV',
  ] as const;
  const snap: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) snap[k] = process.env[k];
    for (const k of keys) delete process.env[k];
  });

  afterEach(() => {
    for (const k of keys) {
      if (snap[k] === undefined) delete process.env[k];
      else process.env[k] = snap[k];
    }
  });

  it('marks listoCore false when required missing', () => {
    const s = buildNucleoEnvRuntimeStatus();
    expect(s.listoCore).toBe(false);
    expect(s.criticosPendientes).toBeGreaterThan(0);
  });

  it('marks listoCore true when core + encryption present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'.repeat(40);
    process.env.INTERNAL_API_SECRET = 'internal-secret';
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.example';
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);

    const s = buildNucleoEnvRuntimeStatus();
    expect(s.listoCore).toBe(true);
    expect(s.criticosPendientes).toBe(0);
    // Never leak env *values* in payload
    expect(JSON.stringify(s)).not.toMatch(/internal-secret/);
    expect(JSON.stringify(s)).not.toContain('x'.repeat(40));
  });
});
