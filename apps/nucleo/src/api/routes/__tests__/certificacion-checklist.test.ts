import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { certificacionRoutes } from '../sii/certificacion';

function makeEqEqChain(result: unknown) {
  const terminalEq = vi.fn().mockResolvedValue(result);
  const midEq = vi.fn().mockReturnValue({ eq: terminalEq });
  return {
    select: vi.fn().mockReturnValue({ eq: midEq }),
  };
}

function makeFacturasEmitidasChain(result: unknown) {
  const inFn = vi.fn().mockResolvedValue(result);
  const eqEstado = vi.fn().mockReturnValue({ in: inFn });
  const eqEmpresa = vi.fn().mockReturnValue({ eq: eqEstado });
  return {
    select: vi.fn().mockReturnValue({ eq: eqEmpresa }),
  };
}

function makeJobsOpenChain(result: unknown) {
  const inFn = vi.fn().mockResolvedValue(result);
  const eqEmpresa = vi.fn().mockReturnValue({ in: inFn });
  return {
    select: vi.fn().mockReturnValue({ eq: eqEmpresa }),
  };
}

describe('GET /certificacion/checklist', () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalSiiKey = process.env.SII_CLAVE_ENCRYPTION_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'x'.repeat(32);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
    if (originalSiiKey === undefined) delete process.env.SII_CLAVE_ENCRYPTION_KEY;
    else process.env.SII_CLAVE_ENCRYPTION_KEY = originalSiiKey;
    if (originalService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
  });

  it('reporta listoCertificacion sin exigir ambiente producción', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sii_caf') {
          return makeEqEqChain({
            data: [
              { id: 'caf-39', tipo_dte: 39, folio_actual: 10, folio_hasta: 100, activo: true },
              { id: 'caf-33', tipo_dte: 33, folio_actual: 1, folio_hasta: 50, activo: true },
              { id: 'caf-46', tipo_dte: 46, folio_actual: 10, folio_hasta: 100, activo: true },
            ],
          });
        }
        if (table === 'sii_certificados') {
          const maybeSingle = vi.fn().mockResolvedValue({
            data: {
              id: 'cert-1',
              vigencia_fin: '2027-12-31',
              activo: true,
            },
          });
          const eq2 = vi.fn().mockReturnValue({ maybeSingle });
          const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
          return {
            select: vi.fn().mockReturnValue({ eq: eq1 }),
          };
        }
        if (table === 'facturas_compra') {
          return makeEqEqChain({ count: 2 });
        }
        if (table === 'facturas_emitidas') {
          return makeFacturasEmitidasChain({ count: 1 });
        }
        if (table === 'sii_document_jobs') {
          return makeJobsOpenChain({ count: 0 });
        }
        if (table === 'empresas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    sii_ambiente: 'certificacion',
                    sii_clave_encriptada: 'enc:blob',
                  },
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const app = new Hono<{ Variables: { empresaId: string; supabase: any } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase);
      await next();
    });
    app.route('/certificacion', certificacionRoutes);

    const res = await app.request('/certificacion/checklist');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.listoCertificacion).toBe(true);
    expect(json.data.listoProduccion).toBe(false);
    expect(json.data.certCriticosPendientes).toBe(0);
    expect(json.data.criticosPendientes).toBeGreaterThan(0);
    expect(json.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'caf-39', cumplido: true }),
        expect.objectContaining({ id: 'caf-33', cumplido: true }),
        expect.objectContaining({ id: 'caf-46', cumplido: true }),
        expect.objectContaining({ id: 'cert-p12', cumplido: true }),
        expect.objectContaining({ id: 'clave-sii', cumplido: true }),
        expect.objectContaining({ id: 'encryption-key', cumplido: true }),
        expect.objectContaining({ id: 'dte-venta-aceptada', cumplido: true }),
        expect.objectContaining({ id: 'fc-aceptada', cumplido: true }),
        expect.objectContaining({ id: 'ambiente-prod', cumplido: false, fase: 'go-live' }),
      ]),
    );
  });

  it('marca listoProduccion solo con ambiente produccion y críticos en verde', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sii_caf') {
          return makeEqEqChain({
            data: [
              { id: 'caf-39', tipo_dte: 39, folio_actual: 10, folio_hasta: 100, activo: true },
              { id: 'caf-33', tipo_dte: 33, folio_actual: 1, folio_hasta: 50, activo: true },
              { id: 'caf-46', tipo_dte: 46, folio_actual: 10, folio_hasta: 100, activo: true },
            ],
          });
        }
        if (table === 'sii_certificados') {
          const maybeSingle = vi.fn().mockResolvedValue({
            data: { id: 'cert-1', vigencia_fin: '2027-12-31', activo: true },
          });
          const eq2 = vi.fn().mockReturnValue({ maybeSingle });
          const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
          return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
        }
        if (table === 'facturas_compra') return makeEqEqChain({ count: 1 });
        if (table === 'facturas_emitidas') return makeFacturasEmitidasChain({ count: 1 });
        if (table === 'sii_document_jobs') return makeJobsOpenChain({ count: 0 });
        if (table === 'empresas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { sii_ambiente: 'produccion', sii_clave_encriptada: 'enc' },
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;

    const app = new Hono<{ Variables: { empresaId: string; supabase: any } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase);
      await next();
    });
    app.route('/certificacion', certificacionRoutes);

    const res = await app.request('/certificacion/checklist');
    const json = await res.json();
    expect(json.data.listoCertificacion).toBe(true);
    expect(json.data.listoProduccion).toBe(true);
    expect(json.data.criticosPendientes).toBe(0);
  });
});
