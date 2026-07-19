import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getBancoChileWebhookSecret,
  timingSafeEqualString,
  verifyBancoChileSignature,
} from './webhook';

describe('banco-chile webhook crypto', () => {
  const prev = process.env.BANCO_CHILE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.BANCO_CHILE_WEBHOOK_SECRET = 'test-webhook-secret-value';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.BANCO_CHILE_WEBHOOK_SECRET;
    else process.env.BANCO_CHILE_WEBHOOK_SECRET = prev;
  });

  it('timingSafeEqualString rejects different lengths without throw', () => {
    expect(timingSafeEqualString('abc', 'ab')).toBe(false);
    expect(timingSafeEqualString('abcd', 'abce')).toBe(false);
    expect(timingSafeEqualString('same', 'same')).toBe(true);
  });

  it('getBancoChileWebhookSecret fails closed when empty', () => {
    delete process.env.BANCO_CHILE_WEBHOOK_SECRET;
    expect(getBancoChileWebhookSecret()).toBeNull();
  });

  it('verifyBancoChileSignature accepts hex, sha256= prefix, and base64', async () => {
    const payload = JSON.stringify({ id: 'evt-1', tipo: 'saldo_disponible', fecha: '2026-01-01' });
    const secret = 'test-webhook-secret-value';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

    expect(await verifyBancoChileSignature(payload, hex, secret)).toBe(true);
    expect(await verifyBancoChileSignature(payload, `sha256=${hex}`, secret)).toBe(true);
    expect(await verifyBancoChileSignature(payload, b64, secret)).toBe(true);
    expect(await verifyBancoChileSignature(payload, 'deadbeef', secret)).toBe(false);
    expect(await verifyBancoChileSignature(payload, undefined, secret)).toBe(false);
    expect(await verifyBancoChileSignature(payload, hex, null)).toBe(false);
  });
});
