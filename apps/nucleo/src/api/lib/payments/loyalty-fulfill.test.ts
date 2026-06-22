import { describe, expect, it, vi } from 'vitest';
import { applyCheckoutLoyalty } from './loyalty-fulfill';

function buildAdminMock() {
  const rpc = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === 'puntos_transacciones' || table === 'ciclos') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  rpc.mockImplementation(async (fn: string) => {
    if (fn === 'calcular_puntos_compra') {
      return { data: 50, error: null };
    }
    if (fn === 'agregar_puntos_usuario') {
      return { data: 'tx-1', error: null };
    }
    return { data: null, error: null };
  });

  return { rpc, from };
}

describe('applyCheckoutLoyalty', () => {
  it('awards points and cycles without redeem', async () => {
    const admin = buildAdminMock();

    const result = await applyCheckoutLoyalty(admin as never, {
      buyOrder: 'ORD-1',
      ventaId: 'venta-1',
      userId: 'user-1',
      empresaId: 'emp-1',
      paidTotalClp: 2500,
      pointsRedeemed: 0,
    });

    expect(result.ok).toBe(true);
    expect(admin.rpc).toHaveBeenCalledWith('calcular_puntos_compra', expect.any(Object));
    expect(admin.from).toHaveBeenCalledWith('ciclos');
  });

  it('fails when redeem rpc rejects', async () => {
    const admin = buildAdminMock();
    admin.rpc.mockImplementation(async (fn: string) => {
      if (fn === 'canjear_puntos_checkout') {
        return { data: { success: false, error: 'insufficient_points' }, error: null };
      }
      return { data: null, error: null };
    });

    const result = await applyCheckoutLoyalty(admin as never, {
      buyOrder: 'ORD-2',
      ventaId: 'venta-2',
      userId: 'user-1',
      empresaId: 'emp-1',
      paidTotalClp: 9000,
      pointsRedeemed: 100,
    });

    expect(result.ok).toBe(false);
  });
});