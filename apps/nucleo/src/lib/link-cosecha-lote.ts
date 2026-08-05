/**
 * Vínculo bidireccional recolección ↔ lote (pasaporte del frasco).
 * - cosechas.lote_id apunta al lote
 * - lotes.cosecha_ids acumula UUIDs (legacy + lectura pública)
 */

export function appendCosechaId(
  existing: string[] | null | undefined,
  cosechaId: string,
): string[] {
  const next = new Set((existing ?? []).filter((id) => typeof id === 'string' && id.length > 0));
  next.add(cosechaId);
  return [...next];
}

export function removeCosechaId(
  existing: string[] | null | undefined,
  cosechaId: string,
): string[] {
  return (existing ?? []).filter((id) => id && id !== cosechaId);
}

export function mergeCosechaIds(
  existing: string[] | null | undefined,
  toAdd: string[],
): string[] {
  const next = new Set((existing ?? []).filter((id) => typeof id === 'string' && id.length > 0));
  for (const id of toAdd) {
    if (id) next.add(id);
  }
  return [...next];
}

/** Suma kg de recolecciones (null/undefined → 0). */
export function sumCosechaKg(rows: Array<{ kg?: number | null }>): number {
  return rows.reduce((acc, r) => acc + (typeof r.kg === 'number' && Number.isFinite(r.kg) ? r.kg : 0), 0);
}
