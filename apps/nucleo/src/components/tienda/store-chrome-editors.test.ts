import { describe, expect, it } from 'vitest';
import { LEGAL_SECTION_KEYS, SETTINGS_SECTION_KEYS, CHROME_MANUAL_EDITOR_KEYS } from './StoreChromeEditors';
import { EDITOR_SECTIONS } from '@/lib/editor-tienda-schema';

describe('Editor de Tienda — secciones singleton', () => {
  it('trata legales y login como ajustes (no lista de fichas)', () => {
    expect(LEGAL_SECTION_KEYS.size).toBe(7);
    for (const key of LEGAL_SECTION_KEYS) {
      expect(SETTINGS_SECTION_KEYS.has(key)).toBe(true);
    }
    expect(SETTINGS_SECTION_KEYS.has('auth_settings')).toBe(true);
    expect(SETTINGS_SECTION_KEYS.has('map_settings')).toBe(true);
  });

  it('los cases del switch son exactamente las secciones con customEditor (sin muertos)', () => {
    // menu_settings va por rama propia; el resto debe coincidir 1:1 con los
    // flags. Si agregas un case sin flag (o viceversa), este test te obliga a
    // decidir: reconectar con paridad o panel genérico. Nunca ambos.
    const flagged = new Set(
      EDITOR_SECTIONS.filter((s) => s.customEditor && s.id !== 'menu_settings').map((s) => s.id),
    );
    expect(new Set(CHROME_MANUAL_EDITOR_KEYS)).toEqual(flagged);
  });
});
