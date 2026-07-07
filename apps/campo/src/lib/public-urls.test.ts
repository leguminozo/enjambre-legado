import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildClaimUrl, getTiendaOrigin } from './public-urls';

describe('public-urls', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefiere NEXT_PUBLIC_URL_TIENDA', () => {
    vi.stubEnv('NEXT_PUBLIC_URL_TIENDA', 'https://tienda-eta-lime.vercel.app');
    expect(getTiendaOrigin()).toBe('https://tienda-eta-lime.vercel.app');
    expect(buildClaimUrl('abc-123')).toBe('https://tienda-eta-lime.vercel.app/claim/abc-123');
  });

  it('acepta NEXT_PUBLIC_TIENDA_URL como alias', () => {
    vi.stubEnv('NEXT_PUBLIC_TIENDA_URL', 'https://obrerayzangano.com');
    expect(getTiendaOrigin()).toBe('https://obrerayzangano.com');
  });

  it('codifica tokens con caracteres especiales', () => {
    vi.stubEnv('NEXT_PUBLIC_URL_TIENDA', 'https://tienda.test');
    expect(buildClaimUrl('tok/en')).toBe('https://tienda.test/claim/tok%2Fen');
  });
});