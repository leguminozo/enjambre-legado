import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from "../../app";

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: new Error('No token'),
      }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn(),
  }),
}));

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
  createServerClientFromCookies: vi.fn(),
  createSupabaseUserClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: new Error('No token'),
      }),
    },
  }),
}));

describe('Public Unclaimed Actors Search API', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('GET /api/registro-territorial/actores/buscar-unclaimed without Bearer returns 200 (not 401)', async () => {
    const res = await app.request('/api/registro-territorial/actores/buscar-unclaimed?q=a');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ data: [] });
  });

  it('GET /api/registro-territorial/actores/buscar-unclaimed?q=car searches unclaimed actors with service client', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'actores_registro') {
        return {
          select: () => ({
            is: () => ({
              eq: () => ({
                or: () => ({
                  limit: async () => ({
                    data: [
                      {
                        id: 'actor-1',
                        nombre_actor: 'Carlos Cárcamo',
                        comuna: 'Quemchi',
                        region: 'Los Lagos',
                        rol: 'apicultor',
                        apiarios_registro: [
                          { id: 'ap-1', nombre: 'Apiario El Roble', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 25 },
                        ],
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await app.request('/api/registro-territorial/actores/buscar-unclaimed?q=car');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].nombre_actor).toBe('Carlos Cárcamo');
    expect(json.data[0].n_colmenas).toBe(25);
  });

  it('deduplicates unclaimed actors with identical names in different cases', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'actores_registro') {
        return {
          select: () => ({
            is: () => ({
              eq: () => ({
                or: () => ({
                  limit: async () => ({
                    data: [
                      {
                        id: 'actor-upper',
                        nombre_actor: 'JAIME IVAN ROGEL BARRIENTOS',
                        comuna: 'Quemchi',
                        region: 'Los Lagos',
                        rol: 'api_residente',
                        apiarios_registro: [
                          { id: 'ap-1', nombre: 'LAS CHACRAS', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                          { id: 'ap-2', nombre: 'CONCHEO', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                          { id: 'ap-3', nombre: 'COCHELA', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                        ],
                      },
                      {
                        id: 'actor-title',
                        nombre_actor: 'Jaime Ivan Rogel Barrientos',
                        comuna: 'Quemchi',
                        region: 'Los Lagos',
                        rol: 'api_residente',
                        apiarios_registro: [
                          { id: 'ap-4', nombre: 'LAS CHACRAS', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                          { id: 'ap-5', nombre: 'CONCHEO', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                          { id: 'ap-6', nombre: 'COCHELA', comuna: 'Quemchi', zona: 'Quemchi', n_colmenas: 10 },
                        ],
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await app.request('/api/registro-territorial/actores/buscar-unclaimed?q=jaime');
    expect(res.status).toBe(200);
    const json = await res.json();
    // Debe devolver exactamente 1 resultado (deduplicado)
    expect(json.data).toHaveLength(1);
    expect(json.data[0].nombre_actor).toBe('Jaime Ivan Rogel Barrientos');
    expect(json.data[0].comuna).toBe('Quemchi');
    expect(json.data[0].n_apiarios).toBe(3);
    expect(json.data[0].n_colmenas).toBe(30);
  });

  it('GET /api/registro-territorial/actores without Bearer returns 401 (zero-trust preserved)', async () => {
    const res = await app.request('/api/registro-territorial/actores');
    expect(res.status).toBe(401);
  });
});
