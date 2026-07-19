import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const updateEq = vi.fn().mockResolvedValue({ error: null });
const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: updateEq })) }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc,
    from: vi.fn((table: string) => {
      if (table === 'checkout_sessions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ buy_order: 'ORD-1' }, { buy_order: 'ORD-2' }],
            error: null,
          }),
          update,
        };
      }
      return {};
    }),
  }),
}));

describe('expireStaleCheckoutSessions', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-at-least-32chars!!';
    rpc.mockResolvedValue({ data: null, error: null });
  });

  it('releases holds and marks pending sessions expired', async () => {
    const { expireStaleCheckoutSessions } = await import('./types');
    const result = await expireStaleCheckoutSessions({ olderThanMinutes: 30 });
    expect(result.expired).toBe(2);
    expect(result.buyOrders).toEqual(['ORD-1', 'ORD-2']);
    expect(rpc).toHaveBeenCalledWith('release_expired_stock_holds');
    expect(rpc).toHaveBeenCalledWith('release_checkout_stock', { p_buy_order: 'ORD-1' });
    expect(rpc).toHaveBeenCalledWith('release_checkout_stock', { p_buy_order: 'ORD-2' });
  });
});
