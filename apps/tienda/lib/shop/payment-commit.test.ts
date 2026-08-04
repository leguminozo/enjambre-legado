import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  commitPayment,
  parsePaymentCommitResponse,
  parsePendingPayment,
} from './payment-commit';

describe('payment-commit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parsea pending payment desde sessionStorage', () => {
    expect(parsePendingPayment(null)).toBeNull();
    expect(parsePendingPayment('not-json')).toBeNull();
    expect(
      parsePendingPayment(JSON.stringify({ buyOrder: 'SUB-1', provider: 'flow' })),
    ).toEqual({ buyOrder: 'SUB-1', provider: 'flow' });
  });

  it('parsea respuesta de commit', () => {
    expect(parsePaymentCommitResponse({ ok: true, authorized: true, alreadyProcessed: true })).toMatchObject({
      ok: true,
      authorized: true,
      alreadyProcessed: true,
    });
    expect(parsePaymentCommitResponse(null)).toEqual({});
  });

  it('commitPayment envía Authorization cuando accessToken está presente (reposicion ownership)', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ ok: true, authorized: true, buyOrder: 'SUB-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await commitPayment({
      commitUrl: 'https://nucleo.test/api/subscriptions/checkout/commit',
      token: 'tok-ws',
      buyOrder: 'SUB-1',
      accessToken: 'jwt-user',
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-user');
  });

  it('commitPayment no lanza si el body no es JSON (502 HTML)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })),
    );

    const result = await commitPayment({
      commitUrl: 'https://nucleo.test/api/checkout/commit',
      token: 'tok-ws',
      accessToken: 'jwt',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('network');
      expect(result.message).toMatch(/soporte|no respondió/i);
    }
  });

  it('pending: array o primitivo → null (storage corrupto no lanza)', () => {
    expect(parsePendingPayment('[]')).toBeNull();
    expect(parsePendingPayment('[1,2]')).toBeNull();
    expect(parsePendingPayment('42')).toBeNull();
    expect(parsePendingPayment('')).toBeNull();
  });

  it('pending: campos con tipo incorrecto se descartan', () => {
    expect(parsePendingPayment('{"buyOrder":123,"provider":true}')).toEqual({
      buyOrder: undefined,
      provider: undefined,
    });
    expect(parsePendingPayment('{}')).toEqual({ buyOrder: undefined, provider: undefined });
  });

  it('commit: tipos incorrectos → undefined (no rompe el flujo)', () => {
    const parsed = parsePaymentCommitResponse({ ok: 'yes', authorized: 1, buyOrder: 42 });
    expect(parsed.ok).toBeUndefined();
    expect(parsed.authorized).toBeUndefined();
    expect(parsed.buyOrder).toBeUndefined();
  });

  it('commit: array o primitivo → {} (no lanza)', () => {
    expect(parsePaymentCommitResponse([])).toEqual({});
    expect(parsePaymentCommitResponse('x')).toEqual({});
    expect(parsePaymentCommitResponse(undefined)).toEqual({});
  });
});