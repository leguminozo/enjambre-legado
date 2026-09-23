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
    // del switch de ChromeSettingsEditor. REGLA: una sección = un editor.
    // Si agregas un customEditor, agrega su case; si agregas un case, agrega
    // su customEditor. Sin excepciones (evita editores desenchufados).
    const KNOWN_CUSTOM_EDITORS = [
      'theme_settings',
      'brand_assets',
      'products_settings',
      'seasonal_settings',
      'typography_settings',
      'landing_layout',
      'announcement_settings',
      'footer_settings',
      'catalog_settings',
      'pdp_settings',
      'contact_settings',
      'checkout_settings',
      'cart_settings',
      'seo_defaults',
      'auth_settings',
    ];
    for (const id of customs) {
      expect(
        id === 'menu_settings' || KNOWN_CUSTOM_EDITORS.includes(id),
        `customEditor sin editor conocido: ${id}`,
      ).toBe(true);
    }
  });

  it('los customEditor no duplican definición schema (fields vacíos)', () => {
    // El editor manual es dueño de la UX; fields[] poblados + customEditor
    // crean dos fuentes de verdad (una muerta). Ver paridad en el manual.
    for (const s of EDITOR_SECTIONS) {
      if (!s.customEditor) continue;
      expect(s.fields, `${s.id} con customEditor debe tener fields: []`).toEqual([]);
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

  it('Cata Floraciones es un documento de ajustes, no fichas sueltas', () => {
    expect(SETTINGS_SECTION_KEYS.has('floraciones_experience_settings')).toBe(true);
    expect(SECTION_SCHEMA_BY_KEY.floraciones_experience_settings.kind.kind).toBe('settings');
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

  it('ningún template schema-driven deja un array sin editor de lista', () => {
    for (const section of EDITOR_SECTIONS) {
      if (section.customEditor) continue;
      const template = section.template ?? {};
      for (const [key, value] of Object.entries(template)) {
        if (!Array.isArray(value) || value.length === 0) continue;
        const field = section.fields.find((f) => 'id' in f && f.id === key);
        const allScalar = value.every((item) => typeof item === 'string' || typeof item === 'number');
        const hasObject = value.some((item) => item && typeof item === 'object' && !Array.isArray(item));
        if (allScalar) {
          expect(field?.type, `${section.id}.${key} es string[] — falta string_list`).toBe('string_list');
        } else if (hasObject) {
          expect(field?.type, `${section.id}.${key} es object[] — falta list (evita [object Object])`).toBe(
            'list',
          );
        }
      }

      for (const field of section.fields) {
        if (field.type !== 'list') continue;
        const rows = template[field.id];
        if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== 'object') continue;
        const sample = rows[0] as Record<string, unknown>;
        for (const [nestedKey, nestedVal] of Object.entries(sample)) {
          if (!Array.isArray(nestedVal) || !nestedVal.every((item) => typeof item === 'string')) continue;
          expect(
            field.itemFields.some((item) => item.id === nestedKey && item.type === 'string_list'),
            `${section.id}.${field.id}[].${nestedKey} es string[] — falta string_list en la ficha`,
          ).toBe(true);
        }
      }
    }
  });
});
