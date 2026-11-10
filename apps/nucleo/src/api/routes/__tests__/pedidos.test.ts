import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVentas = vi.hoisted(() => [
  {
    id: 'v-100',
    buy_order: 'ORD-TEST-PEDIDO-1',
    created_at: new Date().toISOString(),
    total: 47080,
    estado: 'paid',
    metodo_pago: 'flow',
    auth_code: '187796493',
    productos: [{ quantity: 2, name: 'Miel de Ulmo 500g', unitPrice: 23540, productId: 'prod-1' }],
    buyer_email: 'mara.angelini@gmail.com',
    direccion_envio: {
      nombre: 'Mara Angelini',
      telefono: '+56912345678',
      direccion: 'Av. El Bosque 123',
      comuna: 'Providencia',
      ciudad: 'Santiago',
      region: 'Metropolitana',
    },
    retorno_frascos_declarados: 2,
    retorno_frascos_estado: 'pendiente_retiro',
    cliente_id: 'cli-1',
    channel: 'web',
    origen: 'web',
  },
]);

const mockEnvios = vi.hoisted(() => [
  {
    id: 'env-100',
    venta_id: 'v-100',
    tracking_code: 'OYZ-PEDIDO-1',
    status: 'pendiente',
    via: 'Blue Express',
    courier_code: 'blueexpress',
    courier_tracking_url: 'https://bluex.cl/tracking/OYZ-PEDIDO-1',
    destino: 'Av. El Bosque 123, Providencia',
    items: '2x Miel de Ulmo 500g',
    created_at: new Date().toISOString(),
    eta: null,
  },
]);

const mockFacturas = vi.hoisted(() => [
  {
    id: 'fac-100',
    venta_id: 'v-100',
    numero: 'FLOW-ORD-TEST-PEDIDO-1',
    tipo_documento: 'Boleta',
    tipo_dte: 39,
    estado: 'pagada',
    estado_sii: 'aceptado',
    monto_total: 47080,
  },
]);

const mockSessions = vi.hoisted(() => [
  {
    id: 'sess-row-1',
    buy_order: 'ORD-PENDING-UNRECONCILED',
    session_id: 'sess-abc',
    provider: 'flow',
    total: 35000,
    shipping: {
      nombre: 'Cliente Desconectado',
      email: 'desconectado@test.cl',
      telefono: '+56999999999',
      direccion: 'Pasaje Los Alerces 4',
      comuna: 'Castro',
      ciudad: 'Castro',
      region: 'Los Lagos',
    },
    cart: [{ quantity: 1, name: 'Miel Tiaca 1kg', unitPrice: 35000 }],
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]);

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.insert = vi.fn(ret);
  chain.update = vi.fn(ret);
  chain.delete = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.not = vi.fn(ret);
  chain.in = vi.fn(ret);
  chain.or = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.limit = vi.fn(ret);
  chain.single = vi.fn(async () => finalValue);
  chain.maybeSingle = vi.fn(async () => finalValue);
  return chain;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    const authHeader = options?.global?.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return {
      auth: {
        getUser: async () => {
          if (token === 'admin-token') {
            return {
              data: {
                user: {
                  id: 'admin-pedidos-1',
                  email: 'admin@test.cl',
                  app_metadata: { role: 'admin' },
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        },
      },
      from: (table: string) => {
        if (table === 'profiles') {
          return makeChain({ data: { role: 'admin' }, error: null });
        }
        return makeChain({ data: null, error: null });
      },
    };
  },
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'ventas') {
        return {
          select: () => ({
            or: () => ({
              order: () => ({
                limit: async () => ({ data: mockVentas, error: null }),
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({ data: mockVentas[0], error: null }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      if (table === 'logistica_envios') {
        return {
          select: () => ({
            in: async () => ({ data: mockEnvios, error: null }),
            eq: () => ({
              maybeSingle: async () => ({ data: mockEnvios[0], error: null }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'new-envio-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'facturas_emitidas') {
        return {
          select: () => ({
            in: async () => ({ data: mockFacturas, error: null }),
            eq: () => ({
              maybeSingle: async () => ({ data: mockFacturas[0], error: null }),
            }),
          }),
        };
      }
      if (table === 'checkout_sessions') {
        return {
          select: () => ({
            in: () => ({
              order: () => ({
                limit: async () => ({ data: mockSessions, error: null }),
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({ data: mockSessions[0], error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      };
    },
  }),
}));

vi.mock('@/api/lib/payments/settle-checkout', () => ({
  settleCheckout: vi.fn().mockResolvedValue({
    ok: true,
    ventaId: 'v-newly-settled',
    alreadyProcessed: false,
  }),
}));

vi.mock('@/api/lib/payments/types', () => ({
  getCheckoutSessionByBuyOrder: vi.fn().mockImplementation((buyOrder: string) => {
    if (buyOrder === 'ORD-PENDING-UNRECONCILED') {
      return Promise.resolve({
        buyOrder: 'ORD-PENDING-UNRECONCILED',
        sessionId: 'sess-abc',
        provider: 'flow',
        total: 35000,
        cart: [{ productId: 'p1', slug: 'tiaca', name: 'Miel Tiaca 1kg', unitPrice: 35000, quantity: 1 }],
        shipping: {
          nombre: 'Cliente Desconectado',
          email: 'desconectado@test.cl',
          telefono: '+56999999999',
          direccion: 'Pasaje Los Alerces 4',
          comuna: 'Castro',
          ciudad: 'Castro',
          region: 'Los Lagos',
        },
      });
    }
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/notifications/enqueue-transactional', () => ({
  notifyShipmentDispatched: vi.fn().mockResolvedValue({ skipped: false, emailQueued: true }),
}));

import { app } from '../../app';

const authHeaders = {
  Authorization: 'Bearer admin-token',
  'Content-Type': 'application/json',
  origin: 'http://localhost:3000',
  'x-empresa-id': 'emp-1',
};

describe('pedidos API routes', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    vi.clearAllMocks();
  });

  it('GET /api/pedidos returns consolidated orders and stats', async () => {
    const res = await app.request('/api/pedidos', {
      method: 'GET',
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.pedidos).toHaveLength(1);
    expect(body.data.pedidos[0].buyOrder).toBe('ORD-TEST-PEDIDO-1');
    expect(body.data.pedidos[0].retornoFrascos.declarados).toBe(2);
    expect(body.data.pedidos[0].tributario.estadoSii).toBe('aceptado');
    expect(body.data.porConciliar).toHaveLength(1);
    expect(body.data.porConciliar[0].buyOrder).toBe('ORD-PENDING-UNRECONCILED');
    expect(body.data.stats.total).toBe(1);
    expect(body.data.stats.porConciliar).toBe(1);
  });

  it('POST /api/pedidos/:buyOrder/conciliar triggers settleCheckout', async () => {
    const res = await app.request('/api/pedidos/ORD-PENDING-UNRECONCILED/conciliar', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        flowOrder: 187796493,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ventaId).toBe('v-newly-settled');
  });

  it('PATCH /api/pedidos/:buyOrder/despacho updates status and notifies client when en_transito', async () => {
    const res = await app.request('/api/pedidos/ORD-TEST-PEDIDO-1/despacho', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'en_transito',
        courier_code: 'chilexpress',
        tracking_code: 'CHX-998877',
        notificarCliente: true,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.trackingCode).toBe('CHX-998877');
  });

  it('PATCH /api/pedidos/:buyOrder/retorno-frascos updates circular return status', async () => {
    const res = await app.request('/api/pedidos/ORD-TEST-PEDIDO-1/retorno-frascos', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'recibido_conforme',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('recibido_conforme');
  });
});
