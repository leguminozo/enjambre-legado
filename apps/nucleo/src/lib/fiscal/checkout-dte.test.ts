import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEmitBoletaVentaToSii = vi.fn();

vi.mock('@/api/lib/fiscal/emit-boleta-venta', () => ({
  emitBoletaVentaToSii: (...args: unknown[]) => mockEmitBoletaVentaToSii(...args),
}));

vi.mock('@/api/lib/fiscal/rcv-sync', () => ({
  periodoFromFecha: () => '202606',
  syncRcvPeriod: vi.fn().mockResolvedValue({ ok: true, syncId: 'sync-1', reconciledCount: 1 }),
}));

import { isAutoEmitBoletaEnabled, maybeEmitBoletaPostCheckout } from './checkout-dte';

describe('checkout-dte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SII_AUTO_EMIT_BOLETA;
  });

  it('isAutoEmitBoletaEnabled requires explicit true', () => {
    expect(isAutoEmitBoletaEnabled()).toBe(false);
    process.env.SII_AUTO_EMIT_BOLETA = 'true';
    expect(isAutoEmitBoletaEnabled()).toBe(true);
  });

  it('skips emission when flag disabled', async () => {
    const result = await maybeEmitBoletaPostCheckout({} as any, {
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

    const admin = {} as any;
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
  });
});