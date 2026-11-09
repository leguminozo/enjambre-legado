import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CheckoutSession } from './types';

const mocks = vi.hoisted(() => ({
  fulfill: vi.fn(),
  complete: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('./checkout-fulfill', () => ({
  fulfillCheckout: mocks.fulfill,
}));

vi.mock('./types', () => ({
  completeCheckoutSession: mocks.complete,
  getCheckoutSessionByBuyOrder: mocks.getSession,
}));

import { settleCheckout } from './settle-checkout';

type State = {
  ventaId: string | null;
  ventaAfterClaim?: string;
  ventaReads: number;
  claim: boolean;
  claimError: string | null;
  claims: number;
  releases: number;
};

function buildAdmin(state: State) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'ventas') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                state.ventaReads += 1;
                const id =
                  state.ventaId ??
                  (state.ventaReads > 1 ? state.ventaAfterClaim : undefined);
                return { data: id ? { id } : null, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'checkout_sessions') {
        return {
          update: (values: { fulfillment_started_at: string | null }) => {
            if (values.fulfillment_started_at === null) {
              return {
                eq: async () => {
                  state.releases += 1;
                  return { error: null };
                },
              };
            }
            const selectTerminal = () => ({
              maybeSingle: async () => {
                state.claims += 1;
                if (state.claimError) return { data: null, error: { message: state.claimError } };
                if (!state.claim) return { data: null, error: null };
                state.claim = false;
                return { data: { id: 'sess-1' }, error: null };
              },
            });
            return {
              eq: () => ({
                or: () => ({
                  select: selectTerminal,
                }),
                select: selectTerminal,
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

function makeSession(): CheckoutSession {
  return {
    buyOrder: 'ORD-1',
    sessionId: 'sess-1',
    cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
    total: 10000,
    provider: 'flow',
    shipping: null,
    courierCode: 'blueexpress',
    shippingCost: 0,
    subtotal: 10000,
    loyaltyPointsRedeemed: 0,
    loyaltyDiscountClp: 0,
    createdAt: Date.now(),
    status: 'pending',
  };
}

describe('settleCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.complete.mockResolvedValue(undefined);
    mocks.getSession.mockResolvedValue(undefined);
  });

  it('venta existente → éxito idempotente sin repetir fulfill', async () => {
    const state: State = { ventaId: 'venta-1', ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: true, ventaId: 'venta-1', alreadyProcessed: true });
    expect(mocks.fulfill).not.toHaveBeenCalled();
    expect(state.claims).toBe(0);
    expect(mocks.complete).toHaveBeenCalledWith('ORD-1', admin);
  });

  it('sin sesión ni venta → notFound', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });

  it('claim libre → llama fulfill y conserva provider de la sesión', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);
    mocks.fulfill.mockResolvedValue({ ok: true, ventaId: 'venta-1' });
    const session = makeSession();

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session,
    });

    expect(result).toMatchObject({ ok: true, ventaId: 'venta-1' });
    expect(state.claims).toBe(1);
    expect(state.releases).toBe(0);
    expect(mocks.fulfill).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        buyOrder: 'ORD-1',
        session,
        authorizationCode: 'AUTH',
        paymentProvider: 'flow',
      }),
    );
  });

  it('fulfill detecta carrera y sanea la sesión igualmente', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);
    mocks.fulfill.mockResolvedValue({
      ok: true,
      ventaId: 'venta-race',
      alreadyProcessed: true,
    });

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: true, ventaId: 'venta-race', alreadyProcessed: true });
    expect(mocks.complete).toHaveBeenCalledWith('ORD-1', admin);
    expect(state.releases).toBe(0);
  });

  it('claim ocupado y venta que aparece → éxito sin duplicar', async () => {
    const state: State = { ventaId: null, ventaAfterClaim: 'venta-2', ventaReads: 0, claim: false, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: true, ventaId: 'venta-2', alreadyProcessed: true });
    expect(state.claims).toBe(1);
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });

  it('claim ocupado sin venta → processing', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: false, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: false, processing: true });
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });

  it('fallo de claim sin venta → processing, nunca throw', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: 'db down', claims: 0, releases: 0 };
    const admin = buildAdmin(state);

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: false, processing: true });
    expect(mocks.fulfill).not.toHaveBeenCalled();
  });

  it('fulfill falla → libera claim para reintento', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);
    mocks.fulfill.mockResolvedValue({ ok: false, stockErrors: ['sin stock'] });

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH',
      session: makeSession(),
    });

    expect(result).toMatchObject({ ok: false, stockErrors: ['sin stock'] });
    expect(state.releases).toBe(1);
  });

  it('forceClaim y allowForceStock se propagan para conciliación manual de pagos confirmados', async () => {
    const state: State = { ventaId: null, ventaReads: 0, claim: true, claimError: null, claims: 0, releases: 0 };
    const admin = buildAdmin(state);
    const session = makeSession();
    mocks.fulfill.mockResolvedValue({ ok: true, ventaId: 'v-manual-reconciled' });

    const result = await settleCheckout(admin as never, {
      buyOrder: 'ORD-1',
      authorizationCode: 'AUTH_FLOW',
      session,
      forceClaim: true,
      allowForceStock: true,
    });

    expect(result).toMatchObject({ ok: true, ventaId: 'v-manual-reconciled' });
    expect(mocks.fulfill).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        buyOrder: 'ORD-1',
        session,
        authorizationCode: 'AUTH_FLOW',
        allowForceStock: true,
      }),
    );
  });
});
