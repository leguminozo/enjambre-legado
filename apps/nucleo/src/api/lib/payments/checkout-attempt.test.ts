import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  updateValues: null as unknown,
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: state.maybeSingle }),
      }),
      update: (values: unknown) => ({
        eq: () => {
          state.updateValues = values;
          return Promise.resolve({ error: null });
        },
      }),
    }),
  }),
}));

import {
  CHECKOUT_ATTEMPT_REPLAY_WINDOW_MS,
  detachCheckoutAttemptKey,
  lookupCheckoutAttempt,
} from './types';

const BUY_ORDER = 'ORD-11111111-1111-4111-8111-111111111111';

function row(overrides: Record<string, unknown> = {}) {
  return {
    buy_order: BUY_ORDER,
    session_id: 'sess-1',
    provider: 'transbank',
    total: 15900,
    subtotal: 10000,
    shipping_cost: 5900,
    discount_clp: 0,
    discount_code: null,
    loyalty_points_redeemed: 0,
    loyalty_discount_clp: 0,
    status: 'pending',
    created_at: new Date().toISOString(),
    cliente_id: 'user-1',
    buyer_mode: 'legado',
    psp_url: 'https://webpay.cl/pay',
    psp_token: 'tok-123',
    ...overrides,
  };
}

describe('lookupCheckoutAttempt (idempotencia de init)', () => {
  beforeEach(() => {
    state.maybeSingle.mockReset();
    state.updateValues = null;
  });

  it('sesión pending fresca con PSP y mismo comprador → replay', async () => {
    state.maybeSingle.mockResolvedValue({ data: row(), error: null });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result.kind).toBe('replay');
    if (result.kind !== 'replay') return;
    expect(result.replay.buyOrder).toBe(BUY_ORDER);
    expect(result.replay.url).toBe('https://webpay.cl/pay');
    expect(result.replay.token).toBe('tok-123');
    expect(result.replay.total).toBe(15900);
  });

  it('invitado retomando sesión de invitado → replay', async () => {
    state.maybeSingle.mockResolvedValue({ data: row({ cliente_id: null }), error: null });

    const result = await lookupCheckoutAttempt('attempt-key-2', null);

    expect(result.kind).toBe('replay');
  });

  it('clave de otro comprador → conflict', async () => {
    state.maybeSingle.mockResolvedValue({ data: row({ cliente_id: 'otro-user' }), error: null });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result.kind).toBe('conflict');
  });

  it('sesión fuera de la ventana de reanudación → stale', async () => {
    const old = new Date(Date.now() - CHECKOUT_ATTEMPT_REPLAY_WINDOW_MS - 60_000).toISOString();
    state.maybeSingle.mockResolvedValue({ data: row({ created_at: old }), error: null });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result).toEqual({ kind: 'stale', buyOrder: BUY_ORDER });
  });

  it('sesión completada → stale (no reanuda pagos ya cerrados)', async () => {
    state.maybeSingle.mockResolvedValue({ data: row({ status: 'completed' }), error: null });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result.kind).toBe('stale');
  });

  it('sin redirección PSP almacenada → stale', async () => {
    state.maybeSingle.mockResolvedValue({
      data: row({ psp_url: null, psp_token: null }),
      error: null,
    });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result.kind).toBe('stale');
  });

  it('sin fila → none', async () => {
    state.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await lookupCheckoutAttempt('attempt-key-1', 'user-1');

    expect(result.kind).toBe('none');
  });

  it('detach libera la clave de la sesión vencida', async () => {
    await detachCheckoutAttemptKey('ORD-vieja');

    expect(state.updateValues).toEqual({ attempt_key: null });
  });
});
