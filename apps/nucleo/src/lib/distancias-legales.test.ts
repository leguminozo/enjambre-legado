import { describe, expect, it } from 'vitest';
import {
  distanciaMinimaLegalKm,
  UMBRAL_TRASHUMANTE_COLMENAS,
} from './distancias-legales';

describe('distanciaMinimaLegalKm (Ley 21.489 — bandas de apoyo)', () => {
  it('no exige distanciamiento bajo el umbral de 36 colmenas', () => {
    expect(distanciaMinimaLegalKm(0)).toBeNull();
    expect(distanciaMinimaLegalKm(36)).toBeNull();
    expect(distanciaMinimaLegalKm(UMBRAL_TRASHUMANTE_COLMENAS)).toBeNull();
  });

  it('banda 37–100 colmenas → 500 m', () => {
    expect(distanciaMinimaLegalKm(37)).toBe(0.5);
    expect(distanciaMinimaLegalKm(100)).toBe(0.5);
  });

  it('banda 101–500 colmenas → 1,0 km', () => {
    expect(distanciaMinimaLegalKm(101)).toBe(1.0);
    expect(distanciaMinimaLegalKm(500)).toBe(1.0);
  });

  it('banda 501–1000 colmenas → 1,5 km', () => {
    expect(distanciaMinimaLegalKm(501)).toBe(1.5);
    expect(distanciaMinimaLegalKm(1000)).toBe(1.5);
  });

  it('más de 1000 colmenas → 2,2 km', () => {
    expect(distanciaMinimaLegalKm(1001)).toBe(2.2);
    expect(distanciaMinimaLegalKm(5000)).toBe(2.2);
  });

  it('valores no finitos no exigen distanciamiento', () => {
    expect(distanciaMinimaLegalKm(Number.NaN)).toBeNull();
    expect(distanciaMinimaLegalKm(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
