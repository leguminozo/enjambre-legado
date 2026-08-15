import { describe, expect, it } from 'vitest';
import { LEGAL_SECTION_KEYS, SETTINGS_SECTION_KEYS } from './StoreChromeEditors';

describe('Editor de Tienda — secciones singleton', () => {
  it('trata legales y login como ajustes (no lista de fichas)', () => {
    expect(LEGAL_SECTION_KEYS.size).toBe(7);
    for (const key of LEGAL_SECTION_KEYS) {
      expect(SETTINGS_SECTION_KEYS.has(key)).toBe(true);
    }
    expect(SETTINGS_SECTION_KEYS.has('auth_settings')).toBe(true);
    expect(SETTINGS_SECTION_KEYS.has('map_settings')).toBe(true);
  });
});
