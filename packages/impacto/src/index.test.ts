import { describe, expect, it } from 'vitest';
import {
  IMPACTO_COEFICIENTES,
  IMPACTO_METODOLOGIA_VERSION,
  ESPECIES_ALOMETRIA_CHILOE,
  FACTORES_ESTADIO,
  META_CENSO_2026_2027,
  buildOpenBookFromArboles,
  calcularBiomasaYCO2,
  co2EvitadoKgFrascos500g,
  co2TonFromArboles,
  computeIrrSimplificado,
  getMetodologiaPublica,
  normalizarClaveEspecie,
  normalizarEstadio,
} from './index';

describe('impacto-metodologia', () => {
  it('co2TonFromArboles retrocompatible usa 0.05 t/árbol por defecto', () => {
    expect(co2TonFromArboles(100)).toBe(5);
    expect(co2TonFromArboles(0)).toBe(0);
  });

  it('co2TonFromArboles alométrico calcula stock según especie y estadio', () => {
    // 10 Ulmos adultos (stock adulto Ulmo = 0.85 tCO2e, factor adulto = 1.0)
    const val = co2TonFromArboles(10, 'Ulmo', 'adulto');
    expect(val).toBe(8.5);
  });

  it('calcularBiomasaYCO2 modela stock y captura anual diferenciada', () => {
    // 20 Tepúes en turbera (plántulas)
    const plantulas = calcularBiomasaYCO2({
      especie: 'Tepú',
      cantidad: 20,
      estadio: 'plantula',
      regimen: 'reforestacion',
    });
    expect(plantulas.estadioNormalizado).toBe('plantula');
    expect(plantulas.regimen).toBe('reforestacion');
    expect(plantulas.especieResuelta?.id).toBe('tepu');
    expect(plantulas.stockCo2Ton).toBeGreaterThan(0);
    expect(plantulas.capturaAnualKg).toBeGreaterThan(0);

    // 5 Ulmos monumentales con DAP 75 cm
    const monumentales = calcularBiomasaYCO2({
      especie: 'Ulmo (Eucryphia cordifolia)',
      cantidad: 5,
      dapCm: 75,
      regimen: 'preservacion',
    });
    expect(monumentales.estadioNormalizado).toBe('monumental');
    expect(monumentales.stockCo2Ton).toBeGreaterThan(plantulas.stockCo2Ton);
  });

  it('normalizarClaveEspecie resuelve acentos y nombres científicos', () => {
    expect(normalizarClaveEspecie('Eucryphia cordifolia (Ulmo)')).toBe('ulmo');
    expect(normalizarClaveEspecie('Tepú')).toBe('tepu');
    expect(normalizarClaveEspecie('Coigüe')).toBe('coigue');
    expect(normalizarClaveEspecie('Melí')).toBe('meli');
  });

  it('normalizarEstadio mapea términos coloquiales y técnicos', () => {
    expect(normalizarEstadio('vivero')).toBe('plantula');
    expect(normalizarEstadio('fustal')).toBe('creciendo');
    expect(normalizarEstadio('dosel')).toBe('adulto');
    expect(normalizarEstadio('veterano')).toBe('monumental');
  });

  it('IRR simplificado calcula cociente contra emisiones reales u orden de magnitud', () => {
    const sec = co2TonFromArboles(100); // 5
    const irrPorDefecto = computeIrrSimplificado(sec, 100);
    expect(irrPorDefecto).toBe(10);

    // Con emisiones operacionales reales (ej: 0.5 ton emitidas en logística)
    const irrReal = computeIrrSimplificado(sec, 100, 0.5);
    expect(irrReal).toBe(10);
  });

  it('IRR null sin árboles o sin base de emisión', () => {
    expect(computeIrrSimplificado(1, 0)).toBeNull();
  });

  it('frasco 500g', () => {
    expect(co2EvitadoKgFrascos500g(2)).toBe(
      IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g * 2,
    );
  });

  it('metodología pública expone versión, especies, estadios y meta de censo 2026-2027', () => {
    const m = getMetodologiaPublica();
    expect(m.version).toBe(IMPACTO_METODOLOGIA_VERSION);
    expect(m.metaCenso.campana).toBe('2026-2027');
    expect(m.metaCenso.arbolesObjetivo).toBe(3000);
    expect(m.especies.ulmo.nombreComun).toBe('Ulmo');
    expect(m.estadios.adulto.label).toContain('Adulto');
    expect(m.limites.length).toBeGreaterThan(0);
    expect(m.fuentes.length).toBeGreaterThan(0);
  });

  it('open book agrega sin filtrar nulls e incluye progreso de campaña 2026-2027', () => {
    const book = buildOpenBookFromArboles([
      { cantidad: 300, co2_ton: 15.0, co2_anual_kg: 3200, sector: 'Pureo', especie: 'Ulmo' },
      { cantidad: 150, co2_ton: 6.5, co2_anual_kg: 1800, sector: 'Molulco', especie: 'Tiaca' },
    ]);
    expect(book.arboles_plantados).toBe(450);
    expect(book.co2_secuestrado_ton).toBe(21.5);
    expect(book.co2_anual_kg).toBe(5000);
    expect(book.zonas).toBe(2);
    expect(book.especies).toBe(2);
    expect(book.campana).toBe('2026-2027');
    expect(book.meta_progreso_pct).toBe(15.0); // 450 / 3000 * 100
  });
});
