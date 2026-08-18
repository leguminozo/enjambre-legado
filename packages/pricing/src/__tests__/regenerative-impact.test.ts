import { describe, expect, it } from 'vitest';
import { calculateRegenerativeImpact } from '../regenerative-impact';

describe('calculateRegenerativeImpact', () => {
  it('calcula métricas exactas para una porción de 15g (sachet)', () => {
    const metrics = calculateRegenerativeImpact(15);

    expect(metrics.gramos).toBe(15);
    // 15g / 20kg * 5000 m² = 3.75 m²
    expect(metrics.bosqueCustodiadoM2).toBe(3.75);

    // 15g -> 41g néctar -> 41g / 1.2mg = ~34.167 flores
    expect(metrics.floresFecundadas).toBeGreaterThan(34000);
    expect(metrics.floresFecundadas).toBeLessThan(35000);

    // 41g / 40mg = ~1.025 vuelos * 2.4 km = ~2.460 km
    expect(metrics.distanciaVueloKm).toBeGreaterThan(2400);
    expect(metrics.distanciaVueloKm).toBeLessThan(2500);

    // Semillas: 34.167 * 0.4 = ~13.667 semillas
    expect(metrics.semillasViables).toBeGreaterThan(13000);
    expect(metrics.semillasViables).toBeLessThan(14000);

    // Dosel centenario (~1/3 de copa)
    expect(metrics.fraccionDoselCentenario).toBeCloseTo(0.34, 1);

    // Árboles subdosel (~2.3 árboles)
    expect(metrics.arbolesSubdoselEquivalentes).toBeCloseTo(2.3, 1);

    // Carbono stock: 3.75 m² * 40 kg = 150 kg
    expect(metrics.co2StockResguardadoKg).toBe(150);
  });

  it('calcula métricas proporcionales para un frasco de 250g', () => {
    const metrics = calculateRegenerativeImpact(250);

    expect(metrics.gramos).toBe(250);
    // 250g / 20kg * 5000 m² = 62.5 m²
    expect(metrics.bosqueCustodiadoM2).toBe(62.5);
    expect(metrics.floresFecundadas).toBeGreaterThan(560000);
    expect(metrics.distanciaVueloKm).toBeGreaterThan(40000);
    expect(metrics.co2StockResguardadoKg).toBe(2500);
  });

  it('permite parametrización personalizada de rendimiento sostenible', () => {
    // Si R_sost se fija en 25 kg
    const metrics = calculateRegenerativeImpact(15, { rendimientoSostenibleKg: 25 });
    // 15g / 25kg * 5000 m² = 3.00 m²
    expect(metrics.bosqueCustodiadoM2).toBe(3.0);
  });

  it('maneja valores de 0 o negativos de forma robusta', () => {
    const metrics = calculateRegenerativeImpact(0);
    expect(metrics.bosqueCustodiadoM2).toBe(0);
    expect(metrics.floresFecundadas).toBe(0);
    expect(metrics.distanciaVueloKm).toBe(0);
  });
});
