export type CostFloorLine = {
  /** Costo unitario conocido (CLP). null = sin receta → no aporta al piso. */
  costoUnitario: number | null;
  cantidad: number;
  /** Precio unitario verificado (CLP, antes de descuentos). */
  precioUnitario: number;
};

export type CostFloorResult =
  | { ok: true; cobertura: number; costoTotal: number }
  | { ok: false; code: "below_cost"; faltante: number; cobertura: number; costoTotal: number };

/**
 * Piso de costo: el neto (precios menos descuentos totales) nunca puede quedar
 * bajo el costo conocido. Fail-open: sin líneas con costo, todo pasa y se
 * registra cobertura 0 para que el Tablero lo evidencie.
 */
export function validateTotalAboveCost(
  lines: CostFloorLine[],
  descuentoTotalClp: number,
): CostFloorResult {
  let ingreso = 0;
  let costoTotal = 0;
  let conocidas = 0;

  for (const line of lines) {
    const qty = Math.max(0, Math.floor(line.cantidad));
    if (qty === 0) continue;
    ingreso += Math.max(0, line.precioUnitario) * qty;
    if (line.costoUnitario != null && Number.isFinite(line.costoUnitario)) {
      conocidas += 1;
      costoTotal += Math.max(0, line.costoUnitario) * qty;
    }
  }

  const cobertura = lines.length > 0 ? conocidas / lines.length : 0;
  if (conocidas === 0) return { ok: true, cobertura, costoTotal: 0 };

  const neto = Math.max(0, ingreso - Math.max(0, descuentoTotalClp));
  if (neto >= costoTotal) return { ok: true, cobertura, costoTotal };
  return { ok: false, code: "below_cost", faltante: costoTotal - neto, cobertura, costoTotal };
}
