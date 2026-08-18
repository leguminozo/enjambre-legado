/**
 * Bandas de apoyo para evaluar distancias entre apiarios (zona
 * Valparaíso–Los Lagos), al amparo de la Ley N° 21.489 y el Decreto N° 21/2024
 * (trashumancia).
 *
 * No son la tabla SAG cerrada: hay variantes entre consulta pública y
 * reglamento. El BFF las usa como herramienta indicativa (coords aproximadas);
 * no sustituyen fiscalización ni resolución de autoridad.
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
