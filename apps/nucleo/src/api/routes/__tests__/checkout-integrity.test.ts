import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';
import { cleanupRateLimitMap } from '@/api/lib/rate-limit';

const state = vi.hoisted(() => ({
  authUser: { id: 'admin-1', email: 'admin@test.cl' } as Record<string, unknown> | null,
  tables: {} as Record<string, { rows?: unknown[] }>,
}));

function getRows(table: string): unknown[] {
  return state.tables[table]?.rows ?? [];
}

// Builder solo-lectura con filtros básicos (eq/in/lt): el await final devuelve
// las rows de la tabla que cumplen todas las condiciones.
function makeQueryBuilder(table: string) {
  const filters: Array<(row: Record<string, unknown>) => boolean> = [];
  const q = {
    select: () => q,
    eq: (col: string, val: unknown) => {
      filters.push((row) => row[col] === val);
      return q;
    },
    in: (col: string, vals: unknown[]) => {
      filters.push((row) => vals.includes(row[col]));
      return q;
    },
    lt: (col: string, val: unknown) => {
      filters.push((row) => (row[col] as string) < (val as string));
      return q;
    },
    limit: () => q,
  };
  return Object.assign(q, {
    then: async (resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({
        data: getRows(table).filter((row) =>
          filters.every((f) => f(row as Record<string, unknown>)),
        ),
        error: null,
      }),
  });
}

const mockSupabase = vi.hoisted(() => ({
  auth: {
    getUser: async () =>
      state.authUser
        ? { data: { user: state.authUser }, error: null }
        : { data: { user: null }, error: { message: 'no session' } },
    getSession: async () => ({ data: { session: { access_token: 'tok-test' } }, error: null }),
  },
  from: (table: string) => makeQueryBuilder(table),
  rpc: async () => ({ data: null, error: null }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// La auth real del adminCheckout ya está cubierta por require-profile-role.test.ts;
// aquí aislar la lógica del endpoint de integridad (importOriginal preserva
// csrfMiddleware y el resto del módulo).
vi.mock('@/api/lib/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/lib/middleware')>();
  return {
    ...actual,
    authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set('supabase', mockSupabase);
      c.set('empresaId', 'emp-1');
      await next();
    },
    tenantMiddleware: async (_c: unknown, next: () => Promise<void>) => next(),
    requireProfileRole: () => async (_c: unknown, next: () => Promise<void>) => next(),
  };
});

const ORD_1 = 'ORD-11111111-1111-4111-8111-111111111111';
const ORD_2 = 'ORD-22222222-2222-4222-8222-222222222222';
const ORD_3 = 'ORD-33333333-3333-4333-8333-333333333333';

function integrityHeaders() {
  return { origin: 'http://localhost:3000', 'x-forwarded-for': '10.99.77.1' };
}

describe('GET /api/checkout/admin/integrity (movimiento 1: ciclo del dinero)', () => {
  beforeEach(() => {
    cleanupRateLimitMap();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role');
    state.tables = {};
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('todo consistente → cero brechas', async () => {
    state.tables.checkout_sessions = {
      rows: [
        { buy_order: ORD_1, total: 10000, provider: 'flow', created_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-01T00:01:00Z' },
        { buy_order: ORD_2, total: 5000, provider: 'flow', created_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-01T00:01:00Z' },
      ],
    };
    state.tables.ventas = { rows: [{ buy_order: ORD_1 }, { buy_order: ORD_2 }] };

    const res = await app.request('/api/checkout/admin/integrity', {
      method: 'GET',
      headers: integrityHeaders(),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.sessionsSinVenta).toEqual([]);
    expect(json.data.stalePending).toEqual([]);
    expect(json.data.ventasSinSesionCompletada).toEqual([]);
    expect(json.data.totales.sesionesCompletadasSinVenta).toBe(0);
    expect(json.data.totales.ventasWebSinSesion).toBe(0);
  });

  it('sesión completed sin venta → dinero potencialmente perdido detectado', async () => {
    state.tables.checkout_sessions = {
      rows: [
        { buy_order: ORD_1, total: 19990, provider: 'flow', status: 'completed', created_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-01T00:01:00Z' },
      ],
    };
    state.tables.ventas = { rows: [] };

    const res = await app.request('/api/checkout/admin/integrity', { headers: integrityHeaders() });
    const json = await res.json();
    expect(json.data.sessionsSinVenta).toHaveLength(1);
    expect(json.data.sessionsSinVenta[0].buyOrder).toBe(ORD_1);
    expect(json.data.sessionsSinVenta[0].total).toBe(19990);
  });

  it('sesiones pending antiguas → webhook posiblemente perdido', async () => {
    state.tables.checkout_sessions = {
      rows: [
        { buy_order: ORD_1, total: 9990, status: 'pending', created_at: '2026-07-01T00:00:00Z' },
      ],
    };
    state.tables.ventas = { rows: [] };

    const res = await app.request('/api/checkout/admin/integrity', { headers: integrityHeaders() });
    const json = await res.json();
    expect(json.data.stalePending).toHaveLength(1);
    expect(json.data.stalePending[0].buyOrder).toBe(ORD_1);
  });

  it('venta web sin sesión completed → anomalía detectada', async () => {
    state.tables.checkout_sessions = { rows: [] };
    state.tables.ventas = {
      rows: [
        { id: 'v-1', buy_order: ORD_3, total: 7000, origen: 'web', created_at: '2026-08-01T00:00:00Z' },
      ],
    };

    const res = await app.request('/api/checkout/admin/integrity', { headers: integrityHeaders() });
    const json = await res.json();
    expect(json.data.ventasSinSesionCompletada).toHaveLength(1);
    expect(json.data.ventasSinSesionCompletada[0].ventaId).toBe('v-1');
    expect(json.data.ventasSinSesionCompletada[0].buyOrder).toBe(ORD_3);
  });

  it('mezcla: detecta cada brecha con sus totales', async () => {
    state.tables.checkout_sessions = {
      rows: [
        { buy_order: ORD_1, total: 10000, status: 'completed', created_at: '2026-08-01T00:00:00Z', completed_at: '2026-08-01T00:01:00Z' }, // sin venta
        { buy_order: ORD_2, total: 5000, status: 'pending', created_at: '2026-07-15T00:00:00Z' }, // pending stale
      ],
    };
    state.tables.ventas = { rows: [{ id: 'v-9', buy_order: ORD_3, total: 8000, origen: 'web' }] };

    const res = await app.request('/api/checkout/admin/integrity', { headers: integrityHeaders() });
    const json = await res.json();
    const totals = json.data.totales;
    expect(totals.sesionesCompletadas).toBe(1);
    expect(totals.sesionesCompletadasSinVenta).toBe(1);
    expect(totals.pendingStale).toBe(1);
    expect(totals.ventasWeb).toBe(1);
    expect(totals.ventasWebSinSesion).toBe(1);
  });
});
