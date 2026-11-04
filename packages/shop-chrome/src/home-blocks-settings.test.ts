import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPERIENCIAS_HOME_SETTINGS,
  DEFAULT_ALIANZAS_HOME_SETTINGS,
  DEFAULT_LANDING_SECTIONS,
  LANDING_SECTION_LABELS,
  LANDING_SECTION_EDITOR_KEY,
  parseExperienciasHomeSettings,
  parseAlianzasHomeSettings,
  parseLandingLayout,
} from './store-chrome';

describe('Home blocks: Encuentros & Origen y Alianzas & Negocios', () => {
  it('incluye experiencias y alianzas en las secciones por defecto del home', () => {
    const ids = DEFAULT_LANDING_SECTIONS.map((s) => s.id);
    expect(ids).toContain('experiencias');
    expect(ids).toContain('alianzas');
    expect(LANDING_SECTION_LABELS.experiencias).toBe('Encuentros & Origen');
    expect(LANDING_SECTION_LABELS.alianzas).toBe('Alianzas & Negocios');
    expect(LANDING_SECTION_EDITOR_KEY.experiencias).toBe('experiencias_home_settings');
    expect(LANDING_SECTION_EDITOR_KEY.alianzas).toBe('alianzas_home_settings');
  });

  it('parseLandingLayout preserva el orden y estado de experiencias y alianzas', () => {
    const layout = parseLandingLayout({
      sections: [
        { id: 'hero', enabled: true, order: 0 },
        { id: 'experiencias', enabled: false, order: 1 },
        { id: 'alianzas', enabled: true, order: 2 },
      ],
    });
    const exp = layout.sections.find((s) => s.id === 'experiencias');
    const ali = layout.sections.find((s) => s.id === 'alianzas');
    expect(exp).toBeDefined();
    expect(exp?.enabled).toBe(false);
    expect(exp?.order).toBe(1);
    expect(ali).toBeDefined();
    expect(ali?.enabled).toBe(true);
    expect(ali?.order).toBe(2);
  });

  it('parseExperienciasHomeSettings devuelve defaults con null o undefined', () => {
    const parsed = parseExperienciasHomeSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.title);
    expect(parsed.subtitle).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.subtitle);
    expect(parsed.card1_title).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card1_title);
    expect(parsed.card1_href).toBe('/experiencias/territorio');
    expect(parsed.card1_image).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card1_image);
    expect(parsed.card2_title).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card2_title);
    expect(parsed.card2_href).toBe('/experiencias/degustaciones');
    expect(parsed.card2_image).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card2_image);
    expect(parsed.card3_title).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card3_title);
    expect(parsed.card3_href).toBe('/experiencias/talleres');
    expect(parsed.card3_image).toBe(DEFAULT_EXPERIENCIAS_HOME_SETTINGS.card3_image);
  });

  it('parseExperienciasHomeSettings hereda imágenes de experiencias_settings cuando se pasan como fallbacks', () => {
    const fallbackImages = {
      card1_image: 'https://images.example.com/pureo.jpg',
      card2_image: 'https://images.example.com/cata.jpg',
      card3_image: 'https://images.example.com/talleres.jpg',
    };
    const parsed = parseExperienciasHomeSettings(
      {
        title: 'Vivencias',
      },
      fallbackImages,
    );
    expect(parsed.card1_image).toBe('https://images.example.com/pureo.jpg');
    expect(parsed.card2_image).toBe('https://images.example.com/cata.jpg');
    expect(parsed.card3_image).toBe('https://images.example.com/talleres.jpg');

    // Override individual toma precedencia
    const withOverride = parseExperienciasHomeSettings(
      {
        card1_image: 'https://images.example.com/custom-pureo.jpg',
      },
      fallbackImages,
    );
    expect(withOverride.card1_image).toBe('https://images.example.com/custom-pureo.jpg');
    expect(withOverride.card2_image).toBe('https://images.example.com/cata.jpg');
  });

  it('parseExperienciasHomeSettings sanitiza enlaces externos o maliciosos', () => {
    const parsed = parseExperienciasHomeSettings({
      title: 'Encuentros Personalizados',
      card1_href: 'javascript:alert(1)',
      card2_href: '/experiencias/degustaciones',
    });
    expect(parsed.title).toBe('Encuentros Personalizados');
    expect(parsed.card1_href).toBe('/experiencias/territorio');
    expect(parsed.card2_href).toBe('/experiencias/degustaciones');
  });

  it('parseAlianzasHomeSettings devuelve defaults y sanitiza enlaces', () => {
    const parsed = parseAlianzasHomeSettings(null);
    expect(parsed.kicker).toBe(DEFAULT_ALIANZAS_HOME_SETTINGS.kicker);
    expect(parsed.title).toBe(DEFAULT_ALIANZAS_HOME_SETTINGS.title);
    expect(parsed.tag1_label).toBe('Cafeterías');
    expect(parsed.cta_button_href).toBe('/alianzas');

    const custom = parseAlianzasHomeSettings({
      title: 'Colaboraciones Gastronómicas',
      cta_button_href: '/contacto',
    });
    expect(custom.title).toBe('Colaboraciones Gastronómicas');
    expect(custom.cta_button_href).toBe('/contacto');
  });
});
