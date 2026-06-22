import { describe, it, expect } from 'vitest';
import { signWalletQrToken, verifyWalletQrToken } from '../qr-token';

describe('wallet qr token', () => {
  const secret = 'test-secret';

  it('firma y verifica token válido', () => {
    const token = signWalletQrToken('user-uuid-1', secret);
    const result = verifyWalletQrToken(token, secret);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.userId).toBe('user-uuid-1');
  });

  it('rechaza secret incorrecto', () => {
    const token = signWalletQrToken('user-uuid-1', secret);
    const result = verifyWalletQrToken(token, 'wrong-secret');
    expect(result.ok).toBe(false);
  });
});