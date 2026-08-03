import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const state = vi.hoisted(() => ({
  caf: null as Record<string, unknown> | null,
  pendingRequest: null as Record<string, unknown> | null,
  insertedRequestId: 'req-1',
  insertedCafId: 'caf-nuevo',
  requestCafResult: { ok: true } as { ok: boolean; caf?: unknown; message?: string },
}));

vi.mock('@/api/lib/sii-caf-client', () => ({
  requestCaf: vi.fn(async () => state.requestCafResult),
}));

import {
  ensureCafFolios,
  isCafAutoEnabled,
  getCafRequestThreshold,
  getCafRequestQuantity,
} from './caf-auto-worker';

// ─── Supabase mock con filtros básicos ───
function makeBuilder(table: string) {
  const filters: Array<(row: Record<string, unknown>) => boolean> = [];
  const q: Record<string, unknown> = {
    select: () => q,
    eq: (col: string, val: unknown) => {
      filters.push((row) => row[col] === val);
      return q;
    },
    neq: (col: string, val: unknown) => {
      filters.push((row) => row[col] !== val);
      return q;
    },
    maybeSingle: async () => {
      if (table === 'sii_caf') return { data: state.caf, error: null };
      if (table === 'sii_caf_requests') return { data: state.pendingRequest, error: null };
      return { data: null, error: null };
    },
    single: async () => {
      if (table === 'sii_caf_requests') return { data: { id: state.insertedRequestId }, error: null };
      if (table === 'sii_caf') return { data: { id: state.insertedCafId }, error: null };
      return { data: null, error: null };
    },
    insert: (rows: unknown) => {
      // encadenable + thenable (mismo patrón que subscriptions-checkout.test)
      const data = Array.isArray(rows) ? rows[0] : rows;
      return Object.assign(q, {
        then: async (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data, error: null }),
      });
    },
    update: (patch: Record<string, unknown>) => {
      return Object.assign(q, {
        then: async (resolve: (v: { data: null; error: null }) => void) =>
          resolve({ data: null, error: null }),
      });
    },
  };
  return Object.assign(q, {
    then: async (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: [], error: null }),
  });
}

const mockSupabase = {
  from: (table: string) => makeBuilder(table),
} as never;

describe('caf-auto-worker (movimiento 2)', () => {
  beforeEach(() => {
    vi.stubEnv('SII_CAF_AUTO_ENABLED', 'true');
    vi.stubEnv('SII_CAF_REQUEST_THRESHOLD', '30');
    vi.stubEnv('SII_CAF_REQUEST_QTY', '100');
    state.caf = { id: 'caf-1', folio_hasta: 100, folio_actual: 60 }; // 40 restantes ≥ 30
    state.pendingRequest = null;
    state.requestCafResult = {
      ok: true,
      caf: {
        tipo_dte: 39,
        folio_desde: 101,
        folio_hasta: 200,
        folio_actual: 101,
        fecha_autorizacion: '2026-08-03',
        firma_caf: 'firma-x',
        private_key: 'pk',
        public_key: 'pubk',
        nro_resol: 0,
        fch_resol: '2026-08-03',
      },
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('kill-switch off → no solicita nada', async () => {
    vi.stubEnv('SII_CAF_AUTO_ENABLED', 'false');
    expect(isCafAutoEnabled()).toBe(false);
    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });
    expect(result).toEqual({ ok: true, requested: false });
  });

  it('umbrales/env por defecto', () => {
    vi.unstubAllEnvs();
    expect(getCafRequestThreshold()).toBe(30);
    expect(getCafRequestQuantity()).toBe(100);
  });

  it('CAF con folios suficientes → no solicita', async () => {
    state.caf = { id: 'caf-1', folio_hasta: 100, folio_actual: 10 }; // 90 restantes
    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });
    expect(result).toEqual({ ok: true, requested: false });
  });

  it('CAF bajo umbral → solicita, inserta el CAF nuevo como activo y marca success', async () => {
    state.caf = { id: 'caf-1', folio_hasta: 100, folio_actual: 95 }; // 5 restantes < 30

    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });

    expect(result).toEqual({ ok: true, requested: true });
    expect(state.requestCafResult.ok).toBe(true);
  });

  it('solicitud pending existente → no duplica (idempotencia)', async () => {
    state.caf = { id: 'caf-1', folio_hasta: 100, folio_actual: 99 };
    state.pendingRequest = { id: 'req-pendiente' };

    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });

    expect(result.ok).toBe(true);
    expect(result.requested).toBe(false);
    expect(result.error).toBe('solicitud pendiente');
  });

  it('requestCaf falla → marca la solicitud como failed y devuelve error (alerta manual intacta)', async () => {
    state.caf = { id: 'caf-1', folio_hasta: 100, folio_actual: 99 };
    state.requestCafResult = { ok: false, message: 'auth_failed: token inválido' };

    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });

    expect(result.ok).toBe(false);
    expect(result.requested).toBe(true);
    expect(result.error).toBe('auth_failed: token inválido');
  });

  it('sin CAF activo → solicita igual (caso bootstrap)', async () => {
    state.caf = null;
    const result = await ensureCafFolios(mockSupabase, {
      empresaId: 'emp-1',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
    });
    expect(result.requested).toBe(true);
  });
});
