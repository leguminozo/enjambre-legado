import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from "../../app";

const mockFrom = vi.fn();

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
                  id: 'user-rep-1',
                  email: 'rep@enjambre.cl',
                  app_metadata: { role: 'rep_ventas' },
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        },
      },
      from: (...args: unknown[]) => mockFrom(...args),
      rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    } as unknown;
  },
}));

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.insert = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.update = vi.fn(ret);
  chain.delete = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.ilike = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
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

describe('Triangulación 1: Retorno de Envases de Vidrio', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    mockFrom.mockReset();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'rep_ventas' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'rep_ventas', puntos_acumulados: 100 }, error: null });
      }
      return makeChain({ data: [], error: null });
    });
  });

  it('GET /api/inventario/envases-retornables retorna lista de frascos activos', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'rep_ventas' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'rep_ventas' }, error: null });
      }
      if (table === 'inventario_items') {
        return makeChain({
          data: [
            { id: '11111111-1111-4111-8111-111111111111', nombre: 'Frasco Hexagonal 500g', stock: 80, unidad: 'unidad' },
            { id: '22222222-2222-4222-8222-222222222222', nombre: 'Frasco 1kg', stock: 40, unidad: 'unidad' },
          ],
          error: null,
        });
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request('/api/inventario/envases-retornables', {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].nombre).toBe('Frasco Hexagonal 500g');
  });

  it('POST /api/inventario/retorno-envase incrementa stock y acredita saldo en wallet del cliente', async () => {
    const envaseId = '11111111-1111-4111-8111-111111111111';
    const clienteId = '33333333-3333-4333-8333-333333333333';
    let updatedStock: number | null = null;
    let updatedPuntos: number | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'rep_ventas' }], error: null });
      }
      if (table === 'inventario_items') {
        const chain = makeChain({
          data: { id: envaseId, nombre: 'Frasco Hexagonal 500g', stock: 20 },
          error: null,
        });
        chain.update = vi.fn().mockImplementation((payload: { stock: number }) => {
          updatedStock = payload.stock;
          return chain;
        });
        return chain;
      }
      if (table === 'profiles') {
        return makeChain({
          data: { id: clienteId, email: 'cliente@test.com' },
          error: null,
        });
      }
      if (table === 'puntos_fidelizacion') {
        const chain = makeChain({
          data: { user_id: clienteId, puntos: 1000 },
          error: null,
        });
        chain.upsert = vi.fn().mockImplementation((payload: { puntos: number }) => {
          updatedPuntos = payload.puntos;
          return chain;
        });
        return chain;
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request('/api/inventario/retorno-envase', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        envase_item_id: envaseId,
        cantidad: 3,
        cliente_id: clienteId,
        valor_puntos_unitario: 500,
        notas: 'Feria Dalcahue',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.cantidad).toBe(3);
    expect(body.data.puntos_acreditados).toBe(1500); // 3 * 500
    expect(updatedStock).toBe(23); // 20 anterior + 3 devueltos
    expect(updatedPuntos).toBe(2500); // 1000 anterior + 1500 acreditados
  });

  it('POST /api/inventario/retorno-envase acredita bono por hito de 10 frascos y actualiza venta vinculada', async () => {
    const envaseId = '11111111-1111-4111-8111-111111111111';
    const clienteId = '33333333-3333-4333-8333-333333333333';
    const ventaId = '44444444-4444-4444-8444-444444444444';
    let updatedVentaEstado: string | null = null;
    let updatedPuntos: number | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'rep_ventas' }], error: null });
      }
      if (table === 'inventario_items') {
        return makeChain({
          data: { id: envaseId, nombre: 'Frasco Hexagonal 500g', stock: 10 },
          error: null,
        });
      }
      if (table === 'profiles') {
        return makeChain({
          data: { id: clienteId, email: 'cliente@test.com' },
          error: null,
        });
      }
      if (table === 'puntos_fidelizacion') {
        const chain = makeChain({
          data: { user_id: clienteId, puntos: 0 },
          error: null,
        });
        chain.upsert = vi.fn().mockImplementation((payload: { puntos: number }) => {
          updatedPuntos = payload.puntos;
          return chain;
        });
        return chain;
      }
      if (table === 'ventas') {
        const chain = makeChain({ data: { id: ventaId }, error: null });
        chain.update = vi.fn().mockImplementation((payload: { retorno_frascos_estado: string }) => {
          updatedVentaEstado = payload.retorno_frascos_estado;
          return chain;
        });
        return chain;
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request('/api/inventario/retorno-envase', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        envase_item_id: envaseId,
        cantidad: 10,
        cliente_id: clienteId,
        venta_id: ventaId,
        canal: 'web',
        condiciones_conforme: true,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.cantidad).toBe(10);
    // 10 * 500 = 5000 base + 1500 bono = 6500 puntos
    expect(body.data.puntos_acreditados).toBe(6500);
    expect(updatedPuntos).toBe(6500);
    expect(updatedVentaEstado).toBe('recibido_conforme');
  });
});
