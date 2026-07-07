import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/shop/ecosystem-metrics', () => ({
  getEcosystemMetrics: vi.fn(async () => ({
    arboles_total: 0,
    co2_ton: 0,
    especies_nativas: 0,
    sectores: 0,
    colmenas_total: 0,
    apiarios_total: 0,
    irr_ecosistema: null,
    co2_capturado_kg: 0,
    co2_emitido_kg: 0,
    productos_activos: 0,
    azucar_sustituida_g: 0,
    co2_evitado_total_kg: 0,
    anos_legado: '2008–2026',
  })),
}));

import { loadPerfilDashboard } from './perfil-dashboard';

function createMockSupabase(responses: Record<string, { data: unknown; error: null }>) {
  return {
    from(table: string) {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => responses[table] ?? { data: null, error: null },
        then: undefined as unknown,
      };
      (chain as { then?: (onfulfilled: (v: unknown) => void) => void }).then = (onfulfilled) =>
        Promise.resolve(responses[table] ?? { data: [], error: null }).then(onfulfilled);
      return chain;
    },
  };
}

describe('loadPerfilDashboard', () => {
  it('mapea ventas.productos JSON a pedido_items', async () => {
    const supabase = createMockSupabase({
      profiles: { data: { id: 'u1', full_name: 'Ana', email: 'a@test.com', role: 'cliente', arboles_personal: 2 }, error: null },
      user_tier_view: { data: { tier: 'OBRERA', ciclos_historicos: 3 }, error: null },
      suscriptor_config: { data: null, error: null },
      ventas: {
        data: [
          {
            id: 'v1',
            created_at: '2026-01-01T00:00:00Z',
            fecha: null,
            total: 12000,
            estado: 'pagado',
            productos: [{ nombre: 'Miel Ulmo', cantidad: 2, precio: 6000 }],
          },
        ],
        error: null,
      },
      ciclos: { data: [{ id: 'c1', tipo: 'compra', cantidad: 1, created_at: '2026-01-01' }], error: null },
    });

    const result = await loadPerfilDashboard(supabase as never, 'u1');

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0]?.pedido_items[0]?.productos.nombre).toBe('Miel Ulmo');
    expect(result.claimPoints[0]?.ciclos.tipo).toBe('compra');
    expect(result.user?.full_name).toBe('Ana');
  });
});