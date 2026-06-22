import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { parseReceipt } from '@enjambre/contable';

vi.mock('@enjambre/contable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@enjambre/contable')>();
  return {
    ...actual,
    fetchTasaDolar: vi.fn().mockResolvedValue(950),
    fetchTasaEuro: vi.fn().mockResolvedValue(1050),
  };
});

const mockProcessGasto = vi.fn();

vi.mock('@/api/lib/fiscal/gasto-pipeline', () => ({
  processGastoExtranjero: (...args: unknown[]) => mockProcessGasto(...args),
}));

vi.mock('@/api/lib/ratelimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 30,
    remaining: 29,
    reset: Date.now() + 60_000,
  }),
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
  RATE_LIMIT_CONFIGS: { api: { limit: 30, window: '1 m' } },
}));

import { gastosRoutes } from '../sii/gastos';

const META_RECEIPT = `
Meta Ads Billing Statement
Meta for Business
Invoice # INV-META-2026-001
Ad account ID: 9876543210
Billing period: June 2026
Total: USD 150.00
June 15, 2026
`;

describe('POST /gastos-extranjero/procesar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessGasto.mockResolvedValue({
      ok: true,
      alreadyProcessed: false,
      gastoId: 'gasto-meta-1',
      facturaCompraId: 'fc-46-meta',
      idempotencyKey: 'hash-meta',
      emission: { trackId: 'track-1', estadoSii: 'aceptado' },
    });
  });

  it('parses Meta receipt text and delegates to pipeline', async () => {
    const supabase = {} as any;
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase);
      await next();
    });
    app.route('/gastos-extranjero', gastosRoutes);

    const res = await app.request('/gastos-extranjero/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt_text: META_RECEIPT }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.facturaCompraId).toBe('fc-46-meta');
    expect(json.data.emission.estadoSii).toBe('aceptado');

    const parsed = parseReceipt(META_RECEIPT, undefined, 950);
    expect(parsed?.proveedorId).toBe('meta-ads');

    expect(mockProcessGasto).toHaveBeenCalledWith(
      supabase,
      'emp-1',
      expect.objectContaining({
        gasto: expect.objectContaining({ proveedorId: 'meta-ads' }),
        receiptRaw: META_RECEIPT,
      }),
    );
  });

  it('returns 422 when receipt cannot be parsed', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', {} as any);
      await next();
    });
    app.route('/gastos-extranjero', gastosRoutes);

    const res = await app.request('/gastos-extranjero/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt_text: 'texto sin montos ni proveedor' }),
    });

    expect(res.status).toBe(422);
    expect(mockProcessGasto).not.toHaveBeenCalled();
  });
});