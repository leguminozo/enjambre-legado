import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const updateEq = vi.fn().mockResolvedValue({ error: null });
const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: updateEq })) }));
const ventasIn = vi.fn();

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
            data: [{ buy_order: 'ORD-1' }, { buy_order: 'ORD-2' }, { buy_order: 'ORD-PAID' }],
            error: null,
          }),
          update,
        };
      }
      if (table === 'ventas') {
        return {
          select: vi.fn().mockReturnThis(),
          in: ventasIn,
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
    ventasIn.mockResolvedValue({
      data: [{ buy_order: 'ORD-PAID' }],
      error: null,
    });
  });

  it('expires abandoned pending and heals paid-but-pending', async () => {
    const { expireStaleCheckoutSessions } = await import('./types');
    const result = await expireStaleCheckoutSessions({ olderThanMinutes: 30 });
    expect(result.expired).toBe(2);
    expect(result.buyOrders).toEqual(['ORD-1', 'ORD-2']);
    expect(result.skippedPaid).toEqual(['ORD-PAID']);
    expect(rpc).toHaveBeenCalledWith('release_expired_stock_holds');
    expect(rpc).toHaveBeenCalledWith('release_checkout_stock', { p_buy_order: 'ORD-1' });
    expect(rpc).toHaveBeenCalledWith('release_checkout_stock', { p_buy_order: 'ORD-PAID' });
  });
});
