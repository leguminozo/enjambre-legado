import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { parseReceiptOrchestrated } from '@enjambre/contable';

const mockProcessGasto = vi.fn();
const mockParseReceiptForEmpresa = vi.fn();

vi.mock('@/api/lib/fiscal/gasto-pipeline', () => ({
  processGastoExtranjero: (...args: unknown[]) => mockProcessGasto(...args),
}));

vi.mock('@/api/lib/fiscal/receipt-parse', () => ({
  isReceiptParseFailure: (result: { ok?: false }) => result?.ok === false,
  parseReceiptForEmpresa: (...args: unknown[]) => mockParseReceiptForEmpresa(...args),
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
    const orchestrated = parseReceiptOrchestrated(META_RECEIPT, { tasaCambio: 950 });
    expect(orchestrated).not.toBeNull();
    mockParseReceiptForEmpresa.mockResolvedValue(orchestrated);

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

    expect(mockProcessGasto).toHaveBeenCalledWith(
      supabase,
      'emp-1',
      expect.objectContaining({
        gasto: expect.objectContaining({ proveedorId: 'meta-ads' }),
        receiptRaw: META_RECEIPT,
        parseConfidence: expect.objectContaining({ parserId: 'meta-ads' }),
      }),
    );
  });

  it('returns 422 when receipt cannot be parsed', async () => {
    mockParseReceiptForEmpresa.mockResolvedValue({
      ok: false,
      code: 'receipt_parse_failed',
      message: 'No se pudieron extraer montos del documento',
      detectado: null,
    });

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