import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
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
                user: { id: 'user-res-1', email: 'admin@test.com', user_metadata: {} },
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

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaLayout: vi.fn().mockResolvedValue({ ok: true }),
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
};

describe('PATCH /api/resenas/:id/moderar (roles consolidados)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      return makeChain({ data: [], error: null });
    });
  });

  it('permite moderar a un perfil consolidado role=admin (era 403 pre-fix)', async () => {
    const res = await app.request('/api/resenas/resena-1/moderar', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ estado: 'aprobada' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('moderar_resena_producto', {
      p_resena_id: 'resena-1',
      p_estado: 'aprobada',
      p_moderator_id: 'user-res-1',
    });
  });

  it('rechaza 403 a perfil sin rol admin', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return makeChain({ data: { role: 'cliente' }, error: null });
      }
      return makeChain({ data: [], error: null });
    });

    const res = await app.request('/api/resenas/resena-1/moderar', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ estado: 'aprobada' }),
    });

    expect(res.status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
