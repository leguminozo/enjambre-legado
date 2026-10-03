import { describe, expect, it, vi } from 'vitest';
import { loadLoyaltyConfig } from './loyalty-config';
import { DEFAULT_LOYALTY_ENGINE_CONFIG } from '@enjambre/pricing';

function buildMockAdmin(rows: Array<{ clave: string; valor_numerico: number | string | null }> | null, error = false) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue(
        error ? { data: null, error: { message: 'db down' } } : { data: rows, error: null },
      ),
    })),
  };
}

describe('loadLoyaltyConfig', () => {
  it('usa los valores de la tabla cuando existen', async () => {
    const admin = buildMockAdmin([
      { clave: 'clp_gasto_por_punto', valor_numerico: 200 },
      { clave: 'puntos_canje_bloque', valor_numerico: 50 },
      { clave: 'clp_descuento_bloque', valor_numerico: 5000 },
      { clave: 'puntos_por_frasco', valor_numerico: 80 },
    ]);

    const { engine, redemption } = await loadLoyaltyConfig(admin as never);

    expect(engine.clpGastoPorPunto).toBe(200);
    expect(redemption.pointsPerBlock).toBe(50);
    expect(redemption.clpPerBlock).toBe(5000);
    expect(engine.puntosPorFrasco).toBe(80);
  });

  it('tabla vacía o inaccesible cae al fallback completo (nunca lanza)', async () => {
    for (const admin of [buildMockAdmin([]), buildMockAdmin(null, true), buildMockAdmin(null)]) {
      const { engine, redemption } = await loadLoyaltyConfig(admin as never);
      expect(engine.clpGastoPorPunto).toBe(DEFAULT_LOYALTY_ENGINE_CONFIG.clpGastoPorPunto);
      expect(redemption.pointsPerBlock).toBe(100);
      expect(redemption.clpPerBlock).toBe(1000);
    }
  });

  it('el fallback del retorno de frascos preserva el cobro vivo (500/1500)', async () => {
    // Pre-migración 217 o clave borrada: el POS no puede bajar de 500 a 50.
    const { engine } = await loadLoyaltyConfig(buildMockAdmin([]) as never);
    expect(engine.puntosPorFrasco).toBe(500);
    expect(engine.puntosBonoHito10Frascos).toBe(1500);
  });

  it('basura en la tabla no produce NaN', async () => {
    const admin = buildMockAdmin([
      { clave: 'clp_gasto_por_punto', valor_numerico: 'caro' },
      { clave: 'puntos_por_frasco', valor_numerico: -10 },
      { clave: 'welcome_points', valor_numerico: null },
    ]);

    const { engine } = await loadLoyaltyConfig(admin as never);

    expect(Number.isFinite(engine.clpGastoPorPunto)).toBe(true);
    expect(engine.clpGastoPorPunto).toBe(DEFAULT_LOYALTY_ENGINE_CONFIG.clpGastoPorPunto);
    expect(engine.puntosPorFrasco).toBe(500);
    expect(engine.puntosBienvenida).toBe(DEFAULT_LOYALTY_ENGINE_CONFIG.puntosBienvenida);
  });
});
