import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  row: { value: null as unknown },
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: mocks.insert,
      update: () => ({ eq: async () => ({ error: null }) }),
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mocks.row.value, error: null }),
        }),
      }),
    }),
  }),
}));

import { getCheckoutSessionByBuyOrder, saveCheckoutSession } from './types';

function makeSession() {
  return {
    buyOrder: 'ORD-1',
    sessionId: 'sess-1',
    provider: 'flow' as const,
    cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
    total: 10000,
    shipping: null,
    billing: {
      tipoDte: 'factura' as const,
      rut: '76.123.456-7',
      razonSocial: 'Empresa Test SpA',
      giro: 'Comercio',
      direccion: 'Calle 1',
    },
    courierCode: 'blueexpress',
    shippingCost: 0,
    subtotal: 10000,
    loyaltyPointsRedeemed: 0,
    loyaltyDiscountClp: 0,
    createdAt: Date.now(),
    retornoFrascosDeclarados: 3,
  };
}

describe('checkout session persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockResolvedValue({ error: null });
  });

  it('persiste billing y frascos declarados en el mismo insert de la sesión', async () => {
    await saveCheckoutSession(makeSession());

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        buy_order: 'ORD-1',
        billing: expect.objectContaining({
          tipoDte: 'factura',
          rut: '76.123.456-7',
        }),
        retorno_frascos_declarados: 3,
      }),
    );
  });

  it('rehidrata billing y frascos desde Postgres', async () => {
    mocks.row.value = {
      id: 'row-1',
      buy_order: 'ORD-1',
      session_id: 'sess-1',
      provider: 'flow',
      cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
      total: 10000,
      shipping: null,
      billing: {
        tipoDte: 'factura',
        rut: '76.123.456-7',
        razonSocial: 'Empresa Test SpA',
      },
      retorno_frascos_declarados: 3,
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    const session = await getCheckoutSessionByBuyOrder('ORD-1');

    expect(session).toMatchObject({
      buyOrder: 'ORD-1',
      status: 'completed',
      retornoFrascosDeclarados: 3,
      billing: { tipoDte: 'factura', rut: '76.123.456-7' },
    });
  });
});
