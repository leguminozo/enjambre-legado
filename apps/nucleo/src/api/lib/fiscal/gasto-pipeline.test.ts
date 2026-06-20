import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GastoExtranjeroResult } from '@enjambre/contable';

const mockFindDuplicate = vi.fn();
const mockAssertCaf = vi.fn();
const mockCreateFactura = vi.fn();
const mockEmit = vi.fn();
const mockSyncRcv = vi.fn();

vi.mock('./gasto-idempotency', () => ({
  buildGastoIdempotencyKey: () => 'hash-meta-test',
  findDuplicateGasto: (...args: unknown[]) => mockFindDuplicate(...args),
}));

vi.mock('./caf-guard', () => ({
  assertCafAvailable: (...args: unknown[]) => mockAssertCaf(...args),
}));

vi.mock('@/api/routes/sii/helpers', () => ({
  createFacturaCompraFromGasto: (...args: unknown[]) => mockCreateFactura(...args),
}));

vi.mock('./emit-factura-compra', () => ({
  emitFacturaCompraToSii: (...args: unknown[]) => mockEmit(...args),
}));

vi.mock('./rcv-sync', () => ({
  periodoFromFecha: () => '202606',
  syncRcvPeriod: (...args: unknown[]) => mockSyncRcv(...args),
}));

import { processGastoExtranjero } from './gasto-pipeline';

const metaGasto: GastoExtranjeroResult = {
  proveedorId: 'meta-ads',
  proveedorRut: '55555555-5',
  proveedorNombre: 'Meta Platforms',
  proveedorGiro: 'Publicidad digital',
  montoOriginal: 150,
  monedaOriginal: 'USD',
  montoCLP: 142500,
  tasaCambio: 950,
  montoNeto: 0,
  montoExento: 142500,
  montoIva: 0,
  montoTotal: 142500,
  fechaEmision: '2026-06-15',
  numeroDocumento: 'INV-META-2026-001',
  concepto: 'Servicio de publicidad digital Meta Ads',
  detalle: 'Meta Ads',
};

function makeSupabaseInsertChain(id: string) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id }, error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe('gasto-pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindDuplicate.mockResolvedValue(null);
    mockAssertCaf.mockResolvedValue({ foliosRestantes: 40 });
    mockCreateFactura.mockResolvedValue({ data: { id: 'fc-46-1' } });
    mockEmit.mockResolvedValue({
      ok: true,
      trackId: 'track-meta-1',
      estado: 'EPR',
      estadoSii: 'aceptado',
    });
    mockSyncRcv.mockResolvedValue({ ok: true, syncId: 'rcv-1', reconciledCount: 1 });
  });

  it('processGastoExtranjero runs parse→factura→emit→RCV for Meta gasto', async () => {
    const gastosChain = makeSupabaseInsertChain('gasto-1');
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'gastos_extranjeros') return gastosChain;
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const result = await processGastoExtranjero(supabase, 'emp-1', {
      gasto: metaGasto,
      receiptRaw: 'Meta Ads invoice text',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.alreadyProcessed).toBe(false);
    expect(result.facturaCompraId).toBe('fc-46-1');
    expect(result.emission?.estadoSii).toBe('aceptado');
    expect(result.rcv?.periodo).toBe('202606');
    expect(mockEmit).toHaveBeenCalledWith(supabase, 'emp-1', 'fc-46-1');
    expect(mockSyncRcv).toHaveBeenCalledWith(supabase, 'emp-1', '202606', 'compras');
  });

  it('returns alreadyProcessed when duplicate has factura_compra_id', async () => {
    mockFindDuplicate.mockResolvedValue({
      id: 'gasto-dup',
      estado: 'facturado',
      factura_compra_id: 'fc-existing',
    });

    const result = await processGastoExtranjero({} as any, 'emp-1', { gasto: metaGasto });

    expect(result).toMatchObject({
      ok: true,
      alreadyProcessed: true,
      facturaCompraId: 'fc-existing',
    });
    expect(mockCreateFactura).not.toHaveBeenCalled();
  });

  it('fails closed on caf_exhausted without creating factura', async () => {
    const cafErr = Object.assign(new Error('CAF agotado'), { code: 'caf_exhausted' });
    mockAssertCaf.mockRejectedValue(cafErr);

    const result = await processGastoExtranjero({} as any, 'emp-1', { gasto: metaGasto });

    expect(result).toMatchObject({ ok: false, code: 'caf_exhausted' });
    expect(mockCreateFactura).not.toHaveBeenCalled();
  });
});