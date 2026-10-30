import { describe, expect, it } from 'vitest';
import { AUTO_PUBLISH_SECTIONS, CMS_SECTION_KEYS } from '@/lib/editor-tienda-sections';
import {
  EDITOR_SECTIONS,
  EXPERIENCIAS_SETTINGS_SCHEMA,
  EXPERIENCIAS_PUREO_SETTINGS_SCHEMA,
  EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA,
  FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA,
  ORIGEN_MONOGRAFIAS_SCHEMA,
  SCHEMA_SECTION_TEMPLATES,
  SECTION_SCHEMA_BY_KEY,
  SETTINGS_SECTION_KEYS,
  TALLERES_SCHEMA,
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
      'shipping_settings',
      'seo_defaults',
      'auth_settings',
      'territorio_layout',
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
      expect(SECTION_SCHEMA_BY_KEY[key].fields.some((f) => 'id' in f && f.id === 'hero_image_opacity')).toBe(true);
    }
  });

  it('todos los schemas de Experiencias y Alianzas con hero_image declaran hero_image_opacity', () => {
    const heroSections = [
      'experiencias_settings',
      'experiencias_pureo_settings',
      'floraciones_experience_settings',
      'experiencias_talleres_settings',
      'b2b_hub_settings',
      'b2b_cafeterias',
      'b2b_hoteles',
      'b2b_tiendas_gourmet',
      'b2b_ferias',
      'b2b_revendedores',
    ] as const;

    for (const key of heroSections) {
      const schema = SECTION_SCHEMA_BY_KEY[key];
      expect(schema, `schema ${key}`).toBeDefined();
      const hasHeroImage = schema.fields.some((f) => 'id' in f && f.id === 'hero_image');
      expect(hasHeroImage, `${key} debe tener hero_image`).toBe(true);
      const opacityField = schema.fields.find((f) => 'id' in f && f.id === 'hero_image_opacity');
      expect(opacityField, `${key} debe tener hero_image_opacity`).toBeDefined();
      expect(opacityField?.type).toBe('range');
    }
  });

  it('Cata Floraciones es un documento de ajustes, no fichas sueltas', () => {
    expect(SETTINGS_SECTION_KEYS.has('floraciones_experience_settings')).toBe(true);
    expect(SECTION_SCHEMA_BY_KEY.floraciones_experience_settings.kind.kind).toBe('settings');
  });

  it('Cata Floraciones declara las listas que pinta /experiencias/degustaciones', () => {
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

  it('Hub de Experiencias permite editar etiqueta superior, especificaciones y agenda', () => {
    const card1Tag = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find(
      (f) => 'id' in f && f.id === 'card1_tag',
    );
    const flagshipTag = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find(
      (f) => 'id' in f && f.id === 'flagship_tag',
    );
    const card3Tag = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find(
      (f) => 'id' in f && f.id === 'card3_tag',
    );

    expect(card1Tag && 'label' in card1Tag ? card1Tag.label : null).toBe('Etiqueta superior');
    expect(flagshipTag && 'label' in flagshipTag ? flagshipTag.label : null).toBe('Etiqueta superior');
    expect(card3Tag && 'label' in card3Tag ? card3Tag.label : null).toBe('Etiqueta superior');

    const flagshipFormat = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'flagship_format');
    const flagshipCapacity = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'flagship_capacity');
    const flagshipDuration = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'flagship_duration');
    const card3CtaHref = EXPERIENCIAS_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'card3_cta_href');
    expect(flagshipFormat).toBeDefined();
    expect(flagshipCapacity).toBeDefined();
    expect(flagshipDuration).toBeDefined();
    expect(card3CtaHref).toBeDefined();
    expect(TALLERES_SCHEMA.previewPath).toBe('/experiencias/talleres');
  });

  it('Experiencias Pureo permite editar pilares, distintivos y formulario de solicitud', () => {
    const pilaresKicker = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'pilares_kicker');
    const pilaresTitle = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'pilares_title');
    const cabanaBadge = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'cabana_badge');
    const kayakBadge = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'kayak_badge');
    const apiturismoBadge = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'apiturismo_badge');
    const solicitudKicker = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'solicitud_kicker');
    const solicitudTitle = EXPERIENCIAS_PUREO_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'solicitud_title');

    expect(pilaresKicker).toBeDefined();
    expect(pilaresTitle).toBeDefined();
    expect(cabanaBadge).toBeDefined();
    expect(kayakBadge).toBeDefined();
    expect(apiturismoBadge).toBeDefined();
    expect(solicitudKicker).toBeDefined();
    expect(solicitudTitle).toBeDefined();
  });

  it('Experiencias Talleres permite editar curatoria, etiquetas y especificaciones', () => {
    const curatoriaKicker = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'curatoria_kicker');
    const curatoriaTitle = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'curatoria_title');
    const prog1Tag = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'programa1_tag');
    const prog1Spec1 = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'programa1_spec1');
    const prog1Spec2 = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'programa1_spec2');
    const prog2Tag = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'programa2_tag');
    const prog3Tag = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'programa3_tag');
    const convocatoriasTitle = EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA.fields.find((f) => 'id' in f && f.id === 'convocatorias_title');

    expect(curatoriaKicker).toBeDefined();
    expect(curatoriaTitle).toBeDefined();
    expect(prog1Tag).toBeDefined();
    expect(prog1Spec1).toBeDefined();
    expect(prog1Spec2).toBeDefined();
    expect(prog2Tag).toBeDefined();
    expect(prog3Tag).toBeDefined();
    expect(convocatoriasTitle).toBeDefined();
  });

  it('SCHEMA_SECTION_TEMPLATES materializa todos los defaults y nunca devuelve {} vacío', () => {
    for (const s of EDITOR_SECTIONS) {
      const tmpl = SCHEMA_SECTION_TEMPLATES[s.id];
      expect(tmpl, `template faltante para ${s.id}`).toBeDefined();
      expect(
        Object.keys(tmpl).length,
        `${s.id} produce un SCHEMA_SECTION_TEMPLATES vacío {}`,
      ).toBeGreaterThan(0);
    }
  });

  it('campos bilingües con default en español tienen traducción _en en el template de la sección', () => {
    for (const s of EDITOR_SECTIONS) {
      const tmpl = (s.template ?? {}) as Record<string, unknown>;
      for (const f of s.fields) {
        if ((f.type === 'text' || f.type === 'textarea') && f.bilingual && f.default) {
          const enVal = tmpl[`${f.id}_en`];
          expect(
            typeof enVal === 'string' && enVal.trim().length > 0,
            `${s.id}.${f.id} tiene default="${f.default}" pero falta ${f.id}_en en template`,
          ).toBe(true);
        }
      }
    }
  });
});
