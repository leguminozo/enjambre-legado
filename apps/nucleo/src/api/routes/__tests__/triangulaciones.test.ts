import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
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

describe('Triangulaciones Operativas (API)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockRevalidate.mockClear();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      return makeChain({ data: [], error: null });
    });
  });

  describe('Triangulación 1: Empaques Sugeridos y Envasado', () => {
    it('GET /api/produccion/lotes/empaques-sugeridos retorna insumos vinculados', async () => {
      const prodId = '11111111-1111-4111-8111-111111111111';
      mockFrom.mockImplementation((table: string) => {
        if (table === 'usuarios_empresas') {
          return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
        }
        if (table === 'profiles') {
          return makeChain({ data: { role: 'admin' }, error: null });
        }
        if (table === 'productos') {
          return makeChain({
            data: { id: prodId, nombre: 'Miel de Ulmo 500g', formato: '500g', peso_neto_g: 500 },
            error: null,
          });
        }
        if (table === 'inventario_items') {
          return makeChain({
            data: [
              { id: 'item-1', nombre: 'Frasco Hexagonal 500g', clase: 'envase', stock: 150, stock_minimo: 20, unidad: 'unidad', costo_unitario: 380 },
            ],
            error: null,
          });
        }
        return makeChain({ data: [], error: null });
      });

      const res = await app.request(`/api/produccion/lotes/empaques-sugeridos?producto_id=${prodId}`, {
        headers: authHeaders,
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].nombre).toBe('Frasco Hexagonal 500g');
    });

    it('POST /api/produccion/lotes/:id/envasar descuenta lote y aplica movimientos a insumos de bodega', async () => {
      const loteId = '22222222-2222-4222-8222-222222222222';
      const prodId = '11111111-1111-4111-8111-111111111111';
      const itemEmpaqueId = '33333333-3333-4333-8333-333333333333';

      mockFrom.mockImplementation((table: string) => {
        if (table === 'usuarios_empresas') {
          return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
        }
        if (table === 'profiles') {
          return makeChain({ data: { role: 'admin' }, error: null });
        }
        if (table === 'lotes') {
          return makeChain({
            data: { id: loteId, kg_total: 100, nombre_lote: 'Lote Ulmo 2026', codigo: 'L-ULM-26' },
            error: null,
          });
        }
        if (table === 'productos') {
          return makeChain({
            data: { id: prodId, stock: 10, peso_neto_g: 500 },
            error: null,
          });
        }
        if (table === 'inventario_items') {
          return makeChain({
            data: [{ id: itemEmpaqueId, nombre: 'Frasco 500g', stock: 50, activo: true }],
            error: null,
          });
        }
        return makeChain({ data: [], error: null });
      });

      const res = await app.request(`/api/produccion/lotes/${loteId}/envasar`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          producto_id: prodId,
          cantidad: 20,
          insumos_descuento: [
            { item_id: itemEmpaqueId, cantidad: 20 },
          ],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.frascos_agregados).toBe(20);
      expect(body.data.kg_descontados).toBe(10);
      expect(body.data.insumos_descontados).toHaveLength(1);
      expect(mockRpc).toHaveBeenCalledWith(
        'inventario_aplicar_movimiento',
        expect.objectContaining({
          p_item_id: itemEmpaqueId,
          p_tipo: 'salida',
          p_cantidad: 20,
        })
      );
    });
  });

  describe('Triangulación 4: Alambique → Stock Catálogo', () => {
    it('POST /api/alambique/productos con ingresar_a_stock incrementa stock del SKU', async () => {
      const prodId = '11111111-1111-4111-8111-111111111111';
      const destilacionId = '44444444-4444-4444-8444-444444444444';

      let updateStockCalledWith: number | null = null;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'usuarios_empresas') {
          return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
        }
        if (table === 'profiles') {
          return makeChain({ data: { role: 'admin' }, error: null });
        }
        if (table === 'productos_destilacion') {
          return makeChain({
            data: { id: 'prod-dest-1', destilacion_id: destilacionId, unidades: 30, producto_id: prodId },
            error: null,
          });
        }
        if (table === 'productos') {
          const chain = makeChain({
            data: { id: prodId, stock: 5 },
            error: null,
          });
          chain.update = vi.fn().mockImplementation((payload: { stock: number }) => {
            updateStockCalledWith = payload.stock;
            return chain;
          });
          return chain;
        }
        return makeChain({ data: [], error: null });
      });

      const res = await app.request('/api/alambique/productos', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          destilacion_id: destilacionId,
          tipo: 'hidrolato',
          volumen_ml: 100,
          unidades: 30,
          destino: 'venta',
          producto_id: prodId,
          ingresar_a_stock: true,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.stock_actualizado).toBe(true);
      expect(updateStockCalledWith).toBe(35); // 5 stock anterior + 30 nuevas unidades
      expect(mockRevalidate).toHaveBeenCalled();
    });
  });
});
