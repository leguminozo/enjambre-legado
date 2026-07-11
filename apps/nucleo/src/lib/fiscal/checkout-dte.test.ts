import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEmitBoletaVentaToSii = vi.fn();
const mockEnqueueSiiDocumentJob = vi.fn();

vi.mock('@/api/lib/fiscal/emit-boleta-venta', () => ({
  emitBoletaVentaToSii: (...args: unknown[]) => mockEmitBoletaVentaToSii(...args),
}));

vi.mock('@/api/lib/fiscal/rcv-sync', () => ({
  periodoFromFecha: () => '202606',
  syncRcvPeriod: vi.fn().mockResolvedValue({ ok: true, syncId: 'sync-1', reconciledCount: 1 }),
}));

vi.mock('@enjambre/fiscal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@enjambre/fiscal')>();
  return {
    ...actual,
    enqueueSiiDocumentJob: (...args: unknown[]) => mockEnqueueSiiDocumentJob(...args),
  };
});

import { isAutoEmitBoletaEnabled, maybeEmitBoletaPostCheckout } from './checkout-dte';

describe('checkout-dte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SII_AUTO_EMIT_BOLETA;
    mockEnqueueSiiDocumentJob.mockResolvedValue({ ok: true, id: 'job-1' });
  });

  it('isAutoEmitBoletaEnabled requires explicit true', () => {
    expect(isAutoEmitBoletaEnabled()).toBe(false);
    process.env.SII_AUTO_EMIT_BOLETA = 'true';
    expect(isAutoEmitBoletaEnabled()).toBe(true);
  });

  it('skips emission when flag disabled', async () => {
    const result = await maybeEmitBoletaPostCheckout({} as never, {
      empresaId: 'emp-1',
      facturaEmitidaId: 'fe-1',
      ventaId: 'venta-1',
      buyOrder: 'ORD-1',
      receptorNombre: 'Cliente',
      cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
      fechaEmision: '2026-06-19',
    });

    expect(result).toEqual({ skipped: true, reason: 'SII_AUTO_EMIT_BOLETA disabled' });
    expect(mockEmitBoletaVentaToSii).not.toHaveBeenCalled();
  });

  it('emits boleta when flag enabled without blocking on failure shape', async () => {
    process.env.SII_AUTO_EMIT_BOLETA = 'true';
    mockEmitBoletaVentaToSii.mockResolvedValue({
      ok: true,
      folio: 120,
      trackId: 'track-1',
      estadoSii: 'enviado',
    });

    const admin = {} as never;
    const result = await maybeEmitBoletaPostCheckout(admin, {
      empresaId: 'emp-1',
      facturaEmitidaId: 'fe-1',
      ventaId: 'venta-1',
      buyOrder: 'ORD-1',
      receptorNombre: 'Cliente',
      cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
      fechaEmision: '2026-06-19',
    });

    expect(result).toMatchObject({
      skipped: false,
      ok: true,
      folio: 120,
      trackId: 'track-1',
      estadoSii: 'enviado',
    });
    expect(mockEmitBoletaVentaToSii).toHaveBeenCalledTimes(1);
    expect(mockEnqueueSiiDocumentJob).not.toHaveBeenCalled();
  });

  it('enqueues retry job when emission fails', async () => {
    process.env.SII_AUTO_EMIT_BOLETA = 'true';
    mockEmitBoletaVentaToSii.mockResolvedValue({
      ok: false,
      code: 'sii_error',
      message: 'token fail',
    });

    const result = await maybeEmitBoletaPostCheckout({} as never, {
      empresaId: 'emp-1',
      facturaEmitidaId: 'fe-1',
      ventaId: 'venta-1',
      buyOrder: 'ORD-1',
      receptorNombre: 'Cliente',
      cart: [{ productId: 'p1', slug: 'miel', name: 'Miel', unitPrice: 10000, quantity: 1 }],
      fechaEmision: '2026-06-19',
    });

    expect(result).toMatchObject({
      skipped: false,
      ok: false,
      code: 'sii_error',
      jobId: 'job-1',
    });
    expect(mockEnqueueSiiDocumentJob).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sourceType: 'venta',
        sourceId: 'venta-1',
        idempotencyKey: 'boleta_checkout:fe-1',
      }),
    );
  });
});
