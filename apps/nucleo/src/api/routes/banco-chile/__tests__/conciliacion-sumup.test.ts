import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn(self);
  chain.delete = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.in = vi.fn(self);
  chain.or = vi.fn(self);
  chain.order = vi.fn(self);
  chain.limit = vi.fn().mockResolvedValue(finalValue);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  chain.then = (onfulfilled: (v: typeof finalValue) => unknown) =>
    Promise.resolve(finalValue).then(onfulfilled);
  return chain;
}

describe('Triangulación 5: Conciliación de Feria SumUp con Cierres de Caja', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('detecta abono bancario SUMUP y genera propuesta para sesión de caja cerrada', async () => {
    const empresaId = '11111111-1111-1111-1111-111111111111';
    const movId = '22222222-2222-2222-2222-222222222222';
    const sesionId = '33333333-3333-3333-3333-333333333333';

    // Total tarjetas $100.000 -> neto estimado SumUp Chile: $100.000 * (1 - 0.03451) = $96.549
    const mockMontoBanco = 96549;

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'banco_chile_movimientos') {
        return makeChain({
          data: [
            {
              id: movId,
              fecha_contable: '2026-09-15',
              monto: mockMontoBanco,
              descripcion: 'ABONO LIQUIDACION SUMUP CHILE POS',
              cuenta_id: 'cta-1',
              numero_operacion: 'OP-SUMUP-99',
            },
          ],
          error: null,
        });
      }
      if (table === 'cash_sessions') {
        return makeChain({
          data: [
            {
              id: sesionId,
              rep_id: 'rep-1',
              opened_at: '2026-09-14T09:00:00Z',
              closed_at: '2026-09-14T19:00:00Z',
              closing_cash: 50000,
              session_status: 'closed',
            },
          ],
          error: null,
        });
      }
      if (table === 'ventas') {
        return makeChain({
          data: [
            { id: 'v-1', total: 60000, metodo_pago: 'tarjeta' },
            { id: 'v-2', total: 40000, metodo_pago: 'sumup' },
          ],
          error: null,
        });
      }
      return makeChain({ data: [], error: null });
    });

    const supabase = {
      from: mockFrom,
      rpc: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    };

    const { conciliacionAutoRoutes } = await import('../conciliacion-auto');
    const app = new Hono<{
      Variables: { empresaId: string; supabase: typeof supabase; user: { id: string } };
    }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', empresaId);
      c.set('supabase', supabase as any);
      c.set('user', { id: 'user-admin' });
      await next();
    });
    app.route('/', conciliacionAutoRoutes);

    const res = await app.request('/ejecutar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limite: 10 }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.total_propuestas).toBe(1);
    expect(json.propuestas[0].tipo_entidad).toBe('cash_session');
    expect(json.propuestas[0].entidad_id).toBe(sesionId);
    expect(json.propuestas[0].confianza).toBeGreaterThanOrEqual(90);
    expect(json.propuestas[0].motivo).toContain('Liquidación SumUp');
  });

  it('al aceptar propuesta cash_session marca la sesión de caja como reconciled', async () => {
    const empresaId = '11111111-1111-4111-8111-111111111111';
    const movId = '22222222-2222-4222-8222-222222222222';
    const sesionId = '33333333-3333-4333-8333-333333333333';

    let cashSessionStatusUpdated: string | null = null;
    let bancoConciliadoUpdated: boolean | null = null;

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'banco_chile_movimientos') {
        const chain = makeChain({
          data: { id: movId, empresa_id: empresaId, conciliado: false, monto: 96549 },
          error: null,
        });
        chain.update = vi.fn().mockImplementation((payload: { conciliado: boolean }) => {
          bancoConciliadoUpdated = payload.conciliado;
          return chain;
        });
        return chain;
      }
      if (table === 'banco_chile_conciliaciones') {
        const chain = makeChain({
          data: { id: 'conc-1', movimiento_id: movId },
          error: null,
        });
        return chain;
      }
      if (table === 'cash_sessions') {
        const chain = makeChain({ data: null, error: null });
        chain.update = vi.fn().mockImplementation((payload: { session_status: string }) => {
          cashSessionStatusUpdated = payload.session_status;
          return chain;
        });
        return chain;
      }
      return makeChain({ data: null, error: null });
    });

    const supabase = { from: mockFrom };

    const { conciliacionAutoRoutes } = await import('../conciliacion-auto');
    const app = new Hono<{
      Variables: { empresaId: string; supabase: typeof supabase; user: { id: string } };
    }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', empresaId);
      c.set('supabase', supabase as any);
      c.set('user', { id: 'user-admin' });
      await next();
    });
    app.route('/', conciliacionAutoRoutes);

    const res = await app.request('/aceptar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propuesta_id: `sumup-${movId.slice(0, 8)}-${sesionId.slice(0, 8)}`,
        tipo_entidad: 'cash_session',
        entidad_id: sesionId,
        movimiento_id: movId,
        confianza: 95,
      }),
    });

    expect(res.status).toBe(200);
    expect(cashSessionStatusUpdated).toBe('reconciled');
    expect(bancoConciliadoUpdated).toBe(true);
  });
});
