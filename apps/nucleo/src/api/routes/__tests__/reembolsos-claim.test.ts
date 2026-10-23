import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app';
import { cleanupRateLimitMap } from '@/api/lib/rate-limit';

const state = vi.hoisted(() => ({
  claimResult: { data: null, error: null } as { data: unknown; error: unknown },
  reembolsoRow: {} as Record<string, unknown>,
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'ventas') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          limit: () => ({ maybeSingle: async () => ({ data: { id: 'emp-1' }, error: null }) }),
        }),
        insert: () => ({
          select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    },
  }),
}));

vi.mock('@/api/lib/payments/provider', () => ({
  getPaymentProviderByName: vi.fn(),
}));

vi.mock('@/lib/notifications/enqueue-transactional', () => ({
  enqueueTransactionalNotification: vi.fn().mockResolvedValue(undefined),
}));

const supabaseMock = vi.hoisted(() => ({
  from: (table: string) => {
    if (table === 'reembolsos') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: state.reembolsoRow, error: null }),
          }),
        }),
        update: () => {
          const chain = {
            eq: () => chain,
            neq: () => chain,
            select: () => ({
              maybeSingle: async () => state.claimResult,
              single: async () => ({
                data: { ...state.reembolsoRow, estado: 'completado' },
                error: null,
              }),
            }),
          };
          return chain;
        },
      };
    }
    return {
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
      }),
    };
  },
}));

vi.mock('@/api/lib/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/lib/middleware')>();
  return {
    ...actual,
    authMiddleware: async (
      c: { set: (k: string, v: unknown) => void },
      next: () => Promise<void>,
    ) => {
      c.set('supabase', supabaseMock);
      await next();
    },
    requireProfileRole: () => async (_c: unknown, next: () => Promise<void>) => next(),
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'admin-1', email: 'admin@test.cl', app_metadata: { role: 'admin' } } },
        error: null,
      }),
    },
  }),
}));

const { getPaymentProviderByName } = await import('@/api/lib/payments/provider');

function processarHeaders() {
  return {
    'Content-Type': 'application/json',
    origin: 'http://localhost:3000',
    Authorization: 'Bearer admin-token',
    'x-forwarded-for': '10.99.11.1',
  };
}

describe('POST /api/reembolsos/:id/procesar — claim atómico', () => {
  beforeEach(() => {
    cleanupRateLimitMap();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
    vi.clearAllMocks();
    state.reembolsoRow = {
      id: 'r-1',
      venta_id: 'v-1',
      estado: 'pendiente',
      tipo: 'total',
      motivo: 'cliente solicita',
      monto_reembolso: 19990,
      monto_original: 19990,
      psp_reversa_ok: true,
      puntos_revertidos: true,
      stock_restaurado: true,
      nc_emitida: true,
      cliente_id: null,
      nc_folio: 'NC61-EXISTENTE',
    };
  });

  it('claim perdido (otro request ya está procesando) → 409 sin reversa PSP', async () => {
    state.claimResult = { data: null, error: null };

    const res = await app.request('/api/reembolsos/r-1/procesar', {
      method: 'POST',
      headers: processarHeaders(),
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('reembolso_in_progress');
    expect(getPaymentProviderByName).not.toHaveBeenCalled();
  });

  it('claim ganado → procesa y completa', async () => {
    state.claimResult = { data: { id: 'r-1' }, error: null };

    const res = await app.request('/api/reembolsos/r-1/procesar', {
      method: 'POST',
      headers: processarHeaders(),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.estado).toBe('completado');
  });
});
