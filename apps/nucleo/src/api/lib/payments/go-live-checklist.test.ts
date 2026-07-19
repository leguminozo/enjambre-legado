import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  buildPagosGoLiveChecklist,
  resolveActivePaymentProvider,
} from './go-live-checklist';

describe('pagos go-live checklist', () => {
  const keys = [
    'PAYMENT_PROVIDER',
    'FLOW_API_KEY',
    'FLOW_SECRET',
    'FLOW_API_URL',
    'TRANSBANK_COMMERCE_CODE',
    'TRANSBANK_API_KEY',
    'TRANSBANK_ENVIRONMENT',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_URL_TIENDA',
    'NEXT_PUBLIC_NUCLEO_API_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'PAYMENT_MOCK',
    'E2E_MOCK_PAYMENT',
    'VERCEL_ENV',
  ] as const;

  const snapshot: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of keys) snapshot[k] = process.env[k];
    for (const k of keys) delete process.env[k];
  });

  afterEach(() => {
    for (const k of keys) {
      if (snapshot[k] === undefined) delete process.env[k];
      else process.env[k] = snapshot[k];
    }
  });

  it('defaults provider to flow', () => {
    expect(resolveActivePaymentProvider()).toBe('flow');
  });

  it('reports listoCheckout when flow + urls + service role ready (non-prod)', () => {
    process.env.PAYMENT_PROVIDER = 'flow';
    process.env.FLOW_API_KEY = 'k';
    process.env.FLOW_SECRET = 's';
    process.env.FLOW_API_URL = 'https://sandbox.flow.cl/api';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://tienda.example';
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://nucleo.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
    process.env.VERCEL_ENV = 'development';

    const status = buildPagosGoLiveChecklist({ cafFoliosRestantes: 50, cafMinFolios: 10 });
    expect(status.provider).toBe('flow');
    expect(status.listoCheckout).toBe(true);
    expect(status.items.find((i) => i.id === 'provider-keys')?.cumplido).toBe(true);
  });

  it('fails closed when flow keys missing', () => {
    process.env.PAYMENT_PROVIDER = 'flow';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://tienda.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';

    const status = buildPagosGoLiveChecklist();
    expect(status.listoCheckout).toBe(false);
    expect(status.criticosPendientes).toBeGreaterThan(0);
    expect(status.items.find((i) => i.id === 'provider-keys')?.cumplido).toBe(false);
  });

  it('flags mock payment as critical in production', () => {
    process.env.PAYMENT_PROVIDER = 'flow';
    process.env.FLOW_API_KEY = 'k';
    process.env.FLOW_SECRET = 's';
    process.env.FLOW_API_URL = 'https://www.flow.cl/api';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://tienda.example';
    process.env.NEXT_PUBLIC_NUCLEO_API_URL = 'https://nucleo.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'srk';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
    process.env.VERCEL_ENV = 'production';
    process.env.PAYMENT_MOCK = '1';

    const status = buildPagosGoLiveChecklist({ cafFoliosRestantes: 100 });
    expect(status.items.find((i) => i.id === 'no-mock')?.cumplido).toBe(false);
    expect(status.listoProduccion).toBe(false);
  });
});
