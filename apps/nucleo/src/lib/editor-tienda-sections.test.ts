import { describe, expect, it } from 'vitest';
import {
  AUTO_PUBLISH_SECTIONS,
  CMS_SECTION_KEYS,
  EDITOR_SECTION_PAIRS,
  filterNavSectionKeys,
  isNestedSettingsKey,
  navVisibleSectionKey,
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
