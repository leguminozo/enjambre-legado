import { describe, expect, it } from 'vitest';
import {
  friendlyCheckoutApiMessage,
  isCheckoutConfigError,
  shouldBlockCheckoutPayment,
} from './checkout-errors';

describe('friendlyCheckoutApiMessage', () => {
  it('maps missing supabase in dev', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(
      friendlyCheckoutApiMessage(
        'quote_failed',
        'Missing Supabase credentials for admin client',
        'quote',
      ),
    ).toContain('SUPABASE_SERVICE_ROLE_KEY');
    process.env.NODE_ENV = prev;
  });

  it('hides supabase details in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(
      friendlyCheckoutApiMessage(
        'quote_failed',
        'Missing Supabase credentials for admin client',
        'quote',
      ),
    ).toContain('actualizando');
    process.env.NODE_ENV = prev;
  });

  it('maps csrf forbidden', () => {
    expect(
      friendlyCheckoutApiMessage('forbidden', 'CSRF: Origin not allowed', 'init'),
    ).toContain('Recarga');
  });

  it('maps promo code errors', () => {
    expect(
      friendlyCheckoutApiMessage('quote_failed', 'Código de descuento inválido', 'quote'),
    ).toContain('promocional');
  });
});

describe('isCheckoutConfigError', () => {
  it('detects missing supabase credentials', () => {
    expect(
      isCheckoutConfigError('quote_failed', 'Missing Supabase credentials for admin client'),
    ).toBe(true);
  });

  it('ignores promo validation errors', () => {
    expect(isCheckoutConfigError('quote_failed', 'Código no válido')).toBe(false);
  });
});

describe('shouldBlockCheckoutPayment', () => {
  const quote = { subtotal: 10000, total: 15900, shippingCost: 5900, discountClp: 0, loyaltyDiscountClp: 0 };

  it('does not block before region is selected', () => {
    expect(
      shouldBlockCheckoutPayment('', {
        quoteLoading: false,
        quote: null,
        quoteError: null,
      }),
    ).toBe(false);
  });

  it('blocks while quote is loading', () => {
    expect(
      shouldBlockCheckoutPayment('Metropolitana', {
        quoteLoading: true,
        quote: null,
        quoteError: null,
      }),
    ).toBe(true);
  });

  it('blocks when quote failed', () => {
    expect(
      shouldBlockCheckoutPayment('Metropolitana', {
        quoteLoading: false,
        quote: null,
        quoteError: 'El código promocional no es válido',
      }),
    ).toBe(true);
  });

  it('allows payment with valid quote', () => {
    expect(
      shouldBlockCheckoutPayment('Metropolitana', {
        quoteLoading: false,
        quote,
        quoteError: null,
      }),
    ).toBe(false);
  });
});