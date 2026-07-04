import { describe, it, expect } from 'vitest';
import { assessParseConfidence, PARSE_AUTO_EMIT_THRESHOLD } from '../domain/parse-confidence';
import type { GastoExtranjeroResult } from '../domain/gasto-extranjero';

const baseGasto: GastoExtranjeroResult = {
  proveedorId: 'meta-ads',
  proveedorRut: '76301919-3',
  proveedorNombre: 'META PLATFORMS IRELAND LTD',
  proveedorGiro: 'PUBLICIDAD',
  montoOriginal: 150,
  monedaOriginal: 'USD',
  montoCLP: 142500,
  tasaCambio: 950,
  montoNeto: 0,
  montoExento: 142500,
  montoIva: 0,
  montoTotal: 142500,
  fechaEmision: '2026-06-15',
  numeroDocumento: 'INV-META-2026-001',
  concepto: 'Meta Ads',
  detalle: 'Campaña',
};

describe('assessParseConfidence', () => {
  it('scores high for complete meta-like gasto', () => {
    const result = assessParseConfidence(baseGasto, 'meta-ads');
    expect(result.score).toBeGreaterThanOrEqual(PARSE_AUTO_EMIT_THRESHOLD);
    expect(result.requiresReview).toBe(false);
  });

  it('flags review when document number missing', () => {
    const result = assessParseConfidence({ ...baseGasto, numeroDocumento: '' }, 'generic');
    expect(result.requiresReview).toBe(true);
    expect(result.campos.numeroDocumento).toBe('faltante');
  });
});