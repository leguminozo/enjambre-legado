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

  it('no llama fetch si falta URL de tienda y devuelve ok:false', async () => {
    delete process.env.NEXT_PUBLIC_URL_TIENDA;
    delete process.env.NEXT_PUBLIC_TIENDA_URL;
    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    const result = await revalidateTiendaCms();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'missing_url' });
  });

  it('POST a /api/cms/revalidate con Bearer secret y ok:true', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test/';
    process.env.CMS_REVALIDATE_SECRET = 'sec-abc';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    const result = await revalidateTiendaCms();

    expect(result).toEqual({ ok: true, status: 200 });
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

  it('no lanza si fetch falla; ok:false network', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await expect(revalidateTiendaCms()).resolves.toEqual({ ok: false, reason: 'network' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('http no-OK → ok:false con status', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    process.env.CMS_REVALIDATE_SECRET = 'sec';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { revalidateTiendaCms } = await import('./revalidate-tienda');
    await expect(revalidateTiendaCms()).resolves.toEqual({
      ok: false,
      reason: 'http_error',
      status: 401,
    });
    warn.mockRestore();
  });
});

describe('revalidateTiendaLayout', () => {
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

  it('no llama fetch si falta URL de tienda y devuelve ok:false', async () => {
    delete process.env.NEXT_PUBLIC_URL_TIENDA;
    delete process.env.NEXT_PUBLIC_TIENDA_URL;
    const { revalidateTiendaLayout } = await import('./revalidate-tienda');
    const result = await revalidateTiendaLayout();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'missing_url' });
  });

  it('no llama fetch sin SUPABASE_SERVICE_ROLE_KEY y devuelve ok:false', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { revalidateTiendaLayout } = await import('./revalidate-tienda');
    const result = await revalidateTiendaLayout();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'missing_secret' });
  });

  it('POST /api/revalidate con Bearer service role y body layout', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test/';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc-key';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });

    const { revalidateTiendaLayout } = await import('./revalidate-tienda');
    const result = await revalidateTiendaLayout();

    expect(result).toEqual({ ok: true, status: 200 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://tienda.test/api/revalidate');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer svc-key');
    expect(JSON.parse(init.body as string)).toEqual({ path: '/', type: 'layout' });
  });

  it('no lanza si fetch falla; ok:false network', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc-key';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { revalidateTiendaLayout } = await import('./revalidate-tienda');
    await expect(revalidateTiendaLayout()).resolves.toEqual({ ok: false, reason: 'network' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('http no-OK → ok:false con status', async () => {
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc-key';
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { revalidateTiendaLayout } = await import('./revalidate-tienda');
    await expect(revalidateTiendaLayout()).resolves.toEqual({
      ok: false,
      reason: 'http_error',
      status: 401,
    });
    warn.mockRestore();
  });
});
