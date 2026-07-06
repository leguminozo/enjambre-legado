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
});