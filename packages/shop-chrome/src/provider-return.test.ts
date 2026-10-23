import { describe, expect, it } from 'vitest';
import {
  isPaymentReturnPath,
  normalizeReturnPath,
  parseProviderReturn,
} from './provider-return';

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe('provider-return', () => {
  it('normaliza token y conserva buyOrder/provider de la URL de retorno', () => {
    const parsed = parseProviderReturn(
      form({ token: 'flow-token' }),
      new URLSearchParams('buyOrder=ORD-1&provider=flow'),
    );

    expect(parsed).toEqual({
      token: 'flow-token',
      buyOrder: 'ORD-1',
      provider: 'flow',
      failed: false,
    });
  });

  it('prioriza token_ws de Webpay y usa TBK_ORDEN_COMPRA en abortos', () => {
    const success = parseProviderReturn(
      form({ token_ws: 'webpay-token', token: 'other' }),
      new URLSearchParams(),
    );
    expect(success.token).toBe('webpay-token');
    expect(success.failed).toBe(false);

    const aborted = parseProviderReturn(
      form({ TBK_TOKEN: 'abort-token', TBK_ORDEN_COMPRA: 'ORD-ABORT' }),
      new URLSearchParams(),
    );
    expect(aborted).toEqual({
      token: undefined,
      buyOrder: 'ORD-ABORT',
      provider: undefined,
      failed: true,
    });
  });

  it('declara fallo cuando falta token o el body no es legible', () => {
    expect(parseProviderReturn(null, new URLSearchParams())).toMatchObject({ failed: true });
    expect(
      parseProviderReturn(form({ token: 'x'.repeat(4097) }), new URLSearchParams()),
    ).toMatchObject({ failed: true, token: undefined });
  });

  it('descarta buyOrder y provider no confiables', () => {
    const parsed = parseProviderReturn(
      form({ token: 'tok' }),
      new URLSearchParams({ buyOrder: '../admin', provider: 'evil' }),
    );

    expect(parsed.buyOrder).toBeUndefined();
    expect(parsed.provider).toBeUndefined();
    expect(parsed.failed).toBe(false);
  });

  it('solo intercepta rutas de retorno conocidas', () => {
    expect(isPaymentReturnPath('/checkout/resultado/')).toBe(true);
    expect(isPaymentReturnPath('/perfil/reposicion/resultado')).toBe(true);
    expect(isPaymentReturnPath('/admin')).toBe(false);
    expect(normalizeReturnPath('/checkout/resultado///')).toBe('/checkout/resultado');
  });
});
