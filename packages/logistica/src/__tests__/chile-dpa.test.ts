import { describe, expect, it } from 'vitest';
import {
  CHILE_REGIONES_DPA,
  CHILE_COMUNAS_POR_REGION,
  getComunasPorRegion,
  getRegionDeComuna,
  getCentroideRegion,
  isChileRegion,
} from '../chile-dpa';
import { CHILE_REGIONES } from '../shipping-rates';

describe('Chile DPA (División Político-Administrativa)', () => {
  it('contiene exactamente las 16 regiones oficiales de Chile', () => {
    expect(CHILE_REGIONES_DPA).toHaveLength(16);
    expect(CHILE_REGIONES).toHaveLength(16);

    const nombresDpa = CHILE_REGIONES_DPA.map((r) => r.nombre);
    expect(nombresDpa).toEqual(CHILE_REGIONES);
  });

  it('contiene exactamente 346 comunas canónicas sin duplicados', () => {
    const todasLasComunas: string[] = [];
    const counts: Record<string, number> = {};
    for (const [region, comunas] of Object.entries(CHILE_COMUNAS_POR_REGION)) {
      counts[region] = comunas.length;
      expect(comunas.length).toBeGreaterThan(0);
      todasLasComunas.push(...comunas);
    }

    expect(todasLasComunas).toHaveLength(346);
    const unicas = new Set(todasLasComunas);
    expect(unicas.size).toBe(346);
  });

  it('incluye las 10 comunas de Chiloé dentro de la Región de Los Lagos', () => {
    const comunasLosLagos = getComunasPorRegion('Los Lagos');
    expect(comunasLosLagos).toContain('Castro');
    expect(comunasLosLagos).toContain('Ancud');
    expect(comunasLosLagos).toContain('Chonchi');
    expect(comunasLosLagos).toContain('Curaco de Vélez');
    expect(comunasLosLagos).toContain('Dalcahue');
    expect(comunasLosLagos).toContain('Puqueldón');
    expect(comunasLosLagos).toContain('Queilén');
    expect(comunasLosLagos).toContain('Quellón');
    expect(comunasLosLagos).toContain('Quemchi');
    expect(comunasLosLagos).toContain('Quinchao');
  });

  it('resuelve correctamente la región a partir de una comuna', () => {
    expect(getRegionDeComuna('Castro')).toBe('Los Lagos');
    expect(getRegionDeComuna('Providencia')).toBe('Metropolitana');
    expect(getRegionDeComuna('Vallenar')).toBe('Atacama');
    expect(getRegionDeComuna('Punta Arenas')).toBe('Magallanes');
    expect(getRegionDeComuna('Comuna Inexistente')).toBeNull();
    expect(getRegionDeComuna('')).toBeNull();
  });

  it('obtiene el centroide geográfico para mapas', () => {
    const centroideLagos = getCentroideRegion('Los Lagos');
    expect(centroideLagos).not.toBeNull();
    expect(centroideLagos?.lat).toBeCloseTo(-41.4693, 2);
    expect(centroideLagos?.lng).toBeCloseTo(-72.9424, 2);

    expect(getCentroideRegion('Inexistente')).toBeNull();
  });

  it('valida correctamente si un string es una región chilena válida', () => {
    expect(isChileRegion('Los Lagos')).toBe(true);
    expect(isChileRegion('Metropolitana')).toBe(true);
    expect(isChileRegion("O'Higgins")).toBe(true);
    expect(isChileRegion('Buenos Aires')).toBe(false);
    expect(isChileRegion(123)).toBe(false);
  });
});
