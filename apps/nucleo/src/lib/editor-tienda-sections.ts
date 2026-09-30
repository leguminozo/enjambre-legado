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
  { items: 'talleres', settings: 'experiencias_talleres_settings' },
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
  'identidad_settings',
  'club_legado_settings',
  'club_page_settings',
  'reserva_anual',
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
  'b2b_cafeterias',
  'b2b_hoteles',
  'b2b_tiendas_gourmet',
  'b2b_ferias',
  'b2b_revendedores',
  'b2b_hub_settings',
  'origen_settings',
  'origen_monografias',
  'experiencias_settings',
  'experiencias_pureo_settings',
  'experiencias_talleres_settings',
  'floraciones_experience_settings',
  'floraciones_page_settings',
  'qr_scan_settings',
  'experiencias_home_settings',
  'alianzas_home_settings',
  'perfil_inicio_settings',
  'perfil_trazabilidad_settings',
  'perfil_pedidos_settings',
  'perfil_suscripciones_settings',
  'perfil_resenas_settings',
  'perfil_retorno_settings',
  'perfil_billetera_settings',
] as const;

export type CmsSectionKey = (typeof CMS_SECTION_KEYS)[number];

/**
 * Todo autopublica: PATCH/POST escribe `content` vivo.
 * Sin flujo borrador — la tienda lee lo guardado al instante.
 */
export const AUTO_PUBLISH_SECTIONS = new Set<string>(CMS_SECTION_KEYS);

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
  | 'identidad'
  | 'conservation'
  | 'collections'
  | 'media'
  | 'products'
  | 'video'
  | 'club_legado'
  | 'map'
  | 'experiencias'
  | 'alianzas';

export type PageWorkspaceId =
  | 'catalog'
  | 'experiences'
  | 'bioculture'
  | 'pages'
  | 'b2b'
  | 'menu'
  | 'campaigns'
  | 'appearance'
  | 'legal';

export type EditorNavTarget =
  | { kind: 'home'; node: HomeWorkspaceNode }
  | { kind: 'page'; workspace: PageWorkspaceId; sectionKey: string }
  | { kind: 'category' };

export const HOME_SECTION_KEYS = [
  'landing_layout',
  'identidad_settings',
  'conservation_content',
  'colecciones',
  'media_items',
  'products_settings',
  'video_settings',
  'club_legado_settings',
  'map_settings',
  'experiencias_home_settings',
  'alianzas_home_settings',
] as const;

export const HOME_KEY_TO_NODE: Record<(typeof HOME_SECTION_KEYS)[number], HomeWorkspaceNode> = {
  landing_layout: 'hero',
  identidad_settings: 'identidad',
  conservation_content: 'conservation',
  colecciones: 'collections',
  media_items: 'media',
  products_settings: 'products',
  video_settings: 'video',
  club_legado_settings: 'club_legado',
  map_settings: 'map',
  experiencias_home_settings: 'experiencias',
  alianzas_home_settings: 'alianzas',
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
    hint: 'Listado, ficha, carrito, checkout y trazabilidad QR',
    nodes: [
      { id: 'catalog', label: 'Listado', sectionKey: 'catalog_settings', previewPath: '/catalogo' },
      { id: 'pdp', label: 'Ficha de producto', sectionKey: 'pdp_settings', previewPath: '/catalogo' },
      { id: 'cart', label: 'Carrito', sectionKey: 'cart_settings', previewPath: '/carrito' },
      { id: 'checkout', label: 'Checkout', sectionKey: 'checkout_settings', previewPath: '/checkout' },
      { id: 'qr_scan', label: 'Escáner QR & Trazabilidad', sectionKey: 'qr_scan_settings', previewPath: '/qr-scan' },
    ],
  },
  experiences: {
    label: 'Experiencias',
    hint: 'Hub, territorio en Chiloé, degustaciones de mieles de Chile y talleres de técnica apícola',
    nodes: [
      { id: 'experiencias', label: 'Experiencias (Hub)', sectionKey: 'experiencias_settings', previewPath: '/experiencias' },
      { id: 'experiencias_pureo', label: 'Territorio (Chiloé)', sectionKey: 'experiencias_pureo_settings', previewPath: '/experiencias/territorio' },
      { id: 'floraciones', label: 'Degustaciones (Mieles de Chile)', sectionKey: 'floraciones_experience_settings', previewPath: '/experiencias/degustaciones' },
      { id: 'talleres', label: 'Talleres de Técnica Apícola', sectionKey: 'talleres', previewPath: '/experiencias/talleres' },
    ],
  },
  bioculture: {
    label: 'Territorio & Origen',
    hint: 'Origen apícola, monografías botánicas y respaldo científico',
    nodes: [
      { id: 'origen', label: 'Origen & Floraciones', sectionKey: 'origen_settings', previewPath: '/origen' },
      { id: 'origen_monografias', label: 'Fichas Botánicas', sectionKey: 'origen_monografias', previewPath: '/origen/ulmo' },
      { id: 'floraciones_page', label: 'Calendario Floraciones', sectionKey: 'floraciones_page_settings', previewPath: '/floraciones' },
      { id: 'ciencia', label: 'Ciencia & Respaldo', sectionKey: 'ciencia', previewPath: '/ciencia' },
    ],
  },
  pages: {
    label: 'Páginas y Marca',
    hint: 'Nosotros, galería fotográfica, club, reservas y contacto',
    nodes: [
      { id: 'nosotros', label: 'Nosotros', sectionKey: 'nosotros', previewPath: '/nosotros' },
      { id: 'galeria', label: 'Galería', sectionKey: 'galeria', previewPath: '/galeria' },
      { id: 'club_page', label: 'Club Legado', sectionKey: 'club_page_settings', previewPath: '/club-legado-del-bosque' },
      { id: 'reserva_anual', label: 'Reserva Anual', sectionKey: 'reserva_anual', previewPath: '/perfil/reservas' },
      { id: 'contacto', label: 'Contacto', sectionKey: 'contacto', previewPath: '/contacto' },
    ],
  },
  b2b: {
    label: 'Alianzas B2B',
    hint: 'Portal matriz, cafeterías, hoteles, tiendas gourmet, ferias y revendedores',
    nodes: [
      { id: 'b2b_hub', label: 'Portal Alianzas (/alianzas)', sectionKey: 'b2b_hub_settings', previewPath: '/alianzas' },
      { id: 'b2b_cafeterias', label: 'Cafeterías', sectionKey: 'b2b_cafeterias', previewPath: '/alianzas/cafeterias' },
      { id: 'b2b_hoteles', label: 'Hoteles', sectionKey: 'b2b_hoteles', previewPath: '/alianzas/hoteles' },
      { id: 'b2b_tiendas', label: 'Tiendas Gourmet', sectionKey: 'b2b_tiendas_gourmet', previewPath: '/alianzas/tiendas-gourmet' },
      { id: 'b2b_ferias', label: 'Ferias', sectionKey: 'b2b_ferias', previewPath: '/alianzas/ferias' },
      { id: 'b2b_revendedores', label: 'Revendedores', sectionKey: 'b2b_revendedores', previewPath: '/alianzas/revendedores' },
    ],
  },
  menu: {
    label: 'Menú y pie',
    hint: 'Navegación visible en toda la tienda',
    nodes: [
      { id: 'menu', label: 'Menú', sectionKey: 'menu_links', previewPath: '' },
      { id: 'footer', label: 'Pie', sectionKey: 'footer_social', previewPath: '' },
      { id: 'pwa', label: 'Barra de app', sectionKey: 'pwa_nav_items', previewPath: '' },
    ],
  },
  campaigns: {
    label: 'Avisos y campañas',
    hint: 'Anuncios rotativos, banners y temporada',
    nodes: [
      { id: 'announce', label: 'Anuncio superior', sectionKey: 'announcement_slides', previewPath: '' },
      { id: 'banners', label: 'Banners campaña', sectionKey: 'campaign_banners', previewPath: '' },
      { id: 'seasonal', label: 'Temporada', sectionKey: 'seasonal_settings', previewPath: '' },
    ],
  },
  appearance: {
    label: 'Apariencia y Acceso',
    hint: 'Marca, tema, tipografía, SEO y login/registro',
    nodes: [
      { id: 'brand', label: 'Marca y logos', sectionKey: 'brand_assets', previewPath: '' },
      { id: 'theme', label: 'Tema', sectionKey: 'theme_settings', previewPath: '' },
      { id: 'type', label: 'Tipografía', sectionKey: 'typography_settings', previewPath: '' },
      { id: 'seo', label: 'SEO', sectionKey: 'seo_defaults', previewPath: '' },
      { id: 'auth', label: 'Login / Registro', sectionKey: 'auth_settings', previewPath: '/login' },
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
  perfil: {
    label: 'Perfil de Cliente',
    hint: 'Dashboard, trazabilidad, pedidos, suscripciones, reseñas, retorno y billetera',
    nodes: [
      { id: 'perfil_inicio', label: 'Inicio', sectionKey: 'perfil_inicio_settings', previewPath: '/perfil' },
      { id: 'perfil_trazabilidad', label: 'Origen y Trazabilidad', sectionKey: 'perfil_trazabilidad_settings', previewPath: '/perfil/trazabilidad' },
      { id: 'perfil_pedidos', label: 'Pedidos', sectionKey: 'perfil_pedidos_settings', previewPath: '/perfil/pedidos' },
      { id: 'perfil_suscripciones', label: 'Suscripciones y Reservas', sectionKey: 'perfil_suscripciones_settings', previewPath: '/perfil/reposicion' },
      { id: 'perfil_resenas', label: 'Mis Reseñas', sectionKey: 'perfil_resenas_settings', previewPath: '/perfil/resenas' },
      { id: 'perfil_retorno', label: 'Retorno de Frascos', sectionKey: 'perfil_retorno_settings', previewPath: '/perfil/circular' },
      { id: 'perfil_billetera', label: 'Billetera y Beneficios', sectionKey: 'perfil_billetera_settings', previewPath: '/perfil/billetera' },
    ],
  },
};

export const PAGE_WORKSPACE_ORDER: readonly PageWorkspaceId[] = [
  'catalog',
  'experiences',
  'bioculture',
  'pages',
  'b2b',
  'menu',
  'campaigns',
  'appearance',
  'legal',
  'perfil',
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
