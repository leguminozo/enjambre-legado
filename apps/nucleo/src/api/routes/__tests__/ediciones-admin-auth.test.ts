import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app';
import { cleanupRateLimitMap } from '@/api/lib/rate-limit';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

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

function makeChain(finalValue: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.gt = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.limit = vi.fn(ret);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  chain.then = (onfulfilled: (v: typeof finalValue) => unknown) =>
    Promise.resolve(finalValue).then(onfulfilled);
  return chain;
}

const EDICION = {
  id: 'ed-11111111-1111-4111-8111-111111111111',
  nombre: 'Ulmo temprano',
  activa: true,
};

describe('ediciones admin auth (regresión: sin authMiddleware el rol quedaba vacío y daba 403)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    cleanupRateLimitMap();
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: 0, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain({ data: { role: 'admin' }, error: null });
      if (table === 'ediciones_limitadas') return makeChain({ data: [EDICION], error: null });
      if (table === 'pre_orders') return makeChain({ data: null, error: null, count: 0 });
      return makeChain({ data: null, error: null });
    });
  });

  it('admin autenticado lista ediciones (antes: 403 por contexto vacío)', async () => {
    const res = await app.request('/api/ediciones', {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].cupo_usado).toBe(0);
    expect(json.data[0].reservas).toBe(0);
  });

  it('sin token → 401 (la ruta admin no es pública)', async () => {
    const res = await app.request('/api/ediciones');
    expect(res.status).toBe(401);
  });

  it('la vitrina /activas sigue pública sin token', async () => {
    const res = await app.request('/api/ediciones/activas');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });
});
