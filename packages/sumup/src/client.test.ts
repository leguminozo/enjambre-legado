import { afterEach, describe, expect, it, vi } from 'vitest';
import { SumUpClient } from './client';

describe('SumUpClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('construye requests con Bearer y merchant', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ id: 'tx-1', status: 'SUCCESSFUL' }),
    });

    const client = new SumUpClient({ apiKey: 'sk_test', merchantCode: 'MC123' });
    const res = await client.getTransaction({ id: 'tx-1' });

    expect(res.success).toBe(true);
    if (res.success) expect(res.data.id).toBe('tx-1');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain('/v2.1/merchants/MC123/transactions');
    expect(url).toContain('id=tx-1');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk_test');
  });

  it('mapea errores HTTP a SumUpResult', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'UNAUTHORIZED', message: 'bad key' }),
    });

    const client = new SumUpClient({ apiKey: 'bad', merchantCode: 'MC' });
    const res = await client.getTransaction({ id: 'x' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.status).toBe(401);
      expect(res.error.message).toMatch(/bad key/i);
    }
  });

  it('mapea fallo de red', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    const client = new SumUpClient({ apiKey: 'k', merchantCode: 'm' });
    const res = await client.getTransaction({ id: 'x' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe('NETWORK_ERROR');
  });

  it('listReaders normaliza items|readers|array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        items: [{ id: 'r1', name: 'Solo', status: 'online' }],
      }),
    });
    const client = new SumUpClient({ apiKey: 'k', merchantCode: 'm' });
    const res = await client.listReaders();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0]?.id).toBe('r1');
    }
  });
});

