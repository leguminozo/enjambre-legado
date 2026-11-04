import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from "../../app";

const mockFrom = vi.fn();

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaLayout: vi.fn().mockResolvedValue({ ok: true }),
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

describe('PATCH /api/inventario/items/:id', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    mockFrom.mockReset();
  });

  it('no inyecta stock: 0 ni sobreescribe existencias al editar campos como costo o stock_minimo', async () => {
    let capturedUpdatePayload: Record<string, unknown> | null = null;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'inventario_items') {
        const chain = makeChain({
          data: {
            id: 'item-123',
            nombre: 'Bolsas Kraft',
            stock: 2000,
            stock_minimo: 100,
            costo_unitario: 123,
          },
          error: null,
        });

        chain.update = vi.fn((payload: Record<string, unknown>) => {
          capturedUpdatePayload = payload;
          return chain;
        });

        return chain;
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/inventario/items/item-123', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        nombre: 'Bolsas Kraft con Manilla XS ~ (21cm alto x 15cm ancho x 8cm fuelle)',
        stock_minimo: 100,
        costo_unitario: 123,
        proveedor_nota: 'Imprenta Austral',
      }),
    });

    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).not.toBeNull();
    // Invariante crítico: stock NUNCA debe estar en el payload de actualización si no fue enviado
    expect(capturedUpdatePayload).not.toHaveProperty('stock');
    expect(capturedUpdatePayload).toEqual({
      nombre: 'Bolsas Kraft con Manilla XS ~ (21cm alto x 15cm ancho x 8cm fuelle)',
      stock_minimo: 100,
      costo_unitario: 123,
      proveedor_nota: 'Imprenta Austral',
      sku_code: undefined,
      notas: undefined,
    });
  });
});
