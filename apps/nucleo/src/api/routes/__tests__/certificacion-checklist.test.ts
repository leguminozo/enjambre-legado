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

describe('GET /certificacion/checklist', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  it('reporta items críticos y estado listoProduccion', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sii_caf') {
          return makeEqEqChain({
            data: [
              {
                id: 'caf-46',
                tipo_dte: 46,
                folio_actual: 10,
                folio_hasta: 100,
                activo: true,
              },
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
        if (table === 'empresas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { sii_ambiente: 'certificacion' },
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
    expect(json.data.listoProduccion).toBe(false);
    expect(json.data.criticosPendientes).toBeGreaterThan(0);
    expect(json.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'caf-46', cumplido: true }),
        expect.objectContaining({ id: 'cert-p12', cumplido: true }),
        expect.objectContaining({ id: 'fc-aceptada', cumplido: true }),
        expect.objectContaining({ id: 'ambiente-prod', cumplido: false }),
      ]),
    );
  });
});