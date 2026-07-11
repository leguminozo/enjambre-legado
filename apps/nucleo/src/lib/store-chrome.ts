/**
 * Chrome global de tienda — Ola 1 del Editor de Tienda.
 * CMS: theme_settings, announcement_*, footer_settings, footer_social,
 * pwa_bottom_nav, brand_assets.
 */

// ── Theme ──────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';
export type RadiusPreset = 'sm' | 'md' | 'lg';

export type ThemeSettings = {
  default_theme: ThemeMode;
  grain_intensity: number;
  border_radius: RadiusPreset;
  force_dark_public: boolean;
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  default_theme: 'system',
  grain_intensity: 0.35,
  border_radius: 'md',
  force_dark_public: false,
};

// ── Announcement ───────────────────────────────────────────────────────────

export type AnnouncementSettings = {
  enabled: boolean;
  interval_ms: number;
  height_mobile_px: number;
  height_desktop_px: number;
  dismissible: boolean;
};

export type AnnouncementSlide = {
  text: string;
  text_en?: string;
  href?: string;
  link_label?: string;
  link_label_en?: string;
};

export const DEFAULT_ANNOUNCEMENT_SETTINGS: AnnouncementSettings = {
  enabled: true,
  interval_ms: 5000,
  height_mobile_px: 36,
  height_desktop_px: 42,
  dismissible: true,
};

export const DEFAULT_ANNOUNCEMENT_SLIDES: AnnouncementSlide[] = [
  { text: 'Bienvenido a la experiencia digital. Te estábamos esperando' },
  {
    text: 'La historia del bosque comienza ',
    href: 'https://www.obrerayzangano.com/nuestra-historia-or-apicultura-regenerativa-en-chiloe/',
    link_label: 'aquí',
    link_label_en: 'here',
    text_en: 'The forest story begins ',
  },
  { text: 'Directo del bosque a tu hogar', text_en: 'Straight from the forest to your home' },
  { text: 'Hecho artesanalmente. Ritmo naturaleza', text_en: 'Handmade. Nature’s pace' },
  { text: 'Consume menos. Consume mejor', text_en: 'Consume less. Consume better' },
  { text: 'Cada gota regenera bosque nativo', text_en: 'Every drop regenerates native forest' },
  { text: 'Nuestra miel no es producto, es legado', text_en: 'Our honey is not a product — it is legacy' },
  { text: 'Envío gratis comprando desde $55.000', text_en: 'Free shipping from $55.000' },
];

// ── Footer ─────────────────────────────────────────────────────────────────

export type FooterSettings = {
  brand_line1: string;
  brand_line2: string;
  brand_tracking_em: number;
  intro: string;
  intro_en?: string;
  show_newsletter: boolean;
  newsletter_title: string;
  newsletter_title_en?: string;
  newsletter_desc: string;
  newsletter_desc_en?: string;
  newsletter_placeholder: string;
  newsletter_placeholder_en?: string;
  copyright_suffix: string;
  show_social: boolean;
  show_legal: boolean;
};

export type FooterSocialItem = {
  label: string;
  href: string;
  network: 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'x' | 'youtube' | 'other';
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  brand_line1: 'La Obrera',
  brand_line2: 'y el Zángano',
  brand_tracking_em: 0.4,
  intro:
    'Síguenos desde tu entorno digital favorito. Accederás solo a lo esencial. ¡Sé parte de la experiencia completa!',
  intro_en: 'Follow us on your favorite channel. Only the essential. Be part of the full experience!',
  show_newsletter: true,
  newsletter_title: 'Únete al Club Legado del Bosque:',
  newsletter_title_en: 'Join the Forest Legacy Club:',
  newsletter_desc:
    'Suscríbete para no perderte novedades, consejos del néctar y regalos únicos que endulzarán tu existencia.',
  newsletter_desc_en: 'Subscribe for news, nectar tips and unique gifts.',
  newsletter_placeholder: 'Ingresa tu e-mail y únete al Legado del Bosque',
  newsletter_placeholder_en: 'Enter your email and join the Forest Legacy',
  copyright_suffix: 'Todos los derechos reservados.',
  show_social: true,
  show_legal: true,
};

export const DEFAULT_FOOTER_SOCIAL: FooterSocialItem[] = [
  { label: 'WhatsApp', href: 'https://wa.me/56940831358', network: 'whatsapp' },
  { label: 'Instagram', href: 'https://instagram.com/obrera_y_zangano', network: 'instagram' },
  { label: 'Facebook', href: 'https://www.facebook.com/ObreraZangano/', network: 'facebook' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@obrera_y_zangano', network: 'tiktok' },
  { label: 'X', href: 'https://x.com/obrerayzangano', network: 'x' },
  { label: 'YouTube', href: 'https://www.youtube.com/@obrerayzangano', network: 'youtube' },
];

// ── PWA bottom nav ─────────────────────────────────────────────────────────

export type PwaNavIcon = 'home' | 'store' | 'scan' | 'legacy' | 'bag';

export type PwaNavItem = {
  label: string;
  label_en?: string;
  href: string;
  icon: PwaNavIcon;
};

export type PwaNavSettings = {
  enabled: boolean;
};

export const DEFAULT_PWA_NAV_SETTINGS: PwaNavSettings = { enabled: true };

export const DEFAULT_PWA_NAV_ITEMS: PwaNavItem[] = [
  { label: 'Inicio', label_en: 'Home', href: '/', icon: 'home' },
  { label: 'Tienda', label_en: 'Store', href: '/catalogo', icon: 'store' },
  { label: 'Escanear', label_en: 'Scan', href: '/qr-scan', icon: 'scan' },
  { label: 'Legado', label_en: 'Legacy', href: '/perfil', icon: 'legacy' },
  { label: 'Bolsa', label_en: 'Bag', href: '/carrito', icon: 'bag' },
];

// ── Brand assets ───────────────────────────────────────────────────────────

export type BrandAssets = {
  logo_url: string;
  logo_footer_url: string;
  favicon_url: string;
  og_image_url: string;
  /** Display height in header (px). */
  logo_height_px: number;
  /** Max width in header (px); 0 = auto. */
  logo_max_width_px: number;
  /** Display height in footer (px). */
  logo_footer_height_px: number;
};

export const DEFAULT_BRAND_ASSETS: BrandAssets = {
  logo_url: '/icons/icon-192.svg',
  logo_footer_url: '',
  favicon_url: '/icons/icon-192.svg',
  og_image_url: '',
  logo_height_px: 40,
  logo_max_width_px: 180,
  logo_footer_height_px: 48,
};

// ── Bundle ─────────────────────────────────────────────────────────────────

// StoreChromeConfig defined after Ola 2 types (see end of file)
export type StoreChromeConfigOla1 = {
  theme: ThemeSettings;
  announcement: AnnouncementSettings;
  announcementSlides: AnnouncementSlide[];
  footer: FooterSettings;
  footerSocial: FooterSocialItem[];
  pwaNav: PwaNavSettings;
  pwaNavItems: PwaNavItem[];
  brand: BrandAssets;
};

export const DEFAULT_STORE_CHROME_OLA1: StoreChromeConfigOla1 = {
  theme: DEFAULT_THEME_SETTINGS,
  announcement: DEFAULT_ANNOUNCEMENT_SETTINGS,
  announcementSlides: DEFAULT_ANNOUNCEMENT_SLIDES,
  footer: DEFAULT_FOOTER_SETTINGS,
  footerSocial: DEFAULT_FOOTER_SOCIAL,
  pwaNav: DEFAULT_PWA_NAV_SETTINGS,
  pwaNavItems: DEFAULT_PWA_NAV_ITEMS,
  brand: DEFAULT_BRAND_ASSETS,
};

// ── Parsers ────────────────────────────────────────────────────────────────

function asNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  let out = n;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function parseThemeSettings(raw: Record<string, unknown> | null | undefined): ThemeSettings {
  const d = DEFAULT_THEME_SETTINGS;
  if (!raw) return { ...d };
  return {
    default_theme: pickEnum(raw.default_theme, ['dark', 'light', 'system'] as const, d.default_theme),
    grain_intensity: asNumber(raw.grain_intensity, d.grain_intensity, 0, 1),
    border_radius: pickEnum(raw.border_radius, ['sm', 'md', 'lg'] as const, d.border_radius),
    force_dark_public: asBool(raw.force_dark_public, d.force_dark_public),
  };
}

export function parseAnnouncementSettings(
  raw: Record<string, unknown> | null | undefined,
): AnnouncementSettings {
  const d = DEFAULT_ANNOUNCEMENT_SETTINGS;
  if (!raw) return { ...d };
  return {
    enabled: asBool(raw.enabled, d.enabled),
    interval_ms: asNumber(raw.interval_ms, d.interval_ms, 2000, 20000),
    height_mobile_px: asNumber(raw.height_mobile_px, d.height_mobile_px, 28, 64),
    height_desktop_px: asNumber(raw.height_desktop_px, d.height_desktop_px, 28, 72),
    dismissible: asBool(raw.dismissible, d.dismissible),
  };
}

export function parseAnnouncementSlide(raw: Record<string, unknown>): AnnouncementSlide | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  if (!text) return null;
  return {
    text,
    text_en: typeof raw.text_en === 'string' ? raw.text_en : undefined,
    href: typeof raw.href === 'string' && raw.href.trim() ? raw.href.trim() : undefined,
    link_label: typeof raw.link_label === 'string' ? raw.link_label : undefined,
    link_label_en: typeof raw.link_label_en === 'string' ? raw.link_label_en : undefined,
  };
}

export function parseFooterSettings(raw: Record<string, unknown> | null | undefined): FooterSettings {
  const d = DEFAULT_FOOTER_SETTINGS;
  if (!raw) return { ...d };
  return {
    brand_line1: asString(raw.brand_line1, d.brand_line1),
    brand_line2: asString(raw.brand_line2, d.brand_line2),
    brand_tracking_em: asNumber(raw.brand_tracking_em, d.brand_tracking_em, 0, 1),
    intro: asString(raw.intro, d.intro),
    intro_en: typeof raw.intro_en === 'string' ? raw.intro_en : d.intro_en,
    show_newsletter: asBool(raw.show_newsletter, d.show_newsletter),
    newsletter_title: asString(raw.newsletter_title, d.newsletter_title),
    newsletter_title_en:
      typeof raw.newsletter_title_en === 'string' ? raw.newsletter_title_en : d.newsletter_title_en,
    newsletter_desc: asString(raw.newsletter_desc, d.newsletter_desc),
    newsletter_desc_en:
      typeof raw.newsletter_desc_en === 'string' ? raw.newsletter_desc_en : d.newsletter_desc_en,
    newsletter_placeholder: asString(raw.newsletter_placeholder, d.newsletter_placeholder),
    newsletter_placeholder_en:
      typeof raw.newsletter_placeholder_en === 'string'
        ? raw.newsletter_placeholder_en
        : d.newsletter_placeholder_en,
    copyright_suffix: asString(raw.copyright_suffix, d.copyright_suffix),
    show_social: asBool(raw.show_social, d.show_social),
    show_legal: asBool(raw.show_legal, d.show_legal),
  };
}

const NETWORKS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'x', 'youtube', 'other'] as const;

export function parseFooterSocialItem(raw: Record<string, unknown>): FooterSocialItem | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const href = typeof raw.href === 'string' ? raw.href.trim() : '';
  if (!label || !href) return null;
  return {
    label,
    href,
    network: pickEnum(raw.network, NETWORKS, 'other'),
  };
}

export function parsePwaNavSettings(raw: Record<string, unknown> | null | undefined): PwaNavSettings {
  if (!raw) return { ...DEFAULT_PWA_NAV_SETTINGS };
  return { enabled: asBool(raw.enabled, true) };
}

const PWA_ICONS = ['home', 'store', 'scan', 'legacy', 'bag'] as const;

export function parsePwaNavItem(raw: Record<string, unknown>): PwaNavItem | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const href = typeof raw.href === 'string' ? raw.href.trim() : '';
  if (!label || !href.startsWith('/') || href.startsWith('//')) return null;
  return {
    label,
    label_en: typeof raw.label_en === 'string' ? raw.label_en : undefined,
    href,
    icon: pickEnum(raw.icon, PWA_ICONS, 'home'),
  };
}

export function parseBrandAssets(raw: Record<string, unknown> | null | undefined): BrandAssets {
  const d = DEFAULT_BRAND_ASSETS;
  if (!raw) return { ...d };
  // logo_url vacío es válido (sin img); no forzar default
  const logoUrl = typeof raw.logo_url === 'string' ? raw.logo_url : d.logo_url;
  return {
    logo_url: logoUrl,
    logo_footer_url: typeof raw.logo_footer_url === 'string' ? raw.logo_footer_url : d.logo_footer_url,
    favicon_url: asString(raw.favicon_url, d.favicon_url) || d.favicon_url,
    og_image_url: typeof raw.og_image_url === 'string' ? raw.og_image_url : d.og_image_url,
    logo_height_px: asNumber(raw.logo_height_px, d.logo_height_px, 16, 120),
    logo_max_width_px: asNumber(raw.logo_max_width_px, d.logo_max_width_px, 0, 480),
    logo_footer_height_px: asNumber(raw.logo_footer_height_px, d.logo_footer_height_px, 16, 160),
  };
}

export function resolveLocalized(
  es: string,
  en: string | undefined,
  locale: string,
): string {
  if (locale === 'en' && en?.trim()) return en.trim();
  return es;
}

export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  const radiusMap = { sm: '0.375rem', md: '0.75rem', lg: '1rem' };
  return {
    '--tienda-grain-opacity': String(theme.grain_intensity),
    '--tienda-radius': radiusMap[theme.border_radius],
  };
}

// Templates for editor “Añadir”
export const ANNOUNCEMENT_SLIDE_TEMPLATE = {
  text: '',
  text_en: '',
  href: '',
  link_label: '',
  link_label_en: '',
};

export const FOOTER_SOCIAL_TEMPLATE = {
  label: '',
  href: 'https://',
  network: 'instagram',
};

export const PWA_NAV_ITEM_TEMPLATE = {
  label: '',
  label_en: '',
  href: '/',
  icon: 'home',
};

export const THEME_SETTINGS_TEMPLATE = { ...DEFAULT_THEME_SETTINGS };
export const ANNOUNCEMENT_SETTINGS_TEMPLATE = { ...DEFAULT_ANNOUNCEMENT_SETTINGS };
export const FOOTER_SETTINGS_TEMPLATE = { ...DEFAULT_FOOTER_SETTINGS };
export const PWA_NAV_SETTINGS_TEMPLATE = { ...DEFAULT_PWA_NAV_SETTINGS };
export const BRAND_ASSETS_TEMPLATE = { ...DEFAULT_BRAND_ASSETS };

// ── Ola 2: Landing / Catálogo / PDP ────────────────────────────────────────

export type LandingSectionId =
  | 'hero'
  | 'conservation'
  | 'collections'
  | 'media'
  | 'products'
  | 'video'
  | 'map';

export type LandingSectionConfig = {
  id: LandingSectionId;
  enabled: boolean;
  order: number;
};

export type LandingLayoutSettings = {
  sections: LandingSectionConfig[];
  show_grain: boolean;
  show_custom_cursor: boolean;
  show_bee_canvas: boolean;
  hero_cta_label: string;
  hero_cta_label_en?: string;
  hero_cta_href: string;
  show_hero_cta: boolean;
};

export const DEFAULT_LANDING_SECTIONS: LandingSectionConfig[] = [
  { id: 'hero', enabled: true, order: 0 },
  { id: 'conservation', enabled: true, order: 1 },
  { id: 'collections', enabled: true, order: 2 },
  { id: 'media', enabled: true, order: 3 },
  { id: 'products', enabled: true, order: 4 },
  { id: 'video', enabled: true, order: 5 },
  { id: 'map', enabled: true, order: 6 },
];

export const DEFAULT_LANDING_LAYOUT: LandingLayoutSettings = {
  sections: DEFAULT_LANDING_SECTIONS,
  show_grain: true,
  show_custom_cursor: true,
  show_bee_canvas: true,
  hero_cta_label: 'Explorar creaciones',
  hero_cta_label_en: 'Explore creations',
  hero_cta_href: '/catalogo',
  show_hero_cta: true,
};

export type CatalogSortKey = 'default' | 'price-asc' | 'price-desc' | 'name';

export type CatalogSettings = {
  page_title: string;
  page_title_en?: string;
  page_subtitle: string;
  page_subtitle_en?: string;
  columns_desktop: number;
  columns_mobile: number;
  default_sort: CatalogSortKey;
  show_search: boolean;
  show_filters: boolean;
  show_ratings: boolean;
  show_badges: boolean;
  empty_message: string;
  empty_message_en?: string;
};

export const DEFAULT_CATALOG_SETTINGS: CatalogSettings = {
  page_title: 'Creaciones',
  page_title_en: 'Creations',
  page_subtitle:
    'La materia de nuestra búsqueda. Experiencias que se transforman en productos cargados de legado.',
  page_subtitle_en: 'The matter of our search. Experiences that become products of legacy.',
  columns_desktop: 3,
  columns_mobile: 2,
  default_sort: 'default',
  show_search: true,
  show_filters: true,
  show_ratings: true,
  show_badges: true,
  empty_message: 'No hay productos con esos filtros.',
  empty_message_en: 'No products match those filters.',
};

export type PdpSettings = {
  show_breadcrumb: boolean;
  show_format_badge: boolean;
  show_badges: boolean;
  show_traceability: boolean;
  show_reviews: boolean;
  show_replenishment: boolean;
  continue_label: string;
  continue_label_en?: string;
};

export const DEFAULT_PDP_SETTINGS: PdpSettings = {
  show_breadcrumb: true,
  show_format_badge: true,
  show_badges: true,
  show_traceability: true,
  show_reviews: true,
  show_replenishment: true,
  continue_label: 'Seguir explorando',
  continue_label_en: 'Keep exploring',
};

const LANDING_IDS: LandingSectionId[] = [
  'hero',
  'conservation',
  'collections',
  'media',
  'products',
  'video',
  'map',
];

export function parseLandingLayout(
  raw: Record<string, unknown> | null | undefined,
): LandingLayoutSettings {
  const d = DEFAULT_LANDING_LAYOUT;
  if (!raw) return { ...d, sections: d.sections.map((s) => ({ ...s })) };

  let sections = d.sections.map((s) => ({ ...s }));
  if (Array.isArray(raw.sections)) {
    const parsed: LandingSectionConfig[] = [];
    for (const item of raw.sections) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const id = pickEnum(row.id, LANDING_IDS, 'hero');
      if (parsed.some((p) => p.id === id)) continue;
      parsed.push({
        id,
        enabled: asBool(row.enabled, true),
        order: asNumber(row.order, parsed.length, 0, 20),
      });
    }
    for (const def of d.sections) {
      if (!parsed.some((p) => p.id === def.id)) parsed.push({ ...def });
    }
    sections = parsed.sort((a, b) => a.order - b.order);
  }

  return {
    sections,
    show_grain: asBool(raw.show_grain, d.show_grain),
    show_custom_cursor: asBool(raw.show_custom_cursor, d.show_custom_cursor),
    show_bee_canvas: asBool(raw.show_bee_canvas, d.show_bee_canvas),
    hero_cta_label: asString(raw.hero_cta_label, d.hero_cta_label),
    hero_cta_label_en:
      typeof raw.hero_cta_label_en === 'string' ? raw.hero_cta_label_en : d.hero_cta_label_en,
    hero_cta_href: asString(raw.hero_cta_href, d.hero_cta_href),
    show_hero_cta: asBool(raw.show_hero_cta, d.show_hero_cta),
  };
}

export function parseCatalogSettings(
  raw: Record<string, unknown> | null | undefined,
): CatalogSettings {
  const d = DEFAULT_CATALOG_SETTINGS;
  if (!raw) return { ...d };
  return {
    page_title: asString(raw.page_title, d.page_title),
    page_title_en: typeof raw.page_title_en === 'string' ? raw.page_title_en : d.page_title_en,
    page_subtitle: asString(raw.page_subtitle, d.page_subtitle),
    page_subtitle_en:
      typeof raw.page_subtitle_en === 'string' ? raw.page_subtitle_en : d.page_subtitle_en,
    columns_desktop: asNumber(raw.columns_desktop, d.columns_desktop, 2, 4),
    columns_mobile: asNumber(raw.columns_mobile, d.columns_mobile, 1, 2),
    default_sort: pickEnum(
      raw.default_sort,
      ['default', 'price-asc', 'price-desc', 'name'] as const,
      d.default_sort,
    ),
    show_search: asBool(raw.show_search, d.show_search),
    show_filters: asBool(raw.show_filters, d.show_filters),
    show_ratings: asBool(raw.show_ratings, d.show_ratings),
    show_badges: asBool(raw.show_badges, d.show_badges),
    empty_message: asString(raw.empty_message, d.empty_message),
    empty_message_en:
      typeof raw.empty_message_en === 'string' ? raw.empty_message_en : d.empty_message_en,
  };
}

export function parsePdpSettings(raw: Record<string, unknown> | null | undefined): PdpSettings {
  const d = DEFAULT_PDP_SETTINGS;
  if (!raw) return { ...d };
  return {
    show_breadcrumb: asBool(raw.show_breadcrumb, d.show_breadcrumb),
    show_format_badge: asBool(raw.show_format_badge, d.show_format_badge),
    show_badges: asBool(raw.show_badges, d.show_badges),
    show_traceability: asBool(raw.show_traceability, d.show_traceability),
    show_reviews: asBool(raw.show_reviews, d.show_reviews),
    show_replenishment: asBool(raw.show_replenishment, d.show_replenishment),
    continue_label: asString(raw.continue_label, d.continue_label),
    continue_label_en:
      typeof raw.continue_label_en === 'string' ? raw.continue_label_en : d.continue_label_en,
  };
}

export const LANDING_LAYOUT_TEMPLATE = {
  ...DEFAULT_LANDING_LAYOUT,
  sections: DEFAULT_LANDING_SECTIONS.map((s) => ({ ...s })),
};
export const CATALOG_SETTINGS_TEMPLATE = { ...DEFAULT_CATALOG_SETTINGS };
export const PDP_SETTINGS_TEMPLATE = { ...DEFAULT_PDP_SETTINGS };

export const LANDING_SECTION_LABELS: Record<LandingSectionId, string> = {
  hero: 'Hero',
  conservation: 'Impacto / Conservación',
  collections: 'Colecciones',
  media: 'Carrusel media',
  products: 'Creaciones (productos)',
  video: 'Video central',
  map: 'Mapa / Lugar',
};


// ── Ola 3: SEO / Contacto / Banners ────────────────────────────────────────

export type SeoDefaults = {
  default_title: string;
  title_template: string;
  default_description: string;
  default_description_en?: string;
  og_image_url: string;
  site_name: string;
  twitter_handle: string;
};

export const DEFAULT_SEO_DEFAULTS: SeoDefaults = {
  default_title: 'La Obrera y el Zángano · Tienda',
  title_template: '%s · La Obrera y el Zángano',
  default_description: 'Miel cruda del bosque nativo de Chiloé.',
  default_description_en: 'Raw honey from the native forests of Chiloé.',
  og_image_url: '',
  site_name: 'La Obrera y el Zángano',
  twitter_handle: '',
};

export type ContactSettings = {
  show_whatsapp_float: boolean;
  whatsapp_e164: string;
  whatsapp_prefill: string;
  whatsapp_prefill_en?: string;
  email: string;
  phone_display: string;
  address: string;
  address_en?: string;
  hours: string;
  hours_en?: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  show_whatsapp_float: true,
  whatsapp_e164: '56940831358',
  whatsapp_prefill: 'Hola, vengo de la tienda La Obrera y el Zángano.',
  whatsapp_prefill_en: 'Hi, I am writing from the La Obrera y el Zángano store.',
  email: 'hola@obrerayzangano.com',
  phone_display: '+56 9 408 31 358',
  address: 'Pureo rural km 8560, Quellón, Chiloé, Chile',
  address_en: 'Pureo rural km 8560, Quellón, Chiloé, Chile',
  hours: 'Lun–Vie 10:00–18:00 (CL)',
  hours_en: 'Mon–Fri 10:00–18:00 (CL)',
};

export type CampaignPlacement = 'home' | 'catalog' | 'global' | 'cart';

export type CampaignBanner = {
  title: string;
  title_en?: string;
  body: string;
  body_en?: string;
  href: string;
  cta_label: string;
  cta_label_en?: string;
  placement: CampaignPlacement;
  /** ISO date YYYY-MM-DD inclusive, empty = no limit */
  starts_at: string;
  ends_at: string;
};

export const DEFAULT_CAMPAIGN_BANNERS: CampaignBanner[] = [];

export type LegalDocContent = {
  title: string;
  body: string;
  last_updated: string;
};

export const LEGAL_DOC_TEMPLATE: LegalDocContent = {
  title: '',
  body: '',
  last_updated: '',
};

export const CAMPAIGN_BANNER_TEMPLATE: CampaignBanner = {
  title: '',
  title_en: '',
  body: '',
  body_en: '',
  href: '/catalogo',
  cta_label: 'Ver más',
  cta_label_en: 'See more',
  placement: 'home',
  starts_at: '',
  ends_at: '',
};

export const SEO_DEFAULTS_TEMPLATE = { ...DEFAULT_SEO_DEFAULTS };
export const CONTACT_SETTINGS_TEMPLATE = { ...DEFAULT_CONTACT_SETTINGS };

export function parseSeoDefaults(raw: Record<string, unknown> | null | undefined): SeoDefaults {
  const d = DEFAULT_SEO_DEFAULTS;
  if (!raw) return { ...d };
  return {
    default_title: asString(raw.default_title, d.default_title),
    title_template: asString(raw.title_template, d.title_template),
    default_description: asString(raw.default_description, d.default_description),
    default_description_en:
      typeof raw.default_description_en === 'string'
        ? raw.default_description_en
        : d.default_description_en,
    og_image_url: asString(raw.og_image_url, d.og_image_url),
    site_name: asString(raw.site_name, d.site_name),
    twitter_handle: asString(raw.twitter_handle, d.twitter_handle),
  };
}

export function parseContactSettings(
  raw: Record<string, unknown> | null | undefined,
): ContactSettings {
  const d = DEFAULT_CONTACT_SETTINGS;
  if (!raw) return { ...d };
  const e164 = asString(raw.whatsapp_e164, d.whatsapp_e164).replace(/\D/g, '');
  return {
    show_whatsapp_float: asBool(raw.show_whatsapp_float, d.show_whatsapp_float),
    whatsapp_e164: e164 || d.whatsapp_e164,
    whatsapp_prefill: asString(raw.whatsapp_prefill, d.whatsapp_prefill),
    whatsapp_prefill_en:
      typeof raw.whatsapp_prefill_en === 'string' ? raw.whatsapp_prefill_en : d.whatsapp_prefill_en,
    email: asString(raw.email, d.email),
    phone_display: asString(raw.phone_display, d.phone_display),
    address: asString(raw.address, d.address),
    address_en: typeof raw.address_en === 'string' ? raw.address_en : d.address_en,
    hours: asString(raw.hours, d.hours),
    hours_en: typeof raw.hours_en === 'string' ? raw.hours_en : d.hours_en,
  };
}

const PLACEMENTS: CampaignPlacement[] = ['home', 'catalog', 'global', 'cart'];

export function parseCampaignBanner(raw: Record<string, unknown>): CampaignBanner | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  return {
    title,
    title_en: typeof raw.title_en === 'string' ? raw.title_en : undefined,
    body: asString(raw.body, ''),
    body_en: typeof raw.body_en === 'string' ? raw.body_en : undefined,
    href: asString(raw.href, '/catalogo'),
    cta_label: asString(raw.cta_label, 'Ver más'),
    cta_label_en: typeof raw.cta_label_en === 'string' ? raw.cta_label_en : undefined,
    placement: pickEnum(raw.placement, PLACEMENTS, 'home'),
    starts_at: asString(raw.starts_at, ''),
    ends_at: asString(raw.ends_at, ''),
  };
}

/** Activo si hoy está dentro de [starts_at, ends_at] (vacío = sin límite). */
export function isCampaignBannerActive(banner: CampaignBanner, now = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  if (banner.starts_at && day < banner.starts_at) return false;
  if (banner.ends_at && day > banner.ends_at) return false;
  return true;
}

// ── Bundle completo (Ola 1 + Ola 2) ────────────────────────────────────────

export type StoreChromeConfig = StoreChromeConfigOla1 & {
  landing: LandingLayoutSettings;
  catalog: CatalogSettings;
  pdp: PdpSettings;
  seo: SeoDefaults;
  contact: ContactSettings;
  campaignBanners: CampaignBanner[];
};

export const DEFAULT_STORE_CHROME: StoreChromeConfig = {
  ...DEFAULT_STORE_CHROME_OLA1,
  landing: {
    ...DEFAULT_LANDING_LAYOUT,
    sections: DEFAULT_LANDING_SECTIONS.map((s) => ({ ...s })),
  },
  catalog: { ...DEFAULT_CATALOG_SETTINGS },
  pdp: { ...DEFAULT_PDP_SETTINGS },
  seo: { ...DEFAULT_SEO_DEFAULTS },
  contact: { ...DEFAULT_CONTACT_SETTINGS },
  campaignBanners: [],
};
