import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GastoExtranjeroResult } from '@enjambre/contable';
import { processGastoExtranjero } from '../gasto-pipeline';

const mockEnqueue = vi.fn();

const mockFindDuplicate = vi.fn();
const mockAssertCaf = vi.fn();

vi.mock('../gasto-idempotency', () => ({
  buildGastoIdempotencyKey: () => 'hash-meta-test',
  findDuplicateGasto: (...args: unknown[]) => mockFindDuplicate(...args),
}));

vi.mock('../caf-guard', () => ({
  assertCafAvailable: (...args: unknown[]) => mockAssertCaf(...args),
}));

vi.mock('../sii-document-jobs', () => ({
  enqueueSiiDocumentJob: (...args: unknown[]) => mockEnqueue(...args),
}));

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
  const terminalEq = vi.fn().mockResolvedValue({ error: null });
  const eq = vi.fn().mockImplementation(() => ({ eq: terminalEq }));
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id }, error: null }),
    update: vi.fn().mockReturnValue({ eq }),
    eq: terminalEq,
  };
}

describe('gasto-pipeline', () => {
  const mockCreateFactura = vi.fn();
  const mockEmit = vi.fn();
  const mockSyncRcv = vi.fn();

  const deps = {
    createFacturaCompra: (...args: unknown[]) => mockCreateFactura(...args),
    emitFacturaCompra: (...args: unknown[]) => mockEmit(...args),
    syncRcv: (...args: unknown[]) => mockSyncRcv(...args),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SII_ASYNC_EMIT = 'false';
    mockFindDuplicate.mockResolvedValue(null);
    mockAssertCaf.mockResolvedValue({ foliosRestantes: 40 });
    mockCreateFactura.mockResolvedValue({ id: 'fc-46-1' });
    mockEmit.mockResolvedValue({
      ok: true,
      trackId: 'track-meta-1',
      estadoSii: 'aceptado',
    });
    mockSyncRcv.mockResolvedValue({ ok: true, syncId: 'rcv-1', reconciledCount: 1 });
    mockEnqueue.mockResolvedValue({ ok: true, id: 'job-async-1' });
  });

  afterEach(() => {
    delete process.env.SII_ASYNC_EMIT;
  });

  it('runs parse→factura→emit→RCV for Meta gasto', async () => {
    const gastosChain = makeSupabaseInsertChain('gasto-1');
    const fiscalDocsChain = makeSupabaseInsertChain('doc-1');
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'gastos_extranjeros') return gastosChain;
        if (table === 'fiscal_documents') return fiscalDocsChain;
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const result = await processGastoExtranjero(supabase, 'emp-1', {
      gasto: metaGasto,
      receiptRaw: 'Meta Ads invoice text',
      fiscalDocumentId: 'doc-1',
    }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.facturaCompraId).toBe('fc-46-1');
    expect(result.emission?.estadoSii).toBe('aceptado');
    expect(mockEmit).toHaveBeenCalledWith('emp-1', 'fc-46-1');
    expect(mockSyncRcv).toHaveBeenCalledWith('emp-1', '202606', 'compras');
  });

  it('encola emisión cuando SII_ASYNC_EMIT está activo', async () => {
    process.env.SII_ASYNC_EMIT = 'true';
    const gastosChain = makeSupabaseInsertChain('gasto-async');
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'gastos_extranjeros') return gastosChain;
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const result = await processGastoExtranjero(supabase, 'emp-1', { gasto: metaGasto }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.encolado).toBe(true);
    expect(result.jobId).toBe('job-async-1');
    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockEnqueue).toHaveBeenCalled();
  });

  it('fails closed on caf_exhausted', async () => {
    const cafErr = Object.assign(new Error('CAF agotado'), { code: 'caf_exhausted' });
    mockAssertCaf.mockRejectedValue(cafErr);

    const result = await processGastoExtranjero({} as any, 'emp-1', { gasto: metaGasto }, deps);

    expect(result).toMatchObject({ ok: false, code: 'caf_exhausted' });
    expect(mockCreateFactura).not.toHaveBeenCalled();
  });
});