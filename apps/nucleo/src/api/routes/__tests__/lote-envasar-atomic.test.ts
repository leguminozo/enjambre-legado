import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

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

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
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

describe('POST /api/produccion/lotes/:id/envasar — atomicidad', () => {
  const loteId = '11111111-1111-4111-a111-111111111111';
  const productoId = '22222222-2222-4222-a222-222222222222';
  const insumoId = '33333333-3333-4333-a333-333333333333';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    vi.clearAllMocks();
  });

  it('rechaza con 400 y no muta producto/lote si un insumo tiene stock insuficiente', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: { id: loteId, kg_total: 100, nombre_lote: 'Lote Ulmo 2026', codigo: 'LOT-01' },
          error: null,
        });
      }
      if (table === 'productos') {
        return makeChain({
          data: { id: productoId, stock: 10, peso_neto_g: 500, lote_id: null },
          error: null,
        });
      }
      if (table === 'inventario_items') {
        return makeChain({
          data: [{ id: insumoId, nombre: 'Frasco hexagonal 500g', stock: 5, activo: true }],
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request(`/api/produccion/lotes/${loteId}/envasar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: productoId,
        cantidad: 20, // Requiere 20 frascos, pero solo hay 5
        insumos_descuento: [{ item_id: insumoId, cantidad: 20 }],
      }),
    });

    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.code).toBe('insumo_stock_insuficiente');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('procesa correctamente con 201 cuando hay stock suficiente de insumos', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: { id: loteId, kg_total: 100, nombre_lote: 'Lote Ulmo 2026', codigo: 'LOT-01' },
          error: null,
        });
      }
      if (table === 'productos') {
        return makeChain({
          data: { id: productoId, stock: 10, peso_neto_g: 500, lote_id: null },
          error: null,
        });
      }
      if (table === 'inventario_items') {
        return makeChain({
          data: [{ id: insumoId, nombre: 'Frasco hexagonal 500g', stock: 100, activo: true }],
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    mockRpc.mockResolvedValue({ data: { ok: true }, error: null });

    const res = await app.request(`/api/produccion/lotes/${loteId}/envasar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: productoId,
        cantidad: 10,
        insumos_descuento: [{ item_id: insumoId, cantidad: 10 }],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.frascos_agregados).toBe(10);
    expect(body.data.kg_descontados).toBe(5);
    expect(mockRpc).toHaveBeenCalledWith('inventario_aplicar_movimiento', expect.objectContaining({
      p_item_id: insumoId,
      p_tipo: 'salida',
      p_cantidad: 10,
    }));
  });

  it('si falla la RPC de descuento de insumos, ejecuta rollback y responde 400', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'lotes') {
        return makeChain({
          data: { id: loteId, kg_total: 100, nombre_lote: 'Lote Ulmo 2026', codigo: 'LOT-01' },
          error: null,
        });
      }
      if (table === 'productos') {
        return makeChain({
          data: { id: productoId, stock: 10, peso_neto_g: 500, lote_id: null },
          error: null,
        });
      }
      if (table === 'inventario_items') {
        return makeChain({
          data: [{ id: insumoId, nombre: 'Frasco hexagonal 500g', stock: 100, activo: true }],
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB deadlock or lock timeout' } });

    const res = await app.request(`/api/produccion/lotes/${loteId}/envasar`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        producto_id: productoId,
        cantidad: 10,
        insumos_descuento: [{ item_id: insumoId, cantidad: 10 }],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('insumo_descuento_failed');
  });
});
