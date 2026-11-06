import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from "../../app";

const mockFrom = vi.fn();

vi.mock('@enjambre/auth/server-index', () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

describe('POST /api/percepcion/sesiones', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('rejects invalid email with 400 and friendly message', async () => {
    const res = await app.request('/api/percepcion/sesiones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://obrerayzangano.cl',
      },
      body: JSON.stringify({
        codigo_punto: 'FERIA',
        email: 'invalid-email-format',
        agrado: 10,
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('invalid_payload');
    expect(json.message).toContain('email');
  });

  it('auto-resolves canonical point (FERIA) and accepts valid sensory session', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'v_b2b_puntos_publicos') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        };
      }
      if (table === 'b2b_puntos_venta') {
        return {
          upsert: () => ({
            select: () => ({
              maybeSingle: async () => ({
                data: {
                  id: '00000000-0000-0000-0000-000000000001',
                  nombre: 'Estación de Degustación en Vivo · Stand Feria',
                  tipo: 'feria_evento',
                  ciudad: 'Chile',
                },
              }),
            }),
          }),
        };
      }
      if (table === 'productos') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'b8014900-08ec-4e07-8642-139a7a569d49' },
              }),
            }),
          }),
        };
      }
      if (table === 'fid_clientes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'cliente-uuid-1' } }),
            }),
          }),
        };
      }
      if (table === 'fid_membresias') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
          }),
          insert: async () => ({ error: null }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      if (table === 'perc_sesiones') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'sesion-uuid-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'perc_pares' || table === 'perc_chips' || table === 'fid_eventos') {
        return {
          insert: async () => ({ error: null }),
        };
      }
      if (table === 'fid_valores') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { valor: 25 } }),
              }),
            }),
          }),
        };
      }
      if (table === 'resenas_producto') {
        return {
          insert: async () => ({ error: null }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        insert: async () => ({ error: null }),
      };
    });

    const res = await app.request('/api/percepcion/sesiones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://obrerayzangano.cl',
      },
      body: JSON.stringify({
        codigo_punto: 'FERIA',
        producto_id: 'avellanas-chilenas-tostadas-y-molidas',
        tipo_sensorial: 'fortificaciones',
        email: 'test@example.com',
        consentimiento: true,
        agrado: 10,
        pares: [{ par: 'Tostado', valor: 2 }],
        chips: [{ bloque: 'sabor', chip: 'Avellana' }],
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.sesion_id).toBe('sesion-uuid-1');
    expect(json.data.puntos_ganados).toBe(25);
  });
});
