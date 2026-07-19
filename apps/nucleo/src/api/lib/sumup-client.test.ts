import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveSumUpApiKey, encryptSumUpApiKey, resolveSumUpClient } from './sumup-client';

describe('sumup-client credentials', () => {
  const prevKey = process.env.SII_CLAVE_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SII_CLAVE_ENCRYPTION_KEY = 's'.repeat(32);
  });

  afterEach(() => {
    if (prevKey === undefined) delete process.env.SII_CLAVE_ENCRYPTION_KEY;
    else process.env.SII_CLAVE_ENCRYPTION_KEY = prevKey;
  });

  it('encrypts and decrypts API key', async () => {
    const enc = await encryptSumUpApiKey('sup_sk_live_demo');
    expect(enc).toBeTruthy();
    expect(enc).not.toContain('sup_sk');
    const plain = await resolveSumUpApiKey(enc!);
    expect(plain).toBe('sup_sk_live_demo');
  });

  it('accepts legacy plaintext keys', async () => {
    const plain = await resolveSumUpApiKey('sup_sk_legacy_plain');
    expect(plain).toBe('sup_sk_legacy_plain');
  });

  it('resolveSumUpClient fails closed without config', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as any;

    const r = await resolveSumUpClient(supabase, 'emp-1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('no_config');
  });

  it('resolveSumUpClient builds client when enabled + key present', async () => {
    const enc = await encryptSumUpApiKey('sup_sk_test');
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            api_key: enc,
            merchant_code: 'MC123',
            environment: 'test',
            enabled: true,
            last_sync: null,
            sync_interval_minutes: 30,
          },
          error: null,
        }),
      })),
    } as any;

    const r = await resolveSumUpClient(supabase, 'emp-1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.merchant_code).toBe('MC123');
      expect(r.client).toBeTruthy();
    }
  });
});
