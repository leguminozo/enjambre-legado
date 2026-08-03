import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';
import { cleanupRateLimitMap } from '@/api/lib/rate-limit';

// ─── Estado del mock (compartido entre supabase y assertions) ───
const state = vi.hoisted(() => ({
  authUser: null as Record<string, unknown> | null,
  tables: {} as Record<
    string,
    {
      single?: unknown;
      maybeSingle?: unknown;
      insertError?: string | null;
      inserted?: unknown;
      insertId?: string;
    }
  >,
}));

function getTable(name: string) {
  if (!state.tables[name]) state.tables[name] = {};
  return state.tables[name]!;
}

// Builder encadenable: select/eq/in/limit/order devuelven q; los terminales
// (single/maybeSingle/insert/update/rpc) resuelven según el estado por tabla.
function makeQueryBuilder(table: string) {
  const t = getTable(table);
  const q: Record<string, unknown> = {
    select: () => q,
    eq: () => q,
    in: () => q,
    limit: () => q,
    order: () => q,
    maybeSingle: async () => ({ data: t.maybeSingle ?? null, error: null }),
    single: async () => ({ data: t.single ?? null, error: null }),
    // insert es encadenable (.insert().select().single()) Y thenable
    // (await insert() directo): devuelve el builder con un then que resuelve
    // la fila insertada.
    insert: (rows: unknown) => {
      t.inserted = rows;
      const data = {
        id: t.insertId ?? 'mock-id',
        ...(Array.isArray(rows) ? (rows[0] as object) : (rows as object)),
      };
      return Object.assign(q, {
        then: async (resolve: (v: { data: unknown; error: unknown }) => void) =>
          resolve(
            t.insertError
              ? { data: null, error: { message: t.insertError } }
              : { data, error: null },
          ),
      });
    },
    update: () => q,
    delete: () => q,
    rpc: async () => ({ data: null, error: null }),
  };
  // Await sobre la cadena (update().eq().eq()) resuelve sin error
  return Object.assign(q, {
    then: async (resolve: (v: { data: null; error: null }) => void) =>
      resolve({ data: null, error: null }),
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

vi.mock('@/api/lib/payments', () => ({
  getPaymentProvider: () => ({
    name: 'flow',
    init: async () => ({
      url: 'https://flow.cl/pago/mock',
      token: 'tok-one-shot',
      buyOrder: 'SUB-abc',
      sessionId: 'sess-1',
      provider: 'flow',
    }),
    commit: async () => ({
      authorized: true,
      buyOrder: 'SUB-abc',
      authorizationCode: '77',
      cardType: '',
      last4: '',
      raw: {},
    }),
    refund: async () => ({ ok: true }),
    createRecurring: async () => ({ url: 'https://flow.cl/inscripcion/x', token: 'tok-inscripcion' }),
    getRecurringStatus: async () => ({ status: 2, commerceOrder: 'SUB-abc', flowOrder: 77, amount: 19990 }),
    cancelRecurring: async () => ({ ok: true }),
  }),
  getPaymentProviderByName: () => ({
    name: 'flow',
    init: async () => ({ url: '', token: '', buyOrder: '', sessionId: '', provider: 'flow' }),
    commit: async () => ({ authorized: true, buyOrder: 'SUB-abc', authorizationCode: '77', raw: {} }),
    refund: async () => ({ ok: true }),
  }),
  saveCheckoutSession: vi.fn().mockResolvedValue(undefined),
  getCheckoutSession: vi.fn().mockResolvedValue(null),
  expireStaleCheckoutSessions: vi.fn().mockResolvedValue({ expired: 0, buyOrders: [] }),
}));

const PLAN = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Reposición Mensual',
  price_clp: 19990,
  frequency: 'monthly',
  active: true,
  included_items: [],
};

const SESSION = {
  buy_order: 'SUB-abc',
  session_id: 'sess-1',
  provider: 'flow',
  user_id: '11111111-1111-4111-8111-111111111111', // uuid válido (zod lo exige)
  plan_id: '11111111-1111-4111-8111-111111111111',
  total: 19990,
  delivery_address: null,
  recurring_token: 'tok-inscripcion',
  status: 'pending',
  created_at: '2026-08-01T00:00:00.000Z',
};

describe('subscriptions-checkout (seguridad y flujo)', () => {
  let requestSeq = 0;

  // Mismo patrón que checkout.test.ts: origin para CSRF + x-forwarded-for
  // único para no chocar con el rate limit in-memory
  function headers(extra: Record<string, string> = {}) {
    requestSeq += 1;
    return {
      'Content-Type': 'application/json',
      origin: 'http://localhost:3000',
      'x-forwarded-for': `10.99.0.${requestSeq}`,
      ...extra,
    };
  }

  beforeEach(() => {
    cleanupRateLimitMap();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role');
    state.authUser = { id: '11111111-1111-4111-8111-111111111111', email: 'cliente@test.cl' };
    state.tables = {};
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('init sin token → 401 (validador global zero-trust)', async () => {
    const res = await app.request('/api/subscriptions/checkout/init', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ planId: '11111111-1111-4111-8111-111111111111' }),
    });
    expect(res.status).toBe(401);
  });

  it('init crea inscripción recurrente y guarda la sesión con recurring_token', async () => {
    getTable('subscription_plans').single = PLAN;
    getTable('subscriptions').maybeSingle = null; // sin sub activa

    const res = await app.request('/api/subscriptions/checkout/init', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ planId: '11111111-1111-4111-8111-111111111111' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recurring).toBe(true);
    expect(json.token).toBe('tok-inscripcion');
    expect(json.buyOrder).toMatch(/^SUB-/);

    // La sesión persistida incluye el token de la inscripción (lo usará el fulfill)
    const inserted = getTable('subscription_checkout_sessions').inserted as Record<string, unknown>;
    expect(inserted?.recurring_token).toBe('tok-inscripcion');
    expect(inserted?.provider).toBe('flow');
  });

  it('init rechaza 409 si ya hay sub activa', async () => {
    getTable('subscription_plans').single = PLAN;
    getTable('subscriptions').maybeSingle = { id: 'sub-existente' };

    const res = await app.request('/api/subscriptions/checkout/init', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ planId: '11111111-1111-4111-8111-111111111111' }),
    });
    expect(res.status).toBe(409);
  });

  it('init rechaza 404 si el plan no existe o está inactivo', async () => {
    getTable('subscription_plans').single = null;
    const res = await app.request('/api/subscriptions/checkout/init', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ planId: '11111111-1111-4111-8111-111111111111' }),
    });
    expect(res.status).toBe(404);
  });

  it('commit feliz: activa la sub, agenda entrega y completa la sesión', async () => {
    getTable('subscription_checkout_sessions').single = SESSION;
    getTable('subscription_checkout_sessions').maybeSingle = null; // no completada aún
    getTable('subscription_plans').single = PLAN;
    getTable('subscriptions').maybeSingle = null; // sin sub activa ni past_due
    getTable('subscriptions').single = { id: 'sub-nueva' }; // resultado del insert
    getTable('subscriptions').insertId = 'sub-nueva';

    const res = await app.request('/api/subscriptions/checkout/commit', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ token_ws: 'tok-pago', buyOrder: 'SUB-abc' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.authorized).toBe(true);
    expect(json.subscriptionId).toBe('sub-nueva');
    expect(json.alreadyProcessed).toBe(false);

    // Primera entrega al FINAL del período (no el día de compra)
    const delivery = getTable('subscription_deliveries').inserted as Record<string, unknown>;
    expect(delivery?.period_number).toBe(1);
    expect(delivery?.status).toBe('scheduled');
    const scheduledFor = new Date(delivery?.scheduled_for as string).getTime();
    const inOneMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(scheduledFor).toBeGreaterThan(inOneMonth - 2 * 24 * 60 * 60 * 1000);

    // La sub guarda los tokens de la inscripción para el webhook recurrente
    const subInserted = getTable('subscriptions').inserted as Record<string, unknown>;
    expect(subInserted?.flow_inscription_token).toBe('tok-inscripcion');
    expect(subInserted?.flow_inscription_buy_order).toBe('SUB-abc');
  });

  it('commit rechaza mismatch de buyOrder (bug #5: confiaba en el cliente)', async () => {
    const res = await app.request('/api/subscriptions/checkout/commit', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ token_ws: 'tok-pago', buyOrder: 'SUB-OTRO-ORDER' }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('buy_order_mismatch');
  });

  it('commit rechaza 403 si la sesión no pertenece al usuario (bug #4: ownership)', async () => {
    getTable('subscription_checkout_sessions').single = SESSION;
    state.authUser = { id: 'u2-OTRO', email: 'otro@test.cl' }; // sesión es de u1

    const res = await app.request('/api/subscriptions/checkout/commit', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ token_ws: 'tok-pago' }),
    });
    expect(res.status).toBe(403);
  });

  it('doble commit → alreadyProcessed en vez de "sesión expirada" (bug #3: resultado roto)', async () => {
    getTable('subscription_checkout_sessions').single = null; // ya no hay pending
    getTable('subscriptions').maybeSingle = { id: 'sub-existente' }; // sub ya creada

    const res = await app.request('/api/subscriptions/checkout/commit', {
      method: 'POST',
      headers: headers({ Authorization: 'Bearer tok-test' }),
      body: JSON.stringify({ token_ws: 'tok-pago', buyOrder: 'SUB-abc' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.alreadyProcessed).toBe(true);
    expect(json.subscriptionId).toBe('sub-existente');
  });
});
