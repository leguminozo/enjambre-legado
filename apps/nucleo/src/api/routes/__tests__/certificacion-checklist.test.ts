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

function makeDeadLetterChain(result: unknown) {
  const eqStatus = vi.fn().mockResolvedValue(result);
  const eqEmpresa = vi.fn().mockReturnValue({ eq: eqStatus });
  return {
    select: vi.fn().mockReturnValue({ eq: eqEmpresa }),
  };
}

const validEmpresa = {
  sii_ambiente: 'certificacion',
  sii_clave_encriptada: 'enc:blob',
  rut: '76.123.456-0', // may fail DV — use known valid
  razon_social: 'OYZ SpA',
  giro: 'Miel',
  direccion: 'Calle 1',
  comuna: 'Santiago',
  acteco: '731000',
};

// Valid Chilean RUT with correct DV for tests
// 11111111-1 is commonly used as valid test RUT (1*3+1*2+... classic 11-1 works)
const VALID_RUT = '11.111.111-1';

describe('GET /certificacion/checklist', () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalSiiKey = process.env.SII_CLAVE_ENCRYPTION_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalP12 = process.env.SII_P12_BASE64;
  const originalP12Pass = process.env.SII_P12_PASSWORD;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    process.env.SII_CLAVE_ENCRYPTION_KEY = 'x'.repeat(32);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SII_P12_BASE64;
    delete process.env.SII_P12_PASSWORD;
  });

  afterEach(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
    if (originalSiiKey === undefined) delete process.env.SII_CLAVE_ENCRYPTION_KEY;
    else process.env.SII_CLAVE_ENCRYPTION_KEY = originalSiiKey;
    if (originalService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
    if (originalP12 === undefined) delete process.env.SII_P12_BASE64;
    else process.env.SII_P12_BASE64 = originalP12;
    if (originalP12Pass === undefined) delete process.env.SII_P12_PASSWORD;
    else process.env.SII_P12_PASSWORD = originalP12Pass;
  });

  function mockSupabase(opts: {
    ambiente?: string;
    empresa?: Partial<typeof validEmpresa>;
    cert?: Record<string, unknown> | null;
  }) {
    const empresa = {
      ...validEmpresa,
      rut: VALID_RUT,
      sii_ambiente: opts.ambiente ?? 'certificacion',
      ...opts.empresa,
    };
    const cert =
      opts.cert === null
        ? null
        : {
            id: 'cert-1',
            vigencia_fin: '2027-12-31',
            activo: true,
            p12_password_encriptada: 'enc:pass',
            storage_path: 'emp/cert.p12',
            ...opts.cert,
          };

    let jobsCall = 0;
    return {
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
          const maybeSingle = vi.fn().mockResolvedValue({ data: cert });
          const eq2 = vi.fn().mockReturnValue({ maybeSingle });
          const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
          return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
        }
        if (table === 'facturas_compra') {
          return makeEqEqChain({ count: 2 });
        }
        if (table === 'facturas_emitidas') {
          return makeFacturasEmitidasChain({ count: 1 });
        }
        if (table === 'sii_document_jobs') {
          jobsCall += 1;
          // first call: open jobs with .in(), second: dead_letter with .eq status
          if (jobsCall === 1) return makeJobsOpenChain({ count: 0 });
          return makeDeadLetterChain({ count: 0 });
        }
        if (table === 'empresas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: empresa }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as any;
  }

  async function requestChecklist(supabase: any) {
    const app = new Hono<{ Variables: { empresaId: string; supabase: any } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase);
      await next();
    });
    app.route('/certificacion', certificacionRoutes);
    return app.request('/certificacion/checklist');
  }

  it('reporta listoCertificacion sin exigir ambiente producción', async () => {
    const res = await requestChecklist(mockSupabase({}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.listoCertificacion).toBe(true);
    expect(json.data.listoProduccion).toBe(false);
    expect(json.data.certCriticosPendientes).toBe(0);
    expect(json.data.criticosPendientes).toBeGreaterThan(0);
    expect(json.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'emisor-identidad', cumplido: true }),
        expect.objectContaining({ id: 'caf-39', cumplido: true }),
        expect.objectContaining({ id: 'caf-33', cumplido: true }),
        expect.objectContaining({ id: 'caf-46', cumplido: true }),
        expect.objectContaining({ id: 'cert-p12', cumplido: true }),
        expect.objectContaining({ id: 'cert-credenciales', cumplido: true }),
        expect.objectContaining({ id: 'clave-sii', cumplido: true }),
        expect.objectContaining({ id: 'encryption-key', cumplido: true }),
        expect.objectContaining({ id: 'dte-venta-aceptada', cumplido: true }),
        expect.objectContaining({ id: 'fc-aceptada', cumplido: true }),
        expect.objectContaining({ id: 'ambiente-prod', cumplido: false, fase: 'go-live' }),
      ]),
    );
  });

  it('marca listoProduccion solo con ambiente produccion y críticos en verde', async () => {
    const res = await requestChecklist(mockSupabase({ ambiente: 'produccion' }));
    const json = await res.json();
    expect(json.data.listoCertificacion).toBe(true);
    expect(json.data.listoProduccion).toBe(true);
    expect(json.data.criticosPendientes).toBe(0);
  });

  it('falla certificación si falta identidad emisor o clave P12', async () => {
    const res = await requestChecklist(
      mockSupabase({
        empresa: { rut: '', razon_social: '', giro: '' },
        cert: {
          id: 'cert-1',
          vigencia_fin: '2027-12-31',
          activo: true,
          p12_password_encriptada: null,
          storage_path: 'emp/cert.p12',
        },
      }),
    );
    const json = await res.json();
    expect(json.data.listoCertificacion).toBe(false);
    expect(json.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'emisor-identidad', cumplido: false }),
        expect.objectContaining({ id: 'cert-credenciales', cumplido: false }),
      ]),
    );
  });
});
