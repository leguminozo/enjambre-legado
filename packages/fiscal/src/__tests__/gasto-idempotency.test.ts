import { describe, it, expect, vi } from 'vitest';
import { buildGastoIdempotencyKey, findDuplicateGasto } from '../gasto-idempotency';
import type { GastoExtranjeroResult } from '@enjambre/contable';

const sampleGasto: GastoExtranjeroResult = {
  proveedorId: 'meta-ads',
  proveedorRut: '55555555-5',
  proveedorNombre: 'Meta',
  proveedorGiro: 'Publicidad',
  montoOriginal: 100,
  monedaOriginal: 'USD',
  montoCLP: 95000,
  tasaCambio: 950,
  montoNeto: 0,
  montoExento: 95000,
  montoIva: 0,
  montoTotal: 95000,
  fechaEmision: '2026-06-01',
  numeroDocumento: 'INV-123',
  concepto: 'Meta Ads',
  detalle: '',
};

describe('gasto-idempotency', () => {
  it('buildGastoIdempotencyKey is deterministic', () => {
    const a = buildGastoIdempotencyKey('emp-1', sampleGasto);
    const b = buildGastoIdempotencyKey('emp-1', sampleGasto);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('findDuplicateGasto checks idempotency_key first', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({
        data: { id: 'gasto-1', estado: 'facturado', factura_compra_id: 'fc-1' },
      });

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle,
    };

    const supabase = { from: vi.fn(() => chain) } as any;

    const match = await findDuplicateGasto(supabase, 'emp-1', sampleGasto);

    expect(chain.eq).toHaveBeenCalledWith('idempotency_key', buildGastoIdempotencyKey('emp-1', sampleGasto));
    expect(match?.id).toBe('gasto-1');
  });
});