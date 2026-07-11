import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('revalidateTiendaCms', () => {
  const originalFetch = globalThis.fetch;
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envSnapshot };
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('no llama fetch si falta URL de tienda', async () => {
    delete process.env.NEXT_PUBLIC_URL_TIENDA;
    delete process.env.NEXT_PUBLIC_TIENDA_URL;
    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await revalidateTiendaCms();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('POST a /api/cms/revalidate con Bearer secret', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test/';
    process.env.CMS_REVALIDATE_SECRET = 'sec-abc';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await revalidateTiendaCms();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://tienda.test/api/cms/revalidate');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sec-abc');
    expect(JSON.parse(init.body as string)).toEqual({ secret: 'sec-abc' });
  });

  it('usa INTERNAL_API_SECRET si no hay CMS_REVALIDATE_SECRET', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    delete process.env.CMS_REVALIDATE_SECRET;
    process.env.INTERNAL_API_SECRET = 'internal-1';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await revalidateTiendaCms();

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)['x-revalidate-secret']).toBe('internal-1');
  });

  it('no lanza si fetch falla', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await expect(revalidateTiendaCms()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
