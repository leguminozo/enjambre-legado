import { describe, expect, it } from 'vitest';
import {
  parsePaymentCommitResponse,
  parsePendingPayment,
} from './payment-commit';

describe('payment-commit', () => {
  it('parsea pending payment desde sessionStorage', () => {
    expect(parsePendingPayment(null)).toBeNull();
    expect(parsePendingPayment('not-json')).toBeNull();
    expect(
      parsePendingPayment(JSON.stringify({ buyOrder: 'SUB-1', provider: 'flow' })),
    ).toEqual({ buyOrder: 'SUB-1', provider: 'flow' });
  });

  it('parsea respuesta de commit', () => {
    expect(parsePaymentCommitResponse({ ok: true, authorized: true, alreadyProcessed: true })).toEqual({
      ok: true,
      authorized: true,
      alreadyProcessed: true,
    });
    expect(parsePaymentCommitResponse(null)).toEqual({});
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