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
  { items: 'contacto', settings: 'contact_settings' },
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

/** Fuente única de section_keys del CMS (BFF + hook). */
export const CMS_SECTION_KEYS = [
  'talleres',
  'colecciones',
  'nosotros',
  'galeria',
  'contacto',
  'ciencia',
  'menu_settings',
  'menu_links',
  'theme_settings',
  'typography_settings',
  'announcement_settings',
  'announcement_slides',
  'footer_settings',
  'footer_social',
  'pwa_nav_settings',
  'pwa_nav_items',
  'brand_assets',
  'landing_layout',
  'catalog_settings',
  'pdp_settings',
  'seo_defaults',
  'contact_settings',
  'checkout_settings',
  'cart_settings',
  'campaign_banners',
  'seasonal_settings',
  'conservation_content',
  'media_items',
  'video_settings',
  'map_settings',
  'products_settings',
  'collections_settings',
  'galeria_settings',
  'nosotros_settings',
  'media_settings',
  'ciencia_settings',
  'auth_settings',
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
] as const;

export type CmsSectionKey = (typeof CMS_SECTION_KEYS)[number];

/**
 * Chrome / formato: PATCH escribe `content` vivo.
 * Copy largo (legales, evidencia, fichas) sigue en draft_content.
 */
export const AUTO_PUBLISH_SECTIONS = new Set<string>([
  'theme_settings',
  'typography_settings',
  'announcement_settings',
  'announcement_slides',
  'footer_settings',
  'footer_social',
  'pwa_nav_settings',
  'pwa_nav_items',
  'brand_assets',
  'catalog_settings',
  'pdp_settings',
  'seo_defaults',
  'contact_settings',
  'checkout_settings',
  'cart_settings',
  'campaign_banners',
  'seasonal_settings',
  'menu_settings',
  'menu_links',
  'landing_layout',
  'auth_settings',
  'media_settings',
  'video_settings',
  'map_settings',
  'products_settings',
  'collections_settings',
  'galeria_settings',
  'nosotros_settings',
  'ciencia_settings',
]);

/** Contenido que el operador edita: borrador si existe, si no lo publicado. */
export function workingCmsContent(item: {
  content: Record<string, unknown>;
  draft_content?: Record<string, unknown> | null;
}): Record<string, unknown> {
  return item.draft_content != null ? item.draft_content : item.content;
}

export const LEGAL_SECTION_KEYS_LIST = [
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
] as const;
