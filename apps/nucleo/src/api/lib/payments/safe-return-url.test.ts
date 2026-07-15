import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveCheckoutReturnUrl } from './safe-return-url';

describe('resolveCheckoutReturnUrl', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.NEXT_PUBLIC_SITE_URL = 'https://tienda.oyz.cl';
    process.env.NEXT_PUBLIC_URL_TIENDA = 'https://tienda.oyz.cl';
  });

  afterEach(() => {
    process.env = env;
  });

  it('uses site default when raw is missing', () => {
    const url = resolveCheckoutReturnUrl(undefined, 'ORD-1');
    expect(url).toBe('https://tienda.oyz.cl/checkout/resultado?buyOrder=ORD-1');
  });

  it('accepts same-origin allowlisted path', () => {
    const url = resolveCheckoutReturnUrl(
      'https://tienda.oyz.cl/checkout/resultado',
      'ORD-2',
    );
    expect(url).toBe('https://tienda.oyz.cl/checkout/resultado?buyOrder=ORD-2');
  });

  it('rejects attacker origin (open redirect)', () => {
    const url = resolveCheckoutReturnUrl('https://evil.example/phish', 'ORD-3');
    expect(url).toBe('https://tienda.oyz.cl/checkout/resultado?buyOrder=ORD-3');
    expect(url).not.toContain('evil');
  });

  it('rejects wrong path on allowed origin', () => {
    const url = resolveCheckoutReturnUrl('https://tienda.oyz.cl/admin', 'ORD-4');
    expect(url).toBe('https://tienda.oyz.cl/checkout/resultado?buyOrder=ORD-4');
  });

  it('supports reposición fallback path', () => {
    const url = resolveCheckoutReturnUrl(
      undefined,
      'SUB-1',
      '/perfil/reposicion/resultado',
    );
    expect(url).toBe(
      'https://tienda.oyz.cl/perfil/reposicion/resultado?buyOrder=SUB-1',
    );
  });
});
