import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDecrementStock = vi.fn();
const mockMaybeEmitBoleta = vi.fn();
const mockMaybeEmitFactura = vi.fn();
const mockNotifyCheckout = vi.fn();
const mockMarkConverted = vi.fn();
const mockCompleteSession = vi.fn();

vi.mock('@/api/lib/stock/cart-stock', () => ({
  decrementCartStock: (...args: unknown[]) => mockDecrementStock(...args),
}));

vi.mock('@/lib/fiscal/checkout-dte', () => ({
  maybeEmitBoletaPostCheckout: (...args: unknown[]) => mockMaybeEmitBoleta(...args),
  maybeEmitFacturaPostCheckout: (...args: unknown[]) => mockMaybeEmitFactura(...args),
}));

vi.mock('@/lib/notifications/enqueue-transactional', () => ({
  notifyCheckoutConfirmed: (...args: unknown[]) => mockNotifyCheckout(...args),
  notifyReviewInvitation: vi.fn(),
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
  const handlers: Record<string, () => unknown> = {
    carrito_items: () => ({
      delete: () => ({ eq: () => ({ in: async () => ({ error: null }) }) }),
    }),
    profiles: () => ({
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  };

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
    mockMaybeEmitFactura.mockResolvedValue({
      skipped: false,
      ok: true,
      folio: 44,
      trackId: 'track-factura-1',
      estadoSii: 'enviado',
    });
    mockNotifyCheckout.mockResolvedValue({ skipped: false, emailQueued: true });
    mockCompleteSession.mockResolvedValue(undefined);
  });

  it('para pagos Flow B2C el comprobante electrónico vale como boleta (Res. Ex. SII 176/2020) y no duplica DTE 39', async () => {
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

    const facturaInsertFn = vi.fn();
    admin.handlers.facturas_emitidas = () => {
      const chain = makeChain({ data: { id: 'fe-flow-1' }, error: null });
      chain.insert = vi.fn((payload: unknown) => {
        facturaInsertFn(payload);
        return chain;
      });
      return chain;
    };

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
      buyOrder: 'ORD-FLOW-1',
      authorizationCode: '187796493',
      paymentProvider: 'flow',
      session: {
        buyOrder: 'ORD-FLOW-1',
        sessionId: 'sess-flow-1',
        total: 47080,
        cart: [{ productId: 'prod-1', slug: 'miel', name: 'Miel de Ulmo', unitPrice: 47080, quantity: 1 }],
        provider: 'flow',
        shipping: {
          nombre: 'Mara Angelini',
          email: 'mara.angelini@gmail.com',
          telefono: '+56911111111',
          direccion: 'Calle 1',
          comuna: 'Providencia',
          ciudad: 'Santiago',
          region: 'Metropolitana',
        },
        buyerMode: 'legado',
        clienteId: 'user-1',
        courierCode: 'chilexpress',
        shippingCost: 0,
        subtotal: 47080,
        loyaltyPointsRedeemed: 0,
        loyaltyDiscountClp: 0,
        createdAt: Date.now(),
      },
    });

    expect(result.ok).toBe(true);
    expect(result.dte).toEqual({
      skipped: true,
      estadoSii: 'aceptado',
    });
    // NO debe llamar a emitir boleta DTE 39 al SII para no duplicar IVA
    expect(mockMaybeEmitBoleta).not.toHaveBeenCalled();
    expect(facturaInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        numero: 'FLOW-ORD-FLOW-1',
        estado: 'pagada',
        estado_sii: 'aceptado',
        tipo_dte: 39,
      }),
    );
  });

  it('triggers boleta emission para proveedores sin comprobante fiscal electrónico integrado', async () => {
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

    admin.handlers.facturas_emitidas = () =>
      makeChain({ data: { id: 'fe-boleta-1' }, error: null });

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
      paymentProvider: 'manual',
      session: {
        buyOrder: 'ORD-TEST-1',
        sessionId: 'sess-1',
        total: 11900,
        cart: [{ productId: 'prod-1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
        provider: 'transbank',
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

  it('emite factura cuando la sesión persiste billing y enlaza venta_id', async () => {
    const admin = buildAdminMock();

    admin.handlers.clientes = () => makeChain({ data: { id: 'cliente-1' }, error: null });
    admin.handlers.empresas = () => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'emp-1' }, error: null }),
    });
    admin.handlers.terceros = () =>
      makeChain({ data: { id: 'tercero-1' }, error: null });

    const ventaInsert = makeChain({ data: { id: 'venta-fact-1' }, error: null });
    admin.handlers.ventas = () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnThis(),
      single: ventaInsert.single,
    });

    const facturaPayload = vi.fn();
    admin.handlers.facturas_emitidas = () => {
      const chain = makeChain({ data: { id: 'fe-factura-1' }, error: null });
      chain.insert = vi.fn((payload: unknown) => {
        facturaPayload(payload);
        return chain;
      });
      return chain;
    };

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
      buyOrder: 'ORD-FACT-1',
      authorizationCode: 'AUTH-FACT',
      paymentProvider: 'flow',
      session: {
        buyOrder: 'ORD-FACT-1',
        sessionId: 'sess-fact',
        total: 11900,
        cart: [{ productId: 'prod-1', slug: 'miel', name: 'Miel', unitPrice: 11900, quantity: 1 }],
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
        billing: {
          tipoDte: 'factura',
          rut: '76.123.456-7',
          razonSocial: 'Empresa Test SpA',
          giro: 'Comercio',
          direccion: 'Calle 1',
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
    expect(result.dte).toMatchObject({ folio: 44, estadoSii: 'enviado' });
    expect(facturaPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        venta_id: 'venta-fact-1',
        tipo_dte: 33,
        numero: 'FWEB-ORD-FACT-1',
      }),
    );
    expect(mockMaybeEmitFactura).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        empresaId: 'emp-1',
        facturaEmitidaId: 'fe-factura-1',
        ventaId: 'venta-fact-1',
        terceroRut: '76.123.456-7',
      }),
    );
  });

  it('recupera de forma idempotente con alreadyProcessed cuando el insert choca con carrera 23505', async () => {
    const admin = buildAdminMock();

    let queryCount = 0;
    admin.handlers.ventas = () => {
      queryCount++;
      // Primer check: no existe todavía (carrera simulada)
      if (queryCount === 1) {
        return makeChain({ data: null, error: null });
      }
      // Intento de insert: falla con código 23505 (unique_violation)
      if (queryCount === 2) {
        const chain = makeChain({ data: null, error: null });
        chain.single = vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "idx_ventas_buy_order_unique"' },
        });
        return chain;
      }
      // Reconsulta post-carrera: encuentra la venta insertada por el proceso ganador
      return makeChain({ data: { id: 'venta-race-winner' }, error: null });
    };

    admin.handlers.clientes = () => makeChain({ data: { id: 'cli-1' }, error: null });

    mockDecrementStock.mockResolvedValueOnce({
      ok: true,
      enrichedLines: [{ productId: 'prod-1', name: 'Miel', quantity: 1 }],
      errors: [],
    });

    const result = await fulfillCheckout(admin as any, {
      buyOrder: 'ORD-RACE-1',
      authorizationCode: 'AUTH_RACE',
      paymentProvider: 'transbank',
      session: {
        buyOrder: 'ORD-RACE-1',
        sessionId: 'sess-race',
        total: 15000,
        cart: [{ productId: 'prod-1', slug: 'miel', name: 'Miel', unitPrice: 15000, quantity: 1 }],
        provider: 'transbank',
        shipping: {
          nombre: 'Comprador Carrera',
          email: 'race@test.cl',
          telefono: '+56911111111',
          direccion: 'Calle 2',
          comuna: 'Castro',
          ciudad: 'Castro',
          region: 'Los Lagos',
        },
        buyerMode: 'legado',
        clienteId: 'user-1',
        courierCode: 'blueexpress',
        shippingCost: 0,
        subtotal: 15000,
        loyaltyPointsRedeemed: 0,
        loyaltyDiscountClp: 0,
        createdAt: Date.now(),
      },
    });

    expect(result.ok).toBe(true);
    expect(result.alreadyProcessed).toBe(true);
    expect(result.ventaId).toBe('venta-race-winner');
  });
});