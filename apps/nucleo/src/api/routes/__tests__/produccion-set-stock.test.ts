import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();
const mockRevalidate = vi.fn().mockResolvedValue({ ok: true });

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaLayout: () => mockRevalidate(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    const authHeader = options?.global?.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return {
      auth: {
        getUser: async () => {
          if (token === 'valid-token' || token === 'admin-token') {
            return {
              data: {
                user: {
                  id: 'user-prod-1',
                  email: 'admin@test.com',
                  app_metadata: { role: 'admin' },
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        },
      },
      from: (...args: unknown[]) => mockFrom(...args),
    } as unknown;
  },
}));

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.insert = vi.fn(ret);
  chain.update = vi.fn(ret);
  chain.delete = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  // thenable for await supabase.from().select()... without single
  chain.then = (onfulfilled: (v: typeof finalValue) => unknown) =>
    Promise.resolve(finalValue).then(onfulfilled);
  return chain;
}

const authHeaders = {
  Authorization: 'Bearer valid-token',
  'Content-Type': 'application/json',
  origin: 'http://localhost:3000',
  'x-empresa-id': 'emp-1',
};

describe('POST /api/produccion/set-stock', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    mockFrom.mockReset();
    mockRevalidate.mockClear();
    mockRevalidate.mockResolvedValue({ ok: true });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'productos') {
        return makeChain({ data: { id: 'a2b724f8-4e12-40f4-90cc-172bf421e428', stock: 10 }, error: null });
      }
      return makeChain({ data: [], error: null });
    });
  });

  it('reformula stock absoluto y dispara revalidación de tienda', async () => {
    const res = await app.request('/api/produccion/set-stock', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: 'a2b724f8-4e12-40f4-90cc-172bf421e428',
        stock: 25,
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({
      producto_id: 'a2b724f8-4e12-40f4-90cc-172bf421e428',
      stock_anterior: 10,
      stock_nuevo: 25,
      mode: 'service',
    });
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('rechaza stock negativo', async () => {
    const res = await app.request('/api/produccion/set-stock', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: 'a2b724f8-4e12-40f4-90cc-172bf421e428',
        stock: -5,
      }),
    });

    expect(res.status).toBe(400);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('rechaza sin rol admin', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'cliente' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'cliente' }, error: null });
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request('/api/produccion/set-stock', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: 'a2b724f8-4e12-40f4-90cc-172bf421e428',
        stock: 25,
      }),
    });

    expect(res.status).toBe(403);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
