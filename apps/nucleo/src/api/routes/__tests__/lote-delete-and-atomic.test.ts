import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '@/api/app';

const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockRevalidate = vi.fn().mockResolvedValue({ ok: true });

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaLayout: () => mockRevalidate(),
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    const authHeader = options?.global?.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return {
      auth: {
        getUser: async () => {
          if (token === 'admin-token') {
            return {
              data: {
                user: {
                  id: 'user-admin-1',
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
      rpc: (...args: unknown[]) => mockRpc(...args),
    } as unknown;
  },
}));

function makeChain(finalValue: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.insert = vi.fn(ret);
  chain.update = vi.fn(ret);
  chain.delete = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.in = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  chain.then = (onfulfilled: (v: typeof finalValue) => unknown) =>
    Promise.resolve(finalValue).then(onfulfilled);
  return chain;
}

const authHeaders = {
  Authorization: 'Bearer admin-token',
  'Content-Type': 'application/json',
  origin: 'http://localhost:3000',
  'x-empresa-id': 'emp-1',
};

describe('DELETE /api/produccion/lotes/:id — Trazabilidad y Borrado Seguro', () => {
  const loteId = '11111111-1111-4111-a111-111111111111';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    vi.clearAllMocks();
  });

  it('rechaza con 400 si el lote ya fue envasado a frascos', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: {
            id: loteId,
            nombre_lote: 'Lote Envasado',
            fecha_envasado: '2026-10-10T12:00:00Z',
            blockchain_hash: null,
            kg_total: 10,
          },
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request(`/api/produccion/lotes/${loteId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { code: string; message: string };
    expect(json.code).toBe('lote_envasado');
  });

  it('rechaza con 400 si el lote tiene certificación blockchain', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: {
            id: loteId,
            nombre_lote: 'Lote Certificado',
            fecha_envasado: null,
            blockchain_hash: '0xabc123...',
            kg_total: 10,
          },
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request(`/api/produccion/lotes/${loteId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { code: string; message: string };
    expect(json.code).toBe('lote_blockchain');
  });

  it('elimina correctamente un lote huérfano o virgen con 200', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: {
            id: loteId,
            nombre_lote: 'Recolección 2026-10-04 · jeje',
            fecha_envasado: null,
            blockchain_hash: null,
            kg_total: 6,
          },
          error: null,
        });
      }
      if (table === 'productos') {
        return makeChain({ count: 0, data: null, error: null });
      }
      if (table === 'cosechas') {
        return makeChain({ data: null, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request(`/api/produccion/lotes/${loteId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });
});

describe('POST /api/produccion/cosechas — Atomicidad lote + recolección', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    vi.clearAllMocks();
  });

  it('crea lote y recolección de forma atómica cuando lote_mode === "nuevo"', async () => {
    const generatedLoteId = '99999999-9999-4999-a999-999999999999';
    const generatedCosechaId = '88888888-8888-4888-a888-888888888888';

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: {
            id: generatedLoteId,
            nombre_lote: 'Recolección 2026-10-16 · Ulmo',
            kg_total: 25,
            variedad_floral: 'Ulmo',
          },
          error: null,
        });
      }
      if (table === 'cosechas') {
        return makeChain({
          data: {
            id: generatedCosechaId,
            lote_id: generatedLoteId,
          },
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/produccion/cosechas', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kg: 25,
        fecha: '2026-10-16',
        floracion: 'Ulmo',
        lote_mode: 'nuevo',
        nuevo_lote: {
          nombre_lote: 'Recolección 2026-10-16 · Ulmo',
          variedad_floral: 'Ulmo',
        },
      }),
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { id: string; lote_id: string }; lote_id: string };
    expect(json.lote_id).toBe(generatedLoteId);
    expect(json.data.lote_id).toBe(generatedLoteId);
  });
});

