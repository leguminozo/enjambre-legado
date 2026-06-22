import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-1', email: 'g@example.com', user_metadata: {} } },
        error: null,
      }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

describe('GET /api/wallet/stamps', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('requires auth', async () => {
    const res = await app.request('/api/wallet/stamps');
    expect(res.status).toBe(401);
  });

  it('returns snapshot for authenticated user', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { full_name: 'María', email: 'm@test.com' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_tier_view') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { tier: 'ZÁNGANO', ciclos_historicos: 120 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'puntos_fidelizacion') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { puntos: 500 }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'guardian_stamp_progress') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({}) }) };
    });

    const res = await app.request('/api/wallet/stamps', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.snapshot.displayName).toBe('María');
    expect(json.snapshot.programs).toEqual([]);
  });
});