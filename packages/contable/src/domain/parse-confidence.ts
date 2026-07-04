import type { GastoExtranjeroResult } from './gasto-extranjero';

export type ParseCampoEstado = 'ok' | 'inferido' | 'faltante';

export type ParseConfidence = {
  score: number;
  parserId: string;
  requiresReview: boolean;
  campos: Record<string, ParseCampoEstado>;
};

export const PARSE_AUTO_EMIT_THRESHOLD = 0.85;

const FIELD_WEIGHTS: Record<string, number> = {
  proveedorId: 0.2,
  montoTotal: 0.3,
  fechaEmision: 0.15,
  numeroDocumento: 0.1,
  monedaOriginal: 0.1,
  concepto: 0.15,
};

export function assessParseConfidence(
  gasto: GastoExtranjeroResult,
  parserId: string,
  options?: {
    fechaInferida?: boolean;
    monedaInferida?: boolean;
  },
): ParseConfidence {
  const campos: Record<string, ParseCampoEstado> = {
    proveedorId: gasto.proveedorId ? 'ok' : 'faltante',
    montoTotal: gasto.montoTotal > 0 ? 'ok' : 'faltante',
    fechaEmision: options?.fechaInferida ? 'inferido' : gasto.fechaEmision ? 'ok' : 'faltante',
    numeroDocumento: gasto.numeroDocumento?.trim() ? 'ok' : 'faltante',
    monedaOriginal: options?.monedaInferida ? 'inferido' : gasto.monedaOriginal ? 'ok' : 'faltante',
    concepto: gasto.concepto?.trim() ? 'ok' : 'faltante',
  };

  let score = 1;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const estado = campos[field] ?? 'faltante';
    if (estado === 'faltante') score -= weight;
    else if (estado === 'inferido') score -= weight * 0.45;
  }

  if (parserId === 'generic') score -= 0.12;
  if (!gasto.numeroDocumento?.trim()) score -= 0.05;

  const normalized = Math.max(0, Math.min(1, Number(score.toFixed(3))));

  return {
    score: normalized,
    parserId,
    requiresReview: normalized < PARSE_AUTO_EMIT_THRESHOLD,
    campos,
  };
}