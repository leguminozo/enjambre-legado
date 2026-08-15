/**
 * Registro de pares del Editor de Tienda.
 *
 * El CMS guarda formato (singleton *_settings) y fichas (lista) en section_keys
 * distintas. En el nav eso se leía como dos bloques (p.ej. dos carruseles).
 * Un bloque de tienda = una entrada; el formato se edita arriba de las fichas.
 */

export type EditorSectionPair = {
  items: string;
  settings: string;
};

export const EDITOR_SECTION_PAIRS: readonly EditorSectionPair[] = [
  { items: 'media_items', settings: 'media_settings' },
  { items: 'colecciones', settings: 'collections_settings' },
  { items: 'galeria', settings: 'galeria_settings' },
  { items: 'nosotros', settings: 'nosotros_settings' },
  { items: 'ciencia', settings: 'ciencia_settings' },
  { items: 'announcement_slides', settings: 'announcement_settings' },
  { items: 'menu_links', settings: 'menu_settings' },
  { items: 'footer_social', settings: 'footer_settings' },
  { items: 'pwa_nav_items', settings: 'pwa_nav_settings' },
] as const;

export const NESTED_SETTINGS_KEYS = new Set(EDITOR_SECTION_PAIRS.map((p) => p.settings));

export const ITEMS_KEY_FOR_SETTINGS: Record<string, string> = Object.fromEntries(
  EDITOR_SECTION_PAIRS.map((p) => [p.settings, p.items]),
);

export const SETTINGS_KEY_FOR_ITEMS: Record<string, string> = Object.fromEntries(
  EDITOR_SECTION_PAIRS.map((p) => [p.items, p.settings]),
);

/** Key que debe quedar seleccionada en el nav (nunca el *_settings anidado). */
export function navVisibleSectionKey(key: string): string {
  return ITEMS_KEY_FOR_SETTINGS[key] ?? key;
}

export function isNestedSettingsKey(key: string): boolean {
  return NESTED_SETTINGS_KEYS.has(key);
}

export function filterNavSectionKeys(keys: readonly string[]): string[] {
  return keys.filter((k) => !NESTED_SETTINGS_KEYS.has(k));
}
