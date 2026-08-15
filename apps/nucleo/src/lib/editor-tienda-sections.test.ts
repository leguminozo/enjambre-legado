import { describe, expect, it } from 'vitest';
import {
  EDITOR_SECTION_PAIRS,
  filterNavSectionKeys,
  isNestedSettingsKey,
  navVisibleSectionKey,
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

  it('cada par es items ↔ settings sin solaparse', () => {
    const items = EDITOR_SECTION_PAIRS.map((p) => p.items);
    const settings = EDITOR_SECTION_PAIRS.map((p) => p.settings);
    expect(new Set(items).size).toBe(items.length);
    expect(new Set(settings).size).toBe(settings.length);
    expect(items.some((k) => settings.includes(k))).toBe(false);
  });
});
