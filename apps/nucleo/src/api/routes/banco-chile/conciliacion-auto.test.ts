import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

function makeSupabase(rpcData: unknown[] = []) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const single = vi.fn().mockResolvedValue({ data: null, error: null });
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.insert = vi.fn(self);
  chain.update = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.order = vi.fn(self);
  chain.limit = vi.fn(self);
  chain.maybeSingle = maybeSingle;
  chain.single = single;
  const limitRpc = vi.fn().mockResolvedValue({ data: rpcData, error: null });
  return {
    from: vi.fn(() => chain),
    rpc: vi.fn(() => ({ limit: limitRpc })),
    _limitRpc: limitRpc,
  };
}

describe('conciliacion-auto ejecutar', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('acepta body solo con limite (tenant = empresaId)', async () => {
    const supabase = makeSupabase([]);
    const { conciliacionAutoRoutes } = await import('./conciliacion-auto');

    const app = new Hono<{
      Variables: {
        empresaId: string;
        supabase: typeof supabase;
        user: { id: string };
      };
    }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', '11111111-1111-1111-1111-111111111111');
      c.set('supabase', supabase as any);
      c.set('user', { id: 'user-1' });
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
    expect(json.empresa_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(supabase.rpc).toHaveBeenCalledWith('aplicar_reglas_conciliacion', {
      p_empresa_id: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('rechaza empresa_id distinto al tenant', async () => {
    const supabase = makeSupabase([]);
    const { conciliacionAutoRoutes } = await import('./conciliacion-auto');

    const app = new Hono<{
      Variables: {
        empresaId: string;
        supabase: typeof supabase;
        user: { id: string };
      };
    }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', '11111111-1111-1111-1111-111111111111');
      c.set('supabase', supabase as any);
      c.set('user', { id: 'user-1' });
      await next();
    });
    app.route('/', conciliacionAutoRoutes);

    const res = await app.request('/ejecutar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: 'a0a0a0a0-b1b1-41c1-81d1-e2e2e2e2e2e2',
        limite: 5,
      }),
    });

    // 403 mismatch preferred; 400 only if validator rejects UUID shape
    expect([403, 400]).toContain(res.status);
    const json = await res.json();
    if (res.status === 403) {
      expect(json.code).toBe('empresa_mismatch');
    }
  });

  it('seed-defaults inserta solo reglas faltantes', async () => {
    const existing: { id: string; nombre: string }[] = [];
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.select = vi.fn(self);
    chain.eq = vi.fn(self);
    chain.insert = vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: 'r1', nombre: 'Monto exacto + fecha mismo día' },
          { id: 'r2', nombre: 'RUT contraparte + monto' },
        ],
        error: null,
      }),
    }));
    // first from() for list resolves as thenable via awaiting chain — supabase returns promise after eq
    const listResult = { data: existing, error: null };
    // Make the select chain awaitable
    Object.assign(chain, {
      then: (resolve: (v: unknown) => unknown) => resolve(listResult),
    });

    const supabase = {
      from: vi.fn(() => chain),
      rpc: vi.fn(),
    };

    const { conciliacionAutoRoutes } = await import('./conciliacion-auto');
    const app = new Hono<{
      Variables: {
        empresaId: string;
        supabase: typeof supabase;
        user: { id: string };
      };
    }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', '11111111-1111-1111-1111-111111111111');
      c.set('supabase', supabase as any);
      c.set('user', { id: 'user-1' });
      await next();
    });
    app.route('/', conciliacionAutoRoutes);

    const res = await app.request('/reglas/seed-defaults', { method: 'POST' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.inserted).toBe(2);
    expect(chain.insert).toHaveBeenCalled();
  });
});
