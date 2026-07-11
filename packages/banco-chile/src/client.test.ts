import { afterEach, describe, expect, it, vi } from 'vitest';
import { BancoChileClient } from './client';

const baseConfig = {
  clientId: 'cid',
  clientSecret: 'csec',
  username: 'user',
  password: 'pass',
};

describe('BancoChileClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('usa sandbox URL por defecto / environment sandbox', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'tok',
        refresh_token: 'ref',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'accounts',
      }),
    });

    const client = new BancoChileClient({ ...baseConfig, environment: 'sandbox' });
    const res = await client.authenticate();
    expect(res.success).toBe(true);

    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('apistore.bancochile.cl');
    expect(url).toContain('/oauth/token');
  });

  it('usa api.bancochile.cl en production', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'tok',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    });

    const client = new BancoChileClient({ ...baseConfig, environment: 'production' });
    await client.authenticate();
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('https://api.bancochile.cl');
  });

  it('AUTH_FAILED en 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'invalid client' }),
    });

    const client = new BancoChileClient({ ...baseConfig, environment: 'sandbox' });
    const res = await client.authenticate();
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe('AUTH_FAILED');
  });

  it('NETWORK_ERROR si fetch lanza', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('down'));
    const client = new BancoChileClient({ ...baseConfig, environment: 'sandbox' });
    const res = await client.authenticate();
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe('NETWORK_ERROR');
  });
});
