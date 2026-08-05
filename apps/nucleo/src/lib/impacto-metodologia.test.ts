import { describe, expect, it } from 'vitest';
import {
  IMPACTO_COEFICIENTES,
  IMPACTO_METODOLOGIA_VERSION,
  buildOpenBookFromArboles,
  co2EvitadoKgFrascos500g,
  co2TonFromArboles,
  computeIrrSimplificado,
  getMetodologiaPublica,
} from './impacto-metodologia';

describe('impacto-metodologia', () => {
  it('co2TonFromArboles usa 0.05 t/árbol', () => {
    expect(co2TonFromArboles(100)).toBe(5);
    expect(co2TonFromArboles(0)).toBe(0);
  });

  it('IRR simplificado es secuestrado/emitido', () => {
    const sec = co2TonFromArboles(100); // 5
    const irr = computeIrrSimplificado(sec, 100);
    // 5 / (100 * 0.005) = 10
    expect(irr).toBe(10);
  });

  it('IRR null sin árboles', () => {
    expect(computeIrrSimplificado(1, 0)).toBeNull();
  });

  it('frasco 500g', () => {
    expect(co2EvitadoKgFrascos500g(2)).toBe(
      IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g * 2,
    );
  });

  it('metodología pública expone versión y fórmulas', () => {
    const m = getMetodologiaPublica();
    expect(m.version).toBe(IMPACTO_METODOLOGIA_VERSION);
    expect(m.formulas.co2_ton_plantacion).toContain('0.05');
    expect(m.limites.length).toBeGreaterThan(0);
    expect(m.fuentes.length).toBeGreaterThan(0);
  });

  it('open book agrega sin filtrar nulls mal', () => {
    const book = buildOpenBookFromArboles([
      { cantidad: 10, co2_ton: 0.5, sector: 'Pureo', especie: 'Ulmo' },
      { cantidad: 5, co2_ton: 0.25, sector: 'Pureo', especie: 'Tepú' },
    ]);
    expect(book.arboles_plantados).toBe(15);
    expect(book.co2_secuestrado_ton).toBe(0.75);
    expect(book.zonas).toBe(1);
    expect(book.especies).toBe(2);
  });
});
