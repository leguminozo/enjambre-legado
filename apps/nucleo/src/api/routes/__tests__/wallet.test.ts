import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from "../../app";

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-1', email: 'g@example.com', user_metadata: {} } },
        error: null,
      }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

describe('GET /api/wallet/capabilities', () => {
  it('returns wallet capability flags without auth', async () => {
    const res = await app.request('/api/wallet/capabilities');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('apple.available');
    expect(json).toHaveProperty('google.available');
    expect(json).toHaveProperty('qr.available', true);
  });
});

describe('GET /api/wallet/stamps', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('requires auth', async () => {
    const res = await app.request('/api/wallet/stamps');
    expect(res.status).toBe(401);
  });

  it('returns snapshot for authenticated user', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { full_name: 'María', email: 'm@test.com' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_tier_view') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { tier: 'ZÁNGANO', tier_nombre: 'Aliado del Enjambre', tier_icono: '🌿', ciclos_historicos: 120 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'puntos_fidelizacion') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { puntos: 500 }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'guardian_stamp_progress') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({}) }) };
    });

    const res = await app.request('/api/wallet/stamps', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.snapshot.displayName).toBe('María');
    expect(json.snapshot.programs).toEqual([]);
  });
});

describe('GET /api/wallet/apple/download', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns 503 when signing is not configured', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { full_name: 'María', email: 'm@test.com' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_tier_view') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { tier: 'OBRERA', ciclos_historicos: 0 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'puntos_fidelizacion') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { puntos: 0 }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'guardian_stamp_progress') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({}) }) };
    });

    const res = await app.request('/api/wallet/apple/download', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('wallet_apple_unavailable');
  });
});

describe('POST /api/wallet/qr/resolve', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  const headers = {
    'Content-Type': 'application/json',
    origin: 'http://localhost:3000',
  };

  it('rejects forged token with uid parameter and no valid signature', async () => {
    const res = await app.request('/api/wallet/qr/resolve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: 'guardian://scan?uid=00000000-0000-0000-0000-000000000001' }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('invalid_token');
  });

  it('rejects invalid random string token', async () => {
    const res = await app.request('/api/wallet/qr/resolve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: 'random-invalid-token' }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('invalid_token');
  });

  it('accepts legitimate signed token', async () => {
    const { signWalletQrToken } = await import('@enjambre/wallet');
    const secret = 'oyz-wallet-dev';
    const signed = signWalletQrToken('user-1', secret);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { full_name: 'María', email: 'm@test.com' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'user_tier_view') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { tier: 'OBRERA', ciclos_historicos: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'puntos_fidelizacion') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { puntos: 150 }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'guardian_stamp_progress') {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({}) }) };
    });

    const res = await app.request('/api/wallet/qr/resolve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: `guardian://scan?tok=${signed}` }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.displayName).toBe('María');
    expect(json.puntos).toBe(150);
  });
});

describe('POST /api/wallet/cards/enroll-init', () => {
  it('requires auth', async () => {
    const res = await app.request('/api/wallet/cards/enroll-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3001',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
  });

  it('devuelve 503 si FLOW_API_KEY no está configurada', async () => {
    const res = await app.request('/api/wallet/cards/enroll-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3001',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('flow_not_configured');
  });
});
