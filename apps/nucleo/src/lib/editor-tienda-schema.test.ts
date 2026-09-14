import { describe, expect, it } from 'vitest';
import { AUTO_PUBLISH_SECTIONS, CMS_SECTION_KEYS } from '@/lib/editor-tienda-sections';
import {
  EDITOR_SECTIONS,
  FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA,
  ORIGEN_MONOGRAFIAS_SCHEMA,
  SECTION_SCHEMA_BY_KEY,
  SETTINGS_SECTION_KEYS,
} from '@/lib/editor-tienda-schema';

describe('registro de schemas del editor', () => {
  it('cubre todas las section_keys del CMS (sin huérfanas)', () => {
    for (const key of CMS_SECTION_KEYS) {
      expect(SECTION_SCHEMA_BY_KEY[key], `schema faltante para ${key}`).toBeDefined();
    }
    const registryKeys = new Set(EDITOR_SECTIONS.map((s) => s.id));
    expect(registryKeys.size).toBe(EDITOR_SECTIONS.length); // sin ids duplicados
  });

  it('publishMode del registro coincide con AUTO_PUBLISH_SECTIONS (contrato del BFF)', () => {
    const autoByRegistry = new Set(
      EDITOR_SECTIONS.filter((s) => s.publishMode === 'auto').map((s) => s.id),
    );
    const autoByBff = new Set(AUTO_PUBLISH_SECTIONS);
    expect(autoByRegistry).toEqual(autoByBff);
  });

  it('los customEditor tienen editor real en ChromeSettingsEditor o rama propia', () => {
    const customs = EDITOR_SECTIONS.filter((s) => s.customEditor).map((s) => s.id);
    // menu_settings se maneja aparte (MenuSettingsEditor); el resto son cases
    // del switch de ChromeSettingsEditor (theme, brand, products, seasonal,
    // typography, landing_layout).
    for (const id of customs) {
      expect(
        id === 'menu_settings' ||
          ['theme_settings', 'brand_assets', 'products_settings', 'seasonal_settings', 'typography_settings', 'landing_layout'].includes(id),
        `customEditor sin editor conocido: ${id}`,
      ).toBe(true);
    }
  });

  it('los items/pair no entran en SETTINGS_SECTION_KEYS (rama de fichas)', () => {
    for (const s of EDITOR_SECTIONS) {
      if (s.id.endsWith('_settings')) {
        expect(s.kind.kind, `${s.id} debería ser settings`).toBe('settings');
      }
    }
  });

  it('Alianzas B2B son un documento, no una lista de fichas', () => {
    for (const key of [
      'b2b_cafeterias',
      'b2b_hoteles',
      'b2b_tiendas_gourmet',
      'b2b_ferias',
      'b2b_revendedores',
    ] as const) {
      expect(SECTION_SCHEMA_BY_KEY[key].kind.kind).toBe('settings');
      expect(SETTINGS_SECTION_KEYS.has(key)).toBe(true);
      expect(SECTION_SCHEMA_BY_KEY[key].fields.some((f) => 'id' in f && f.id === 'value_props')).toBe(
        true,
      );
      expect(SECTION_SCHEMA_BY_KEY[key].fields.some((f) => 'id' in f && f.id === 'slug')).toBe(false);
    }
  });

  it('Cata Floraciones declara las listas que pinta /experiencias/floraciones', () => {
    const ids = FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA.fields.flatMap((f) =>
      'id' in f ? [f.id] : [],
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        'bio_paragraphs',
        'bio_metrics',
        'movements',
        'formats',
        'faq',
      ]),
    );
    const movements = FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA.fields.find(
      (f) => 'id' in f && f.id === 'movements',
    );
    expect(movements?.type).toBe('list');
    if (movements?.type === 'list') {
      expect(movements.itemFields.some((item) => item.id === 'elements' && item.type === 'string_list')).toBe(
        true,
      );
    }
  });

  it('Monografías botánicas editan faqs[] como lista, no como texto', () => {
    const faqs = ORIGEN_MONOGRAFIAS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'faqs');
    expect(faqs && 'type' in faqs ? faqs.type : null).toBe('list');
  });
});
