import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { AppVariables } from '@/api/lib/middleware';
import { boletaDownloadRoutes } from '../boleta-download';

type DteRow = { col: 'venta_id' | 'idempotency_key'; val: string; xml: string | null };

function makeSupabase(opts: { ventaId?: string | null; dteRows?: DteRow[] }) {
  const queried: DteRow['col'][] = [];
  const supabase = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => {
            if (table === 'ventas') {
              return { data: opts.ventaId ? { id: opts.ventaId } : null, error: null };
            }
            queried.push(col as DteRow['col']);
            const row = (opts.dteRows ?? []).find((r) => r.col === col && r.val === val);
            return { data: row ? { sii_xml: row.xml } : null, error: null };
          },
        }),
      }),
    }),
  } as unknown as AppVariables['supabase'];
  return { supabase, queried };
}

function makeApp(supabase: AppVariables['supabase']) {
  const app = new Hono<{ Variables: Pick<AppVariables, 'supabase'> }>();
  app.use('*', async (c, next) => {
    c.set('supabase', supabase);
    await next();
  });
  app.route('/', boletaDownloadRoutes);
  return app;
}

describe('GET /boletas/:buyOrder/xml', () => {
  it('cae al fallback legacy cuando la fila por venta_id aún no tiene XML', async () => {
    const { supabase, queried } = makeSupabase({
      ventaId: 'v-1',
      dteRows: [
        { col: 'venta_id', val: 'v-1', xml: null },
        { col: 'idempotency_key', val: 'venta:v-1', xml: '<DTE>legacy</DTE>' },
      ],
    });

    const res = await makeApp(supabase).request('/OYZ-1/xml');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xml');
    expect(await res.text()).toBe('<DTE>legacy</DTE>');
    expect(queried).toEqual(['venta_id', 'idempotency_key']);
  });

  it('devuelve el XML de la fila por venta_id sin consultar legacy', async () => {
    const { supabase, queried } = makeSupabase({
      ventaId: 'v-1',
      dteRows: [{ col: 'venta_id', val: 'v-1', xml: '<DTE>nuevo</DTE>' }],
    });

    const res = await makeApp(supabase).request('/OYZ-1/xml');

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<DTE>nuevo</DTE>');
    expect(queried).toEqual(['venta_id']);
  });

  it('404 cuando la venta no existe', async () => {
    const { supabase } = makeSupabase({ ventaId: null });
    const res = await makeApp(supabase).request('/OYZ-404/xml');
    expect(res.status).toBe(404);
  });

  it('404 cuando ninguna fila tiene XML', async () => {
    const { supabase } = makeSupabase({
      ventaId: 'v-2',
      dteRows: [
        { col: 'venta_id', val: 'v-2', xml: null },
        { col: 'idempotency_key', val: 'venta:v-2', xml: null },
      ],
    });

    const res = await makeApp(supabase).request('/OYZ-2/xml');
    expect(res.status).toBe(404);
  });
});
