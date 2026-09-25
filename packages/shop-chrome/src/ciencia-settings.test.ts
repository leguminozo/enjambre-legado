import { describe, it, expect } from 'vitest';
import {
  parseCienciaSettings,
  DEFAULT_CIENCIA_SETTINGS,
  type CienciaSettings,
} from './store-chrome';

describe('Ciencia Settings Parser', () => {
  it('parses null or empty settings falling back to defaults', () => {
    const parsed = parseCienciaSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_CIENCIA_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_CIENCIA_SETTINGS.title);
    expect(parsed.triangulacion_title).toBe('Refugio Austral: Bosque Nativo sin Pesticidas');
    expect(parsed.bioquimica_title).toBe('Composición de la Miel Cruda Viva');
    expect(parsed.protocolo_title).toBe('Protocolo de Laboratorio y Análisis por Lote');
    expect(parsed.biblioteca_title).toBe('Biblioteca de Floraciones del Bosque Nativo');
    expect(parsed.estacion_title).toBe('Estación de Origen: Curaduría de Contraste Máximo');
    expect(parsed.estacion_cta_href).toBe('/experiencias/degustaciones#estacion-origen');
    expect(parsed.metodologia_title).toBe('Cálculo Referencial de CO₂ y Regeneración');
    expect(parsed.pecoreo_title).toBe('Transformación Néctar-Miel y Capacidad de Carga del Bosque');
    expect(parsed.horizonte_title).toBe('Horizonte Metodológico 2026–2027 · Medición y Calibración en Terreno');
    expect(parsed.respaldo_title).toBe('Límites y Responsabilidad Científica');
  });

  it('preserves custom overrides for scientific axes', () => {
    const custom: Partial<CienciaSettings> = {
      title: 'Ciencia del Bosque Nativo',
      title_en: 'Science of the Native Forest',
      triangulacion_title: 'Pureza Austral Verificada',
      triangulacion_title_en: 'Verified Austral Purity',
      estacion_cta_label: 'Reservar Degustación',
      estacion_cta_label_en: 'Book Tasting',
      estacion_cta_href: '/contacto',
    };

    const parsed = parseCienciaSettings(custom as Record<string, unknown>);
    expect(parsed.title).toBe('Ciencia del Bosque Nativo');
    expect(parsed.title_en).toBe('Science of the Native Forest');
    expect(parsed.triangulacion_title).toBe('Pureza Austral Verificada');
    expect(parsed.triangulacion_title_en).toBe('Verified Austral Purity');
    expect(parsed.estacion_cta_label).toBe('Reservar Degustación');
    expect(parsed.estacion_cta_label_en).toBe('Book Tasting');
    expect(parsed.estacion_cta_href).toBe('/contacto');
    // Fallback untouched
    expect(parsed.bioquimica_title).toBe(DEFAULT_CIENCIA_SETTINGS.bioquimica_title);
  });
});
