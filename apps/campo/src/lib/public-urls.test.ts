import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildClaimUrl, getNucleoApiUrl, getTiendaOrigin } from './public-urls';

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
    vi.stubEnv('NEXT_PUBLIC_URL_TIENDA', '');
    vi.stubEnv('NEXT_PUBLIC_TIENDA_URL', 'https://obrerayzangano.cl');
    expect(getTiendaOrigin()).toBe('https://obrerayzangano.cl');
  });

  it('codifica tokens con caracteres especiales', () => {
    vi.stubEnv('NEXT_PUBLIC_URL_TIENDA', 'https://tienda.test');
    expect(buildClaimUrl('tok/en')).toBe('https://tienda.test/claim/tok%2Fen');
  });

  it('usa https://obrerayzangano.cl como fallback canónico si no hay env ni window', () => {
    vi.stubEnv('NEXT_PUBLIC_URL_TIENDA', '');
    vi.stubEnv('NEXT_PUBLIC_TIENDA_URL', '');
    expect(getTiendaOrigin()).toBe('https://obrerayzangano.cl');
  });

  describe('getNucleoApiUrl', () => {
    it('usa el env si es válido y no pertenece a dominios inválidos', () => {
      vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', 'https://mi-nucleo.custom.com');
      expect(getNucleoApiUrl()).toBe('https://mi-nucleo.custom.com');
    });

    it('descarta obrerayzangano.online (sin deployment) y cae a nucleo-theta', () => {
      vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', 'https://obrerayzangano.online');
      expect(getNucleoApiUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('descarta obrerayzangano.store (propio campo) y cae a nucleo-theta', () => {
      vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', 'https://www.obrerayzangano.store');
      expect(getNucleoApiUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('usa fallback canónico https://nucleo-theta.vercel.app si no hay env', () => {
      vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', '');
      expect(getNucleoApiUrl()).toBe('https://nucleo-theta.vercel.app');
    });
  });
});