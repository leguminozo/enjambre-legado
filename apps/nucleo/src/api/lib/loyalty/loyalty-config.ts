import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_LOYALTY_ENGINE_CONFIG,
  DEFAULT_LOYALTY_REDEMPTION,
  type LoyaltyEngineConfig,
  type LoyaltyRedemptionConfig,
} from '@enjambre/pricing';

export interface LoadedLoyaltyConfig {
  engine: LoyaltyEngineConfig;
  redemption: Required<LoyaltyRedemptionConfig>;
}

/**
 * Fallback operativo del retorno de frascos. El package declara 50/150 como
 * diseño canónico, pero la operación viva acredita 500 pts por frasco y 1.500
 * por lote de 10 (inventario POS). Antes de que la migración 217 siembre la
 * tabla — o si una clave se borra por error — este fallback preserva el cobro
 * real; el admin puede ajustarlo a 50/150 desde el panel cuando quiera.
 */
const LIVE_JAR_FALLBACK = {
  puntosPorFrasco: 500,
  puntosBonoHito10Frascos: 1500,
} as const;

/** Mapa clave → campo del engine. Un typo en la tabla cae al default, nunca a NaN. */
function num(rows: Map<string, number>, clave: string, fallback: number, min = 0): number {
  const value = rows.get(clave);
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) return fallback;
  return value;
}

/**
 * Lee la economía de lealtad desde beneficios_enjembre (panel Enjambre de
 * Núcleo) y la convierte en la configuración del motor canónico y del canje
 * por bloques. Un solo SELECT; clave ausente o inválida = valor base del
 * package, así el editor no puede romper una acreditación.
 */
export async function loadLoyaltyConfig(admin: SupabaseClient): Promise<LoadedLoyaltyConfig> {
  const fallback: LoadedLoyaltyConfig = {
    engine: { ...DEFAULT_LOYALTY_ENGINE_CONFIG, ...LIVE_JAR_FALLBACK },
    redemption: { ...DEFAULT_LOYALTY_REDEMPTION },
  };

  try {
    const { data, error } = await admin
      .from('beneficios_enjambre')
      .select('clave, valor_numerico');

    if (error || !Array.isArray(data) || data.length === 0) {
      return fallback;
    }

    const rows = new Map<string, number>();
    for (const row of data) {
      if (row.valor_numerico == null) continue;
      const value = Number(row.valor_numerico);
      if (row.clave && Number.isFinite(value)) {
        rows.set(String(row.clave), value);
      }
    }

    const d = DEFAULT_LOYALTY_ENGINE_CONFIG;
    return {
      engine: {
        clpGastoPorPunto: Math.max(1, Math.round(num(rows, 'clp_gasto_por_punto', d.clpGastoPorPunto))),
        clpGastoPorCiclo: Math.max(1, Math.round(num(rows, 'clp_gasto_por_ciclo', d.clpGastoPorCiclo))),
        ciclosPorResena: Math.round(num(rows, 'ciclos_por_resena', d.ciclosPorResena)),
        puntosBienvenida: Math.round(num(rows, 'welcome_points', d.puntosBienvenida)),
        puntosReposicion: Math.round(num(rows, 'reposicion_pts', d.puntosReposicion)),
        ciclosBienvenidaReposicion: Math.round(
          num(rows, 'ciclos_bienvenida_reposicion', d.ciclosBienvenidaReposicion),
        ),
        ciclosPorFrasco: Math.round(num(rows, 'ciclos_por_frasco', d.ciclosPorFrasco)),
        puntosPorFrasco: Math.round(num(rows, 'puntos_por_frasco', LIVE_JAR_FALLBACK.puntosPorFrasco)),
        puntosBonoHito10Frascos: Math.round(num(rows, 'puntos_bono_hito10', LIVE_JAR_FALLBACK.puntosBonoHito10Frascos)),
        ciclosBonoHito10Frascos: Math.round(num(rows, 'ciclos_bono_hito10', d.ciclosBonoHito10Frascos)),
      },
      redemption: {
        pointsPerBlock: Math.max(1, Math.round(num(rows, 'puntos_canje_bloque', DEFAULT_LOYALTY_REDEMPTION.pointsPerBlock))),
        clpPerBlock: Math.max(1, Math.round(num(rows, 'clp_descuento_bloque', DEFAULT_LOYALTY_REDEMPTION.clpPerBlock))),
      },
    };
  } catch {
    return fallback;
  }
}
