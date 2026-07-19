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
    'FISCAL_ENCRYPTION_KEY',
    'CRON_SECRET',
    'FISCAL_WORKER_SECRET',
    'INTEGRATIONS_CRON_SECRET',
    'SII_AUTO_EMIT_BOLETA',
    'BANCO_CHILE_WEBHOOK_SECRET',
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

  function seedCore() {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'.repeat(40);
    process.env.INTERNAL_API_SECRET = 'internal-secret';
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.example';
  }

  it('marks listoCore false when required missing', () => {
    const s = buildNucleoEnvRuntimeStatus();
    expect(s.listoCore).toBe(false);
    expect(s.criticosPendientes).toBeGreaterThan(0);
  });

  it('marks listoCore true when core + encryption ≥32 present', () => {
    seedCore();
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);

    const s = buildNucleoEnvRuntimeStatus();
    expect(s.listoCore).toBe(true);
    expect(s.criticosPendientes).toBe(0);
    // Never leak env *values* in payload
    expect(JSON.stringify(s)).not.toMatch(/internal-secret/);
    expect(JSON.stringify(s)).not.toContain('x'.repeat(40));
    expect(JSON.stringify(s)).not.toContain('k'.repeat(32));
  });

  it('rejects short SII_CLAVE_ENCRYPTION_KEY (same rule as crypto)', () => {
    seedCore();
    // service role still ≥32 so encryption ok via fallback — isolate by shortening it
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'short-service';
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'too-short';

    const s = buildNucleoEnvRuntimeStatus();
    const enc = s.groups
      .find((g) => g.id === 'fiscal')
      ?.items.find((i) => i.id === 'encryption');
    expect(enc?.status).toBe('missing');
    expect(s.listoCore).toBe(false);
  });

  it('treats SII_AUTO_EMIT_BOLETA only when exactly true', () => {
    seedCore();
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);
    process.env.SII_AUTO_EMIT_BOLETA = '1';

    let s = buildNucleoEnvRuntimeStatus();
    let auto = s.groups
      .find((g) => g.id === 'fiscal')
      ?.items.find((i) => i.id === 'auto_emit');
    expect(auto?.status).toBe('missing');

    process.env.SII_AUTO_EMIT_BOLETA = 'true';
    s = buildNucleoEnvRuntimeStatus();
    auto = s.groups
      .find((g) => g.id === 'fiscal')
      ?.items.find((i) => i.id === 'auto_emit');
    expect(auto?.status).toBe('ok');
  });

  it('accepts CRON_SECRET alternatives for cron readiness', () => {
    seedCore();
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);
    process.env.FISCAL_WORKER_SECRET = 'worker-secret';

    const s = buildNucleoEnvRuntimeStatus();
    const cron = s.groups
      .find((g) => g.id === 'fiscal')
      ?.items.find((i) => i.id === 'cron');
    expect(cron?.status).toBe('ok');
  });

  it('surfaces BANCO_CHILE_WEBHOOK_SECRET without leaking value', () => {
    seedCore();
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'k'.repeat(32);
    process.env.BANCO_CHILE_WEBHOOK_SECRET = 'super-secret-webhook';

    const s = buildNucleoEnvRuntimeStatus();
    const wh = s.groups
      .find((g) => g.id === 'fiscal')
      ?.items.find((i) => i.id === 'banco_webhook');
    expect(wh?.status).toBe('ok');
    expect(JSON.stringify(s)).not.toContain('super-secret-webhook');
  });
});
