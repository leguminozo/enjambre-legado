import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-1', email: 'g@example.com', user_metadata: {} } },
        error: null,
      }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn(),
  }),
}));

describe('GET /api/resenas', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns empty list when no reviews', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'resenas_producto') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  range: async () => ({ data: [], error: null, count: 0 }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        }),
      };
    });

    const res = await app.request(
      '/api/resenas?producto_id=a2b724f8-4e12-40f4-90cc-172bf421e428',
      { method: 'GET' },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toEqual([]);
    expect(json.aggregate).toBeNull();
  });
});

describe('POST /api/resenas anonima', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('rejects unknown product', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'productos') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({}) };
    });

    const res = await app.request('/api/resenas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        origin: 'http://localhost:3001',
      },
      body: JSON.stringify({
        modo: 'anonima',
        producto_id: 'a2b724f8-4e12-40f4-90cc-172bf421e428',
        rating: 5,
        comentario_corto: 'Miel increíble del bosque',
      }),
    });

    expect(res.status).toBe(404);
  });
});