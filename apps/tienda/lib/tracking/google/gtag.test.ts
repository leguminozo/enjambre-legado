import { describe, expect, it } from 'vitest';
import {
  buildGtagEcommercePayload,
  buildPurchaseConversionParams,
  mapMetaEventToGtagName,
  normalizeGoogleAdsId,
  normalizeGoogleAdsLabel,
} from './gtag';

describe('normalizeGoogleAdsId', () => {
  it('acepta AW- y solo dígitos', () => {
    expect(normalizeGoogleAdsId('AW-1234567890')).toBe('AW-1234567890');
    expect(normalizeGoogleAdsId('1234567890')).toBe('AW-1234567890');
    expect(normalizeGoogleAdsId('aw-99')).toBe('AW-99');
  });

  it('rechaza vacío o basura', () => {
    expect(normalizeGoogleAdsId(undefined)).toBeUndefined();
    expect(normalizeGoogleAdsId('')).toBeUndefined();
    expect(normalizeGoogleAdsId('G-XXXX')).toBeUndefined();
    expect(normalizeGoogleAdsId('AW-')).toBeUndefined();
  });
});

describe('normalizeGoogleAdsLabel', () => {
  it('acepta label de conversión típico', () => {
    expect(normalizeGoogleAdsLabel('AbC-D_efGHIJK-lmN')).toBe('AbC-D_efGHIJK-lmN');
  });

  it('rechaza vacío o caracteres raros', () => {
    expect(normalizeGoogleAdsLabel('')).toBeUndefined();
    expect(normalizeGoogleAdsLabel('foo/bar')).toBeUndefined();
    expect(normalizeGoogleAdsLabel('label con espacio')).toBeUndefined();
  });
});

describe('mapMetaEventToGtagName', () => {
  it('mapea el embudo Meta → ecommerce gtag', () => {
    expect(mapMetaEventToGtagName('ViewContent')).toBe('view_item');
    expect(mapMetaEventToGtagName('AddToCart')).toBe('add_to_cart');
    expect(mapMetaEventToGtagName('InitiateCheckout')).toBe('begin_checkout');
    expect(mapMetaEventToGtagName('Purchase')).toBe('purchase');
  });
});

describe('buildGtagEcommercePayload', () => {
  it('arma items, value y transaction_id', () => {
    expect(
      buildGtagEcommercePayload({
        value: 19980,
        currency: 'CLP',
        orderId: 'OYZ-1',
        contents: [{ id: 'miel-ulmo', quantity: 2, itemPrice: 9990 }],
      }),
    ).toEqual({
      value: 19980,
      currency: 'CLP',
      transaction_id: 'OYZ-1',
      items: [{ item_id: 'miel-ulmo', quantity: 2, price: 9990 }],
    });
  });

  it('cae a contentIds si no hay contents', () => {
    expect(buildGtagEcommercePayload({ contentIds: ['a', 'b'] })).toEqual({
      items: [
        { item_id: 'a', quantity: 1 },
        { item_id: 'b', quantity: 1 },
      ],
    });
  });
});

describe('buildPurchaseConversionParams', () => {
  it('compone send_to AW-id/label', () => {
    expect(
      buildPurchaseConversionParams({
        adsId: 'AW-123',
        label: 'abc',
        value: 5000,
        currency: 'CLP',
        orderId: 'OYZ-9',
      }),
    ).toEqual({
      send_to: 'AW-123/abc',
      value: 5000,
      currency: 'CLP',
      transaction_id: 'OYZ-9',
    });
  });
});
