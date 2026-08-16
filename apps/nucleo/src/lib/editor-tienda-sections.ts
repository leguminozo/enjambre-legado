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

/**
 * Una capacidad = una entrada de nav.
 * Los workspaces (Inicio / Catálogo / Páginas / Menú / Legales / Apariencia)
 * son dueños de estas keys. Las categorías Bloques/Diseño/Otras no las
 * vuelven a listar: el editor real se conserva, solo se quita el atajo gemelo.
 */
export type HomeWorkspaceNode =
  | 'hero'
  | 'conservation'
  | 'collections'
  | 'media'
  | 'products'
  | 'video'
  | 'map';

export type PageWorkspaceId = 'catalog' | 'pages' | 'menu' | 'legal' | 'appearance';

export type EditorNavTarget =
  | { kind: 'home'; node: HomeWorkspaceNode }
  | { kind: 'page'; workspace: PageWorkspaceId; sectionKey: string }
  | { kind: 'category' };

export const HOME_SECTION_KEYS = [
  'landing_layout',
  'conservation_content',
  'colecciones',
  'media_items',
  'products_settings',
  'video_settings',
  'map_settings',
] as const;

export const HOME_KEY_TO_NODE: Record<(typeof HOME_SECTION_KEYS)[number], HomeWorkspaceNode> = {
  landing_layout: 'hero',
  conservation_content: 'conservation',
  colecciones: 'collections',
  media_items: 'media',
  products_settings: 'products',
  video_settings: 'video',
  map_settings: 'map',
};

export type PageWorkspaceNodeDef = {
  id: string;
  label: string;
  sectionKey: string;
  previewPath: string;
};

export const PAGE_WORKSPACE_DEFS: Record<
  PageWorkspaceId,
  { label: string; hint: string; nodes: readonly PageWorkspaceNodeDef[] }
> = {
  catalog: {
    label: 'Catálogo',
    hint: 'Listado, ficha, carrito y pago',
    nodes: [
      { id: 'catalog', label: 'Listado', sectionKey: 'catalog_settings', previewPath: '/catalogo' },
      { id: 'pdp', label: 'Ficha de producto', sectionKey: 'pdp_settings', previewPath: '/catalogo' },
      { id: 'cart', label: 'Carrito', sectionKey: 'cart_settings', previewPath: '/carrito' },
      { id: 'checkout', label: 'Checkout', sectionKey: 'checkout_settings', previewPath: '/checkout' },
    ],
  },
  pages: {
    label: 'Páginas',
    hint: 'Talleres, nosotros, galería, contacto y ciencia',
    nodes: [
      { id: 'talleres', label: 'Talleres', sectionKey: 'talleres', previewPath: '/experiencias' },
      { id: 'nosotros', label: 'Nosotros', sectionKey: 'nosotros', previewPath: '/nosotros' },
      { id: 'galeria', label: 'Galería', sectionKey: 'galeria', previewPath: '/galeria' },
      { id: 'contacto', label: 'Contacto', sectionKey: 'contacto', previewPath: '/contacto' },
      { id: 'ciencia', label: 'Ciencia', sectionKey: 'ciencia', previewPath: '/ciencia' },
    ],
  },
  menu: {
    label: 'Menú y pie',
    hint: 'Navegación visible en toda la tienda',
    nodes: [
      { id: 'menu', label: 'Menú', sectionKey: 'menu_links', previewPath: '' },
      { id: 'announce', label: 'Anuncio', sectionKey: 'announcement_slides', previewPath: '' },
      { id: 'footer', label: 'Pie', sectionKey: 'footer_social', previewPath: '' },
      { id: 'pwa', label: 'Barra de app', sectionKey: 'pwa_nav_items', previewPath: '' },
    ],
  },
  legal: {
    label: 'Legales',
    hint: 'Términos, privacidad y políticas',
    nodes: [
      { id: 'legal_terminos', label: 'Términos', sectionKey: 'legal_terminos', previewPath: '/terminos' },
      { id: 'legal_privacidad', label: 'Privacidad', sectionKey: 'legal_privacidad', previewPath: '/privacidad' },
      { id: 'legal_cookies', label: 'Cookies', sectionKey: 'legal_cookies', previewPath: '/cookies' },
      { id: 'legal_envio', label: 'Envío', sectionKey: 'legal_envio', previewPath: '/envio' },
      { id: 'legal_reembolso', label: 'Reembolso', sectionKey: 'legal_reembolso', previewPath: '/reembolso' },
      { id: 'legal_cancelacion', label: 'Cancelación', sectionKey: 'legal_cancelacion', previewPath: '/cancelacion' },
      { id: 'legal_garantia', label: 'Garantía', sectionKey: 'legal_garantia', previewPath: '/garantia' },
    ],
  },
  appearance: {
    label: 'Apariencia',
    hint: 'Tema, tipografía, marca, SEO y temporada',
    nodes: [
      { id: 'theme', label: 'Tema', sectionKey: 'theme_settings', previewPath: '' },
      { id: 'type', label: 'Tipografía', sectionKey: 'typography_settings', previewPath: '' },
      { id: 'brand', label: 'Marca', sectionKey: 'brand_assets', previewPath: '' },
      { id: 'seo', label: 'SEO', sectionKey: 'seo_defaults', previewPath: '' },
      { id: 'banners', label: 'Banners campaña', sectionKey: 'campaign_banners', previewPath: '' },
      { id: 'seasonal', label: 'Temporada', sectionKey: 'seasonal_settings', previewPath: '' },
      { id: 'auth', label: 'Login / Registro', sectionKey: 'auth_settings', previewPath: '/login' },
    ],
  },
};

export const PAGE_WORKSPACE_ORDER: readonly PageWorkspaceId[] = [
  'catalog',
  'pages',
  'menu',
  'legal',
  'appearance',
];

export const WORKSPACE_OWNED_SECTION_KEYS = new Set<string>([
  ...HOME_SECTION_KEYS,
  ...Object.values(PAGE_WORKSPACE_DEFS).flatMap((ws) => ws.nodes.map((n) => n.sectionKey)),
]);

/** Keys que las categorías pueden listar (no anidadas y no dueñas de un workspace). */
export function filterCategorySectionKeys(keys: readonly string[]): string[] {
  return filterNavSectionKeys(keys).filter((k) => !WORKSPACE_OWNED_SECTION_KEYS.has(k));
}

export function resolveEditorNavTarget(key: string): EditorNavTarget {
  const visible = navVisibleSectionKey(key);
  const homeNode = HOME_KEY_TO_NODE[visible as (typeof HOME_SECTION_KEYS)[number]];
  if (homeNode) return { kind: 'home', node: homeNode };
  for (const workspace of PAGE_WORKSPACE_ORDER) {
    const owned = PAGE_WORKSPACE_DEFS[workspace].nodes.some((n) => n.sectionKey === visible);
    if (owned) return { kind: 'page', workspace, sectionKey: visible };
  }
  return { kind: 'category' };
}
