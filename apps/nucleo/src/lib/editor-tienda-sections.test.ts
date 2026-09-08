import { describe, expect, it } from 'vitest';
import {
  AUTO_PUBLISH_SECTIONS,
  CMS_SECTION_KEYS,
  EDITOR_SECTION_PAIRS,
  HOME_SECTION_KEYS,
  PAGE_WORKSPACE_DEFS,
  PAGE_WORKSPACE_ORDER,
  WORKSPACE_OWNED_SECTION_KEYS,
  filterCategorySectionKeys,
  filterNavSectionKeys,
  isNestedSettingsKey,
  navVisibleSectionKey,
  resolveEditorNavTarget,
  workingCmsContent,
} from './editor-tienda-sections';

describe('editor-tienda-sections', () => {
  it('un carrusel: media_settings vive dentro de media_items', () => {
    expect(navVisibleSectionKey('media_settings')).toBe('media_items');
    expect(isNestedSettingsKey('media_settings')).toBe(true);
    expect(isNestedSettingsKey('media_items')).toBe(false);
  });

  it('el nav no lista los *_settings anidados (evita dos carruseles)', () => {
    const keys = ['media_items', 'media_settings', 'video_settings', 'colecciones', 'collections_settings'];
    expect(filterNavSectionKeys(keys)).toEqual(['media_items', 'video_settings', 'colecciones']);
  });

  it('el CMS lista media_settings pero el nav nunca lo muestra', () => {
    expect(filterNavSectionKeys([...CMS_SECTION_KEYS])).not.toContain('media_settings');
    expect(filterNavSectionKeys([...CMS_SECTION_KEYS])).toContain('media_items');
    expect(filterNavSectionKeys([...CMS_SECTION_KEYS])).not.toContain('contact_settings');
    expect(filterNavSectionKeys([...CMS_SECTION_KEYS])).toContain('contacto');
  });

  it('todos los *_settings con ficha hermana están emparejados', () => {
    const pairedSettings = new Set(EDITOR_SECTION_PAIRS.map((p) => p.settings));
    const settingsLike = CMS_SECTION_KEYS.filter((k) => k.endsWith('_settings'));
    const shouldHaveTwin = [
      'media_settings',
      'collections_settings',
      'galeria_settings',
      'nosotros_settings',
      'ciencia_settings',
      'announcement_settings',
      'menu_settings',
      'footer_settings',
      'pwa_nav_settings',
      'contact_settings',
    ];
    for (const k of shouldHaveTwin) {
      expect(pairedSettings.has(k)).toBe(true);
      expect(settingsLike).toContain(k);
    }
  });

  it('cada par es items ↔ settings sin solaparse', () => {
    const items = EDITOR_SECTION_PAIRS.map((p) => p.items);
    const settings = EDITOR_SECTION_PAIRS.map((p) => p.settings);
    expect(new Set(items).size).toBe(items.length);
    expect(new Set(settings).size).toBe(settings.length);
    expect(items.some((k) => settings.includes(k))).toBe(false);
  });
});

describe('AUTO_PUBLISH / keys', () => {
  it('el orden del home y el formato del carrusel se publican solos', () => {
    expect(AUTO_PUBLISH_SECTIONS.has('landing_layout')).toBe(true);
    expect(AUTO_PUBLISH_SECTIONS.has('media_settings')).toBe(true);
    expect(AUTO_PUBLISH_SECTIONS.has('auth_settings')).toBe(true);
  });

  it('legales y fichas de contenido no se publican solos', () => {
    expect(AUTO_PUBLISH_SECTIONS.has('legal_terminos')).toBe(false);
    expect(AUTO_PUBLISH_SECTIONS.has('media_items')).toBe(false);
    expect(AUTO_PUBLISH_SECTIONS.has('colecciones')).toBe(false);
    expect(AUTO_PUBLISH_SECTIONS.has('conservation_content')).toBe(false);
  });

  it('workingCmsContent prefiere el borrador', () => {
    expect(
      workingCmsContent({
        content: { title: 'vivo' },
        draft_content: { title: 'borrador' },
      }),
    ).toEqual({ title: 'borrador' });
    expect(workingCmsContent({ content: { title: 'vivo' }, draft_content: null })).toEqual({
      title: 'vivo',
    });
  });

  it('todo par settings está en el catálogo CMS y en auto-publish', () => {
    for (const pair of EDITOR_SECTION_PAIRS) {
      expect(CMS_SECTION_KEYS).toContain(pair.items);
      expect(CMS_SECTION_KEYS).toContain(pair.settings);
      expect(AUTO_PUBLISH_SECTIONS.has(pair.settings)).toBe(true);
    }
  });
});

describe('workspaces: una entrada por capacidad', () => {
  it('las categorías no listan keys que ya viven en un workspace', () => {
    expect(filterCategorySectionKeys([...CMS_SECTION_KEYS])).toEqual([]);
  });

  it('cada key visible del CMS tiene un dueño y no se solapa entre workspaces', () => {
    const claimed: string[] = [];
    for (const key of HOME_SECTION_KEYS) claimed.push(key);
    for (const id of PAGE_WORKSPACE_ORDER) {
      for (const node of PAGE_WORKSPACE_DEFS[id].nodes) claimed.push(node.sectionKey);
    }
    expect(new Set(claimed).size).toBe(claimed.length);
    for (const key of claimed) {
      expect(CMS_SECTION_KEYS, `${key} no está en el CMS`).toContain(key);
      expect(WORKSPACE_OWNED_SECTION_KEYS.has(key)).toBe(true);
    }
    const visible = filterNavSectionKeys([...CMS_SECTION_KEYS]);
    for (const key of visible) {
      expect(resolveEditorNavTarget(key).kind, `${key} quedó huérfana`).not.toBe('category');
    }
  });

  it('el settings anidado abre el mismo workspace que las fichas', () => {
    expect(resolveEditorNavTarget('media_settings')).toEqual({ kind: 'home', node: 'media' });
    expect(resolveEditorNavTarget('contact_settings')).toEqual({
      kind: 'page',
      workspace: 'pages',
      sectionKey: 'contacto',
    });
    expect(resolveEditorNavTarget('menu_settings')).toEqual({
      kind: 'page',
      workspace: 'menu',
      sectionKey: 'menu_links',
    });
    expect(resolveEditorNavTarget('catalog_settings')).toEqual({
      kind: 'page',
      workspace: 'catalog',
      sectionKey: 'catalog_settings',
    });
    expect(resolveEditorNavTarget('theme_settings')).toEqual({
      kind: 'page',
      workspace: 'appearance',
      sectionKey: 'theme_settings',
    });
    expect(resolveEditorNavTarget('announcement_settings')).toEqual({
      kind: 'page',
      workspace: 'campaigns',
      sectionKey: 'announcement_slides',
    });
    expect(resolveEditorNavTarget('campaign_banners')).toEqual({
      kind: 'page',
      workspace: 'campaigns',
      sectionKey: 'campaign_banners',
    });
    expect(resolveEditorNavTarget('seasonal_settings')).toEqual({
      kind: 'page',
      workspace: 'campaigns',
      sectionKey: 'seasonal_settings',
    });
    expect(resolveEditorNavTarget('auth_settings')).toEqual({
      kind: 'page',
      workspace: 'pages',
      sectionKey: 'auth_settings',
    });
    expect(resolveEditorNavTarget('legal_privacidad')).toEqual({
      kind: 'page',
      workspace: 'legal',
      sectionKey: 'legal_privacidad',
    });
  });

  it('una key desconocida cae a categoría (no se pierde)', () => {
    expect(resolveEditorNavTarget('seccion_nueva_futura')).toEqual({ kind: 'category' });
    expect(filterCategorySectionKeys(['seccion_nueva_futura', 'media_settings'])).toEqual([
      'seccion_nueva_futura',
    ]);
  });
});
