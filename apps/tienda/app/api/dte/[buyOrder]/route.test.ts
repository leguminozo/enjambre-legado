import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { state, mockLimit, mockGetUser, fromMock } = vi.hoisted(() => {
  const state = {
    venta: { data: { id: 'venta-1', user_id: 'user-1' } as unknown, error: null as unknown },
    facturas: [] as Array<{ data: unknown; error: unknown }>,
  };

  const fromMock = vi.fn((table: string) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () => {
      if (table === 'ventas') return state.venta;
      return state.facturas.shift() ?? { data: null, error: null };
    });
    return chain;
  });

  return {
    state,
    fromMock,
    mockLimit: vi.fn(() => ({ success: true, remaining: 1, resetTime: Date.now() + 60_000 })),
    mockGetUser: vi.fn(
      async (): Promise<{ data: { user: { id: string } | null } }> => ({
        data: { user: null },
      }),
    ),
  };
});

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser } }),
}));

vi.mock('@/lib/ratelimit', () => ({
  createRateLimiter: () => mockLimit,
  getClientIdentifier: () => 'ip-test',
}));

import { GET } from './route';

const TOKEN = '11111111-1111-4111-8111-111111111111';
const URL = 'http://localhost:3001/api/dte/ORD-1';

function factura(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      sii_xml: '<DTE><Documento/></DTE>',
      download_token: TOKEN,
      download_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      estado_sii: 'enviado',
      ...overrides,
    },
    error: null,
  };
}

function call(url = URL, buyOrder = 'ORD-1') {
  return GET(new NextRequest(url), { params: Promise.resolve({ buyOrder }) });
}

describe('GET /api/dte/[buyOrder]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.venta = { data: { id: 'venta-1', user_id: 'user-1' }, error: null };
    state.facturas = [];
    mockLimit.mockReturnValue({ success: true, remaining: 1, resetTime: Date.now() + 60_000 });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('descarga el XML con un enlace de acceso válido', async () => {
    state.facturas = [factura()];

    const res = await call(`${URL}?token=${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    expect(res.headers.get('content-disposition')).toContain('documento-ORD-1.xml');
    expect(await res.text()).toContain('<DTE>');
  });

  it('permite al dueño autenticado descargar sin token', async () => {
    state.facturas = [factura()];
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const res = await call();

    expect(res.status).toBe(200);
  });

  it('exige sesión o token cuando el pedido no es propio', async () => {
    state.facturas = [factura()];
    mockGetUser.mockResolvedValue({ data: { user: { id: 'other' } } });

    expect((await call()).status).toBe(403);
    state.facturas = [factura()];
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect((await call()).status).toBe(401);
  });

  it('rechaza un enlace expirado', async () => {
    state.facturas = [
      factura({ download_token_expires_at: new Date(Date.now() - 1000).toISOString() }),
    ];

    const res = await call(`${URL}?token=${TOKEN}`);

    expect(res.status).toBe(410);
  });

  it('responde 409 si el XML aún no está disponible', async () => {
    state.facturas = [factura({ sii_xml: null, estado_sii: 'pendiente' })];
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const res = await call();

    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('xml_pending');
  });

  it('cae al idempotency_key legado cuando falta venta_id', async () => {
    state.facturas = [{ data: null, error: null }, factura()];

    const res = await call(`${URL}?token=${TOKEN}`);

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it('valida el código de pedido y el rate limit', async () => {
    expect((await call(URL, ' bad')).status).toBe(400);

    mockLimit.mockReturnValue({ success: false, remaining: 0, resetTime: Date.now() + 1000 });
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });
});
