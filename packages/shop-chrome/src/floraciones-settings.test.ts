import { describe, it, expect } from 'vitest';
import {
  parseFloracionesPageSettings,
  DEFAULT_FLORACIONES_PAGE_SETTINGS,
  type FloracionesPageSettings,
} from './store-chrome';

describe('Floraciones Page Settings Parser', () => {
  it('parses null or empty settings falling back to defaults', () => {
    const parsed = parseFloracionesPageSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_FLORACIONES_PAGE_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_FLORACIONES_PAGE_SETTINGS.title);
    expect(parsed.subtitle).toBe(DEFAULT_FLORACIONES_PAGE_SETTINGS.subtitle);
    expect(parsed.badge1).toBe('Predio Pureo, Queilén');
    expect(parsed.badge2).toBe('Sin Trashumancia');
    expect(parsed.badge3).toBe('Centrifugado en Frío');
    expect(parsed.manifiesto_title).toBe('Por qué nuestras colmenas nunca viajan');
    expect(parsed.manifiesto_cta_href).toBe('/catalogo');
  });

  it('preserves custom overrides and bilingual text', () => {
    const custom: Partial<FloracionesPageSettings> = {
      title: 'Calendario Floral Austral',
      title_en: 'Austral Floral Calendar',
      manifiesto_title: 'Santuario de Colmenas Fijas',
      manifiesto_title_en: 'Stationary Hive Sanctuary',
      manifiesto_cta_label: 'Ver Cosechas',
      manifiesto_cta_href: '/origen',
    };

    const parsed = parseFloracionesPageSettings(custom as Record<string, unknown>);
    expect(parsed.title).toBe('Calendario Floral Austral');
    expect(parsed.title_en).toBe('Austral Floral Calendar');
    expect(parsed.manifiesto_title).toBe('Santuario de Colmenas Fijas');
    expect(parsed.manifiesto_title_en).toBe('Stationary Hive Sanctuary');
    expect(parsed.manifiesto_cta_href).toBe('/origen');
    expect(parsed.badge1).toBe(DEFAULT_FLORACIONES_PAGE_SETTINGS.badge1);
  });
});
