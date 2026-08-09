/**
 * Distancias mínimas legales entre apiarios — Ley 21.102 (Ley Apícola) y su
 * Reglamento de Trashumancia (zona Valparaíso–Los Lagos).
 *
 * TODO-verificar: bandas provisionales tomadas del plan de lanzamiento
 * ("500 m a 2,2 km según carga de colmenas; ingresos de >36 colmenas
 * trashumantes deben respetarlas respecto de apiarios locales"). Contrastar
 * con la tabla oficial ODEPA "Consulta Reglamento Ley Apícola 2023 (tabla
 * distanciamientos por región/carga)" antes del lanzamiento del censo.
 */

/** Umbral de colmenas bajo el cual la trashumancia no exige distanciamiento. */
export const UMBRAL_TRASHUMANTE_COLMENAS = 36;

/** Bandas provisionales: n_colmenas → distancia mínima (km). */
const BANDAS: ReadonlyArray<{ hasta: number; km: number }> = [
  { hasta: 100, km: 0.5 },
  { hasta: 500, km: 1.0 },
  { hasta: 1000, km: 1.5 },
  { hasta: Number.POSITIVE_INFINITY, km: 2.2 },
];

/**
 * Distancia mínima legal (km) exigida a un ingreso trashumante según su carga
 * de colmenas. Devuelve null si la carga no exige distanciamiento (≤36).
 */
export function distanciaMinimaLegalKm(nColmenas: number): number | null {
  if (!Number.isFinite(nColmenas) || nColmenas <= UMBRAL_TRASHUMANTE_COLMENAS) {
    return null;
  }
  const banda = BANDAS.find((b) => nColmenas <= b.hasta);
  return banda?.km ?? 2.2;
}
