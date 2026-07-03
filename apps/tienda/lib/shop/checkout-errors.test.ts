import { describe, expect, it } from 'vitest';
import { friendlyCheckoutApiMessage } from './checkout-errors';

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