import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDecrementStock = vi.fn();
const mockMaybeEmitBoleta = vi.fn();
const mockNotifyCheckout = vi.fn();
const mockMarkConverted = vi.fn();
const mockCompleteSession = vi.fn();

vi.mock('@/api/lib/stock/cart-stock', () => ({
  decrementCartStock: (...args: unknown[]) => mockDecrementStock(...args),
}));

vi.mock('@/lib/fiscal/checkout-dte', () => ({
  maybeEmitBoletaPostCheckout: (...args: unknown[]) => mockMaybeEmitBoleta(...args),
}));

vi.mock('@/lib/notifications/enqueue-transactional', () => ({
  notifyCheckoutConfirmed: (...args: unknown[]) => mockNotifyCheckout(...args),
}));

vi.mock('@/lib/notifications/cart-abandonment-worker', () => ({
  markCartAbandonmentConverted: (...args: unknown[]) => mockMarkConverted(...args),
}));

vi.mock('./loyalty-fulfill', () => ({
  applyCheckoutLoyalty: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('./types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./types')>();
  return {
    ...actual,
    completeCheckoutSession: (...args: unknown[]) => mockCompleteSession(...args),
  };
});

import { fulfillCheckout } from './checkout-fulfill';

function buildAdminMock() {
  const handlers: Record<string, () => unknown> = {};

  const from = vi.fn((table: string) => {
    const handler = handlers[table];
    if (!handler) throw new Error(`unexpected table ${table}`);
    return handler();
  });

  const rpc = vi.fn().mockResolvedValue({ data: { success: true }, error: null });

  return { from, rpc, handlers };
}

function makeChain(value: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'insert', 'update', 'maybeSingle', 'single']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(value);
  chain.single = vi.fn().mockResolvedValue(value);
  return chain;
}

describe('fulfillCheckout fiscal hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecrementStock.mockResolvedValue({
      ok: true,
      enrichedLines: [{
        productId: 'prod-1',
        slug: 'miel',
        name: 'Miel',
        unitPrice: 10000,
        quantity: 1,
      }],
    });
    mockMaybeEmitBoleta.mockResolvedValue({
      skipped: false,
      ok: true,
      folio: 88,
      trackId: 'track-boleta-1',
      estadoSii: 'enviado',
    });
    mockNotifyCheckout.mockResolvedValue({ skipped: false, emailQueued: true });
    mockCompleteSession.mockResolvedValue(undefined);
  });

  it('creates facturas_emitidas tipo 39 and triggers boleta emission', async () => {
    const admin = buildAdminMock();

    admin.handlers.clientes = () => makeChain({ data: { id: 'cliente-1' }, error: null });
    admin.handlers.empresas = () => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'emp-1' }, error: null }),
    });

    const ventaInsert = makeChain({ data: { id: 'venta-99' }, error: null });
    admin.handlers.ventas = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      single: ventaInsert.single,
    });

    const facturaInsert = makeChain({ data: { id: 'fe-boleta-1' }, error: null });
    admin.handlers.facturas_emitidas = () => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: facturaInsert.single,
    });

    admin.handlers.logistica_envios = () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    admin.handlers.cliente_direcciones = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'addr-1' }, error: null }),
    });

    admin.handlers.wallet_pass_registrations = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await fulfillCheckout(admin as any, {
      buyOrder: 'ORD-TEST-1',
      authorizationCode: 'AUTH1',
      paymentProvider: 'flow',
      session: {
        buyOrder: 'ORD-TEST-1',
        sessionId: 'sess-1',
        total: 11900,
        cart: [{ productId: 'prod-1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
        provider: 'flow',
        shipping: {
          nombre: 'Comprador Test',
          email: 'buyer@test.cl',
          telefono: '+56911111111',
          direccion: 'Calle 1',
          comuna: 'Providencia',
          ciudad: 'Santiago',
          region: 'Metropolitana',
        },
        buyerMode: 'legado',
        clienteId: 'user-1',
        courierCode: 'blueexpress',
        shippingCost: 0,
        subtotal: 11900,
        loyaltyPointsRedeemed: 0,
        loyaltyDiscountClp: 0,
        createdAt: Date.now(),
      },
    });

    expect(result.ok).toBe(true);
    expect(result.dte).toMatchObject({
      folio: 88,
      trackId: 'track-boleta-1',
      estadoSii: 'enviado',
    });
    expect(mockMaybeEmitBoleta).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        empresaId: 'emp-1',
        facturaEmitidaId: 'fe-boleta-1',
        ventaId: 'venta-99',
        buyOrder: 'ORD-TEST-1',
      }),
    );
  });
});