import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getNucleoPublicUrl, signFlowParams, toFlowFormBody, withFlowSignature } from './flow-sign';

describe('flow-sign', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_NUCLEO_API_URL;
    delete process.env.NEXT_PUBLIC_URL_NUCLEO;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL;
    delete process.env.CI;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getNucleoPublicUrl', () => {
    it('usa NEXT_PUBLIC_NUCLEO_API_URL cuando es válida', () => {
      process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://nucleo-custom.example.com';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-custom.example.com');
    });

    it('normaliza apex registroapicolachiloe.me a www.registroapicolachiloe.me para evitar 308 en webhooks', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://registroapicolachiloe.me';
      expect(getNucleoPublicUrl()).toBe('https://www.registroapicolachiloe.me');
    });

    it('acepta www.registroapicolachiloe.me directamente', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.registroapicolachiloe.me';
      expect(getNucleoPublicUrl()).toBe('https://www.registroapicolachiloe.me');
    });

    it('descarta dominio de tienda si fue configurado por error en env', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://obrerayzangano.cl';
      process.env.VERCEL = '1';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('descarta dominio de tienda www si fue configurado por error', () => {
      process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://www.obrerayzangano.cl';
      process.env.VERCEL = '1';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('descarta tienda-eta-lime.vercel.app', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://tienda-eta-lime.vercel.app';
      process.env.VERCEL = '1';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('descarta dominios de campo (.store / campo-olive)', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://obrerayzangano.store';
      process.env.VERCEL = '1';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-theta.vercel.app');
    });

    it('devuelve http://localhost:3000 en entorno de desarrollo local sin env', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      expect(getNucleoPublicUrl()).toBe('http://localhost:3000');
    });

    it('devuelve fallback canónico nucleo-theta en producción si no hay env', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      expect(getNucleoPublicUrl()).toBe('https://nucleo-theta.vercel.app');
    });
  });

  describe('signFlowParams', () => {
    it('ordena parámetros alfabéticamente y calcula HMAC-SHA256', async () => {
      const params = { amount: '1000', apiKey: 'test-key', commerceOrder: 'ORD-123' };
      const secret = 'my-secret-key';
      const sig = await signFlowParams(params, secret);
      expect(typeof sig).toBe('string');
      expect(sig.length).toBe(64); // hex sha256
    });

    it('withFlowSignature adjunta la firma en el campo s', async () => {
      const params = { amount: '1000', apiKey: 'test-key' };
      const signed = await withFlowSignature(params, 'secret');
      expect(signed.s).toBeTruthy();
      expect(signed.amount).toBe('1000');
    });

    it('toFlowFormBody genera un query string URLSearchParams', () => {
      const body = toFlowFormBody({ a: '1', b: 'dos palabras' });
      expect(body).toBe('a=1&b=dos+palabras');
    });
  });
});
