import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  friendlyCheckoutApiMessage,
  isCheckoutConfigError,
  shouldBlockCheckoutPayment,
} from './checkout-errors';

describe('friendlyCheckoutApiMessage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('maps missing supabase in dev', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(
      friendlyCheckoutApiMessage(
        'quote_failed',
        'Missing Supabase credentials for admin client',
        'quote',
      ),
    ).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('hides supabase details in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(
      friendlyCheckoutApiMessage(
        'quote_failed',
        'Missing Supabase credentials for admin client',
        'quote',
      ),
    ).toContain('actualizando');
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

  it('blocks before region is selected', () => {
    expect(
      shouldBlockCheckoutPayment('', {
        quoteLoading: false,
        quote: null,
        quoteError: null,
      }),
    ).toBe(true);
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