import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getNucleoApiUrl, CANONICAL_NUCLEO_URL } from './nucleo-url';

describe('nucleo-url — fallback y protección de origen propio', () => {
  const originalEnv = process.env.NEXT_PUBLIC_NUCLEO_API_URL;
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = originalEnv;
    process.env.VERCEL = originalVercel;
  });

  it('devuelve CANONICAL_NUCLEO_URL en entorno producción (VERCEL) si env no está configurada', () => {
    delete process.env.NEXT_PUBLIC_NUCLEO_API_URL;
    process.env.VERCEL = '1';
    expect(getNucleoApiUrl()).toBe(CANONICAL_NUCLEO_URL);
  });

  it('ignora NEXT_PUBLIC_NUCLEO_API_URL si apunta por error al dominio de la tienda en Vercel', () => {
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://www.obrerayzangano.cl';
    process.env.VERCEL = '1';
    expect(getNucleoApiUrl()).toBe(CANONICAL_NUCLEO_URL);
  });

  it('utiliza la URL configurada si es un dominio externo válido', () => {
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://nucleo-custom.vercel.app/';
    expect(getNucleoApiUrl()).toBe('https://nucleo-custom.vercel.app');
  });

  it('ignora landings territoriales (.online / registro) que no sirven el BFF', () => {
    process.env.VERCEL = '1';
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://obrerayzangano.online';
    expect(getNucleoApiUrl()).toBe(CANONICAL_NUCLEO_URL);
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://www.registroapicolachiloe.me/';
    expect(getNucleoApiUrl()).toBe(CANONICAL_NUCLEO_URL);
  });

  it('ignora el preview de tienda (eta-lime) como si fuera BFF', () => {
    process.env.VERCEL = '1';
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://tienda-eta-lime.vercel.app';
    expect(getNucleoApiUrl()).toBe(CANONICAL_NUCLEO_URL);
  });
});
