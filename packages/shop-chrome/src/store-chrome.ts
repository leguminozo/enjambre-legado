/**
 * Chrome global de tienda — fuente única monorepo (@enjambre/shop-chrome).
 * Consumido por apps/tienda y apps/nucleo vía re-export.
 */

import {
  type TypographySettings,
  DEFAULT_TYPOGRAPHY_SETTINGS,
} from './typography';
import {
  type SeasonalSettings,
  DEFAULT_SEASONAL_SETTINGS,
} from './seasonal';

// ── Theme ──────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';
export type RadiusPreset = 'sm' | 'md' | 'lg';

export type ThemeSettings = {
  default_theme: ThemeMode;
  grain_intensity: number;
  border_radius: RadiusPreset;
  force_dark_public: boolean;
  /** Acento en canales HSL (formato "H S% L%" que consume hsl(var(--accent))). */
  accent_h: number;
  accent_s: number;
  accent_l: number;
  /** Fondo tema oscuro en HSL (default 0 0% 3% - negro tinta). */
  bg_dark_h: number;
  bg_dark_s: number;
  bg_dark_l: number;
  /** Fondo tema claro en HSL (default 35 60% 97% - crema suave). */
  bg_light_h: number;
  bg_light_s: number;
  bg_light_l: number;
  /** Superficie/tarjetas modo oscuro en HSL (default 0 0% 7%). */
  surface_dark_h?: number;
  surface_dark_s?: number;
  surface_dark_l?: number;
  /** Superficie/tarjetas modo claro en HSL (default 35 60% 100%). */
  surface_light_h?: number;
  surface_light_s?: number;
  surface_light_l?: number;
  /** Texto principal modo oscuro en HSL (default 35 60% 93%). */
  text_dark_h?: number;
  text_dark_s?: number;
  text_dark_l?: number;
  /** Texto principal modo claro en HSL (default 0 0% 7%). */
  text_light_h?: number;
  text_light_s?: number;
  text_light_l?: number;
};

/** Defaults = oro-miel de tokens.css (--enj-oro-miel-h/s/l) y fondos canónicos. */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  default_theme: 'dark',
  grain_intensity: 0.35,
  border_radius: 'md',
  force_dark_public: false,
  accent_h: 44,
  accent_s: 85,
  accent_l: 46,
  bg_dark_h: 0,
  bg_dark_s: 0,
  bg_dark_l: 3,
  bg_light_h: 35,
  bg_light_s: 60,
  bg_light_l: 97,
  surface_dark_h: 0,
  surface_dark_s: 0,
  surface_dark_l: 7,
  surface_light_h: 35,
  surface_light_s: 60,
  surface_light_l: 100,
  text_dark_h: 35,
  text_dark_s: 60,
  text_dark_l: 93,
  text_light_h: 0,
  text_light_s: 0,
  text_light_l: 7,
};

// ── Announcement ───────────────────────────────────────────────────────────

export type AnnouncementSettings = {
  enabled: boolean;
  interval_ms: number;
  height_mobile_px: number;
  height_desktop_px: number;
  dismissible: boolean;
  visibility?: 'global' | 'home_only';
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
  /** ≥44 so dismiss/link hits fit without clipping (touch) */
  height_mobile_px: 48,
  height_desktop_px: 52,
  dismissible: true,
  visibility: 'global',
};

export const DEFAULT_ANNOUNCEMENT_SLIDES: AnnouncementSlide[] = [
  { text: 'Bienvenido a la experiencia digital. Te estábamos esperando' },
  {
    text: 'La historia del bosque comienza ',
    href: '/nosotros',
    link_label: 'aquí',
    link_label_en: 'here',
    text_en: 'The forest story begins ',
  },
  { text: 'Directo del bosque a tu hogar', text_en: 'Straight from the forest to your home' },
  { text: 'Hecho artesanalmente. Ritmo naturaleza', text_en: 'Handmade. Nature’s pace' },
  { text: 'Consume menos. Consume mejor', text_en: 'Consume less. Consume better' },
  { text: 'Cada gota regenera bosque nativo', text_en: 'Every drop regenerates native forest' },
  { text: 'Nuestra miel no es producto, es legado', text_en: 'Our honey is not a product — it is legacy' },
  { text: 'Envío gratis comprando desde $45.000', text_en: 'Free shipping from $45.000' },
];

// ── Footer ─────────────────────────────────────────────────────────────────

export type FooterSettings = {
  brand_line1: string;
  brand_line2: string;
  brand_tracking_em: number;
  logo_layout?: 'stacked' | 'inline';
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
  col1_title?: string;
  col1_title_en?: string;
  col2_title?: string;
  col2_title_en?: string;
  /** Alineación de los párrafos del pie (control del editor). */
  text_align?: TextAlign;
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
  logo_layout: 'stacked',
  intro:
    'Síguenos desde tu entorno digital favorito. Accederás solo a lo esencial. ¡Sé parte de la experiencia completa!',
  intro_en: 'Follow us on your favorite channel. Only the essential. Be part of the full experience!',
  show_newsletter: true,
  newsletter_title: 'Activa tu Membresía & Puntos de Bienvenida',
  newsletter_title_en: 'Activate your Membership & Welcome Points',
  newsletter_desc:
    'Ingresa tu correo para activar tu cuenta de cliente sin contraseñas y recibir 100 puntos de bienvenida en tu billetera digital. Accederás a asignaciones de recolección y novedades directas del bosque.',
  newsletter_desc_en:
    'Enter your email to activate your passwordless member account and receive 100 welcome points in your digital wallet. Access exclusive harvest allocations and direct forest updates.',
  newsletter_placeholder: 'tu@correo.com — Activar cuenta y puntos',
  newsletter_placeholder_en: 'your@email.com — Activate account & points',
  copyright_suffix: 'Todos los derechos reservados.',
  show_social: true,
  show_legal: true,
  col1_title: 'Ecosistema',
  col1_title_en: 'Ecosystem',
  col2_title: 'Alianzas & Negocios',
  col2_title_en: 'Alliances & B2B',
};

export const DEFAULT_FOOTER_SOCIAL: FooterSocialItem[] = [
  { label: 'WhatsApp', href: 'https://wa.me/56940831358', network: 'whatsapp' },
  { label: 'Instagram', href: 'https://instagram.com/obrera_y_zangano', network: 'instagram' },
  { label: 'Facebook', href: 'https://www.facebook.com/ObreraZangano/', network: 'facebook' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@obrera_y_zangano', network: 'tiktok' },
  { label: 'X', href: 'https://x.com/obrerayzangano', network: 'x' },
  { label: 'YouTube', href: 'https://www.youtube.com/@obrera_y_zangano', network: 'youtube' },
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
  /** Nombre oficial de la marca (ej: "Obrera & Zángano"). */
  brand_name?: string;
  /** Lema o bajada oficial (ej: "Bosque Nativo de Chiloé"). */
  brand_tagline?: string;
  /** Tamaño del nombre oficial en móvil (px). Default 15. */
  brand_name_size_mobile_px?: number;
  /** Tamaño del nombre oficial en escritorio (px). Default 18. */
  brand_name_size_desktop_px?: number;
  /** Tamaño fallback del nombre oficial (px). */
  brand_name_size_px?: number;
  /** Mostrar lema oficial en móvil. Default true. */
  brand_tagline_show_mobile?: boolean;
  /** Mostrar lema oficial en escritorio. Default true. */
  brand_tagline_show_desktop?: boolean;
  /** Tamaño del lema en móvil (px). Default 9. */
  brand_tagline_size_mobile_px?: number;
  /** Tamaño del lema en escritorio (px). Default 10. */
  brand_tagline_size_desktop_px?: number;
  /** Tamaño fallback del lema (px). */
  brand_tagline_size_px?: number;
  /** Muestra el logotipo en cabecera. Si es falso, muestra el nombre y lema en texto tipográfico. */
  show_logo_header?: boolean;
  logo_url: string;
  logo_footer_url: string;
  favicon_url: string;
  og_image_url: string;
  /** Display height in header (px) — legacy/fallback. */
  logo_height_px: number;
  /** Display height in header on mobile screens (px). Default 32. */
  logo_height_mobile_px?: number;
  /** Display height in header on desktop screens (px). Default 44. */
  logo_height_desktop_px?: number;
  /** Max width in header (px); 0 = auto (natural aspect ratio). */
  logo_max_width_px: number;
  /** Display height in footer (px) — legacy/fallback. */
  logo_footer_height_px: number;
  /** Display height in footer on mobile screens (px). Default 36. */
  logo_footer_height_mobile_px?: number;
  /** Display height in footer on desktop screens (px). Default 48. */
  logo_footer_height_desktop_px?: number;
};

export const DEFAULT_BRAND_ASSETS: BrandAssets = {
  brand_name: 'Obrera & Zángano',
  brand_tagline: 'Bosque Nativo de Chiloé',
  brand_name_size_px: 18,
  brand_name_size_mobile_px: 15,
  brand_name_size_desktop_px: 18,
  brand_tagline_show_mobile: true,
  brand_tagline_show_desktop: true,
  brand_tagline_size_px: 10,
  brand_tagline_size_mobile_px: 9,
  brand_tagline_size_desktop_px: 10,
  show_logo_header: true,
  logo_url: '/icons/icon-192.svg',
  logo_footer_url: '',
  favicon_url: '/icons/icon-192.svg',
  og_image_url: '',
  logo_height_px: 44,
  logo_height_mobile_px: 32,
  logo_max_width_px: 0,
  logo_footer_height_px: 48,
  logo_footer_height_mobile_px: 36,
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

/**
 * Hrefs seguros para chrome CMS (announcement, campaign, hero CTA, social).
 * - Internos: `/path` (no `//`)
 * - Externos: solo `http(s)://`
 * Rechaza javascript:, data:, protocol-relative malicioso.
 */
export function sanitizeStoreHref(
  value: unknown,
  fallback?: string,
): string | undefined {
  if (typeof value !== 'string') return fallback;
  const href = value.trim();
  if (!href) return fallback;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return fallback;
}

export function parseBrandAssets(raw: Record<string, unknown> | null | undefined): BrandAssets {
  const d = DEFAULT_BRAND_ASSETS;
  if (!raw) return { ...d };
  // logo_url vacío es válido (sin <img> en header); no forzar default
  const logoUrl = typeof raw.logo_url === 'string' ? raw.logo_url : d.logo_url;

  const heightDesktop = asNumber(
    raw.logo_height_desktop_px ?? raw.logo_height_px,
    d.logo_height_desktop_px ?? d.logo_height_px,
    16,
    256,
  );
  const heightMobile = asNumber(
    raw.logo_height_mobile_px,
    Math.min(heightDesktop, d.logo_height_mobile_px ?? 32),
    16,
    160,
  );
  const footerHeightDesktop = asNumber(
    raw.logo_footer_height_desktop_px ?? raw.logo_footer_height_px,
    d.logo_footer_height_desktop_px ?? d.logo_footer_height_px,
    16,
    256,
  );
  const footerHeightMobile = asNumber(
    raw.logo_footer_height_mobile_px,
    Math.min(footerHeightDesktop, d.logo_footer_height_mobile_px ?? 36),
    16,
    160,
  );

  const brandName = typeof raw.brand_name === 'string' ? raw.brand_name.trim() : (d.brand_name ?? 'Obrera & Zángano');
  const brandTagline = typeof raw.brand_tagline === 'string' ? raw.brand_tagline.trim() : (d.brand_tagline ?? 'Bosque Nativo de Chiloé');
  const showLogoHeader = raw.show_logo_header !== undefined ? Boolean(raw.show_logo_header) : true;

  const brandNameSizeDesktop = asNumber(
    raw.brand_name_size_desktop_px ?? raw.brand_name_size_px,
    d.brand_name_size_desktop_px ?? d.brand_name_size_px ?? 18,
    10,
    64,
  );
  const brandNameSizeMobile = asNumber(
    raw.brand_name_size_mobile_px,
    d.brand_name_size_mobile_px ?? 15,
    8,
    48,
  );

  const brandTaglineShowMobile =
    raw.brand_tagline_show_mobile !== undefined
      ? Boolean(raw.brand_tagline_show_mobile)
      : (d.brand_tagline_show_mobile ?? true);
  const brandTaglineShowDesktop =
    raw.brand_tagline_show_desktop !== undefined
      ? Boolean(raw.brand_tagline_show_desktop)
      : (d.brand_tagline_show_desktop ?? true);

  const brandTaglineSizeDesktop = asNumber(
    raw.brand_tagline_size_desktop_px ?? raw.brand_tagline_size_px,
    d.brand_tagline_size_desktop_px ?? d.brand_tagline_size_px ?? 10,
    6,
    32,
  );
  const brandTaglineSizeMobile = asNumber(
    raw.brand_tagline_size_mobile_px,
    d.brand_tagline_size_mobile_px ?? 9,
    6,
    28,
  );

  return {
    brand_name: brandName,
    brand_tagline: brandTagline,
    brand_name_size_px: brandNameSizeDesktop,
    brand_name_size_mobile_px: brandNameSizeMobile,
    brand_name_size_desktop_px: brandNameSizeDesktop,
    brand_tagline_show_mobile: brandTaglineShowMobile,
    brand_tagline_show_desktop: brandTaglineShowDesktop,
    brand_tagline_size_px: brandTaglineSizeDesktop,
    brand_tagline_size_mobile_px: brandTaglineSizeMobile,
    brand_tagline_size_desktop_px: brandTaglineSizeDesktop,
    show_logo_header: showLogoHeader,
    logo_url: logoUrl,
    logo_footer_url: typeof raw.logo_footer_url === 'string' ? raw.logo_footer_url : d.logo_footer_url,
    favicon_url: asString(raw.favicon_url, d.favicon_url) || d.favicon_url,
    og_image_url: typeof raw.og_image_url === 'string' ? raw.og_image_url : d.og_image_url,
    logo_height_px: heightDesktop,
    logo_height_mobile_px: heightMobile,
    logo_height_desktop_px: heightDesktop,
    logo_max_width_px: asNumber(raw.logo_max_width_px, d.logo_max_width_px, 0, 800),
    logo_footer_height_px: footerHeightDesktop,
    logo_footer_height_mobile_px: footerHeightMobile,
    logo_footer_height_desktop_px: footerHeightDesktop,
  };
}

export const BRAND_ASSETS_TEMPLATE = { ...DEFAULT_BRAND_ASSETS };


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
    accent_h: asNumber(raw.accent_h, d.accent_h, 0, 360),
    accent_s: asNumber(raw.accent_s, d.accent_s, 0, 100),
    accent_l: asNumber(raw.accent_l, d.accent_l, 0, 100),
    bg_dark_h: asNumber(raw.bg_dark_h, d.bg_dark_h, 0, 360),
    bg_dark_s: asNumber(raw.bg_dark_s, d.bg_dark_s, 0, 100),
    bg_dark_l: asNumber(raw.bg_dark_l, d.bg_dark_l, 0, 100),
    bg_light_h: asNumber(raw.bg_light_h, d.bg_light_h, 0, 360),
    bg_light_s: asNumber(raw.bg_light_s, d.bg_light_s, 0, 100),
    bg_light_l: asNumber(raw.bg_light_l, d.bg_light_l, 0, 100),
    surface_dark_h: asNumber(raw.surface_dark_h, d.surface_dark_h ?? d.bg_dark_h, 0, 360),
    surface_dark_s: asNumber(raw.surface_dark_s, d.surface_dark_s ?? d.bg_dark_s, 0, 100),
    surface_dark_l: asNumber(raw.surface_dark_l, d.surface_dark_l ?? (d.bg_dark_l + 4), 0, 100),
    surface_light_h: asNumber(raw.surface_light_h, d.surface_light_h ?? d.bg_light_h, 0, 360),
    surface_light_s: asNumber(raw.surface_light_s, d.surface_light_s ?? d.bg_light_s, 0, 100),
    surface_light_l: asNumber(raw.surface_light_l, d.surface_light_l ?? 100, 0, 100),
    text_dark_h: asNumber(raw.text_dark_h, d.text_dark_h ?? 35, 0, 360),
    text_dark_s: asNumber(raw.text_dark_s, d.text_dark_s ?? 60, 0, 100),
    text_dark_l: asNumber(raw.text_dark_l, d.text_dark_l ?? 93, 0, 100),
    text_light_h: asNumber(raw.text_light_h, d.text_light_h ?? 0, 0, 360),
    text_light_s: asNumber(raw.text_light_s, d.text_light_s ?? 0, 0, 100),
    text_light_l: asNumber(raw.text_light_l, d.text_light_l ?? 7, 0, 100),
  };
}

export function parseAnnouncementSettings(
  raw: Record<string, unknown> | null | undefined,
): AnnouncementSettings {
  const d = DEFAULT_ANNOUNCEMENT_SETTINGS;
  if (!raw) return { ...d };
  const rawVisibility = raw.visibility;
  const visibility: 'global' | 'home_only' =
    rawVisibility === 'home_only' ? 'home_only' : 'global';

  return {
    enabled: asBool(raw.enabled, d.enabled),
    interval_ms: asNumber(raw.interval_ms, d.interval_ms, 2000, 20000),
    height_mobile_px: asNumber(raw.height_mobile_px, d.height_mobile_px, 44, 72),
    height_desktop_px: asNumber(raw.height_desktop_px, d.height_desktop_px, 44, 80),
    dismissible: asBool(raw.dismissible, d.dismissible),
    visibility,
  };
}

export function parseAnnouncementSlide(raw: Record<string, unknown>): AnnouncementSlide | null {
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  if (!text) return null;
  return {
    text,
    text_en: typeof raw.text_en === 'string' ? raw.text_en : undefined,
    href: sanitizeStoreHref(raw.href),
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
    logo_layout: raw.logo_layout === 'inline' ? 'inline' : 'stacked',
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
    col1_title: asString(raw.col1_title, d.col1_title ?? ''),
    col1_title_en: typeof raw.col1_title_en === 'string' ? raw.col1_title_en : d.col1_title_en,
    col2_title: asString(raw.col2_title, d.col2_title ?? ''),
    col2_title_en: typeof raw.col2_title_en === 'string' ? raw.col2_title_en : d.col2_title_en,
    text_align: parseTextAlign(raw.text_align),
  };
}

const NETWORKS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'x', 'youtube', 'other'] as const;

export function parseFooterSocialItem(raw: Record<string, unknown>): FooterSocialItem | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const href = sanitizeStoreHref(raw.href);
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

export function resolveLocalized(
  es: string | undefined | null,
  en: string | undefined | null,
  locale: string,
): string {
  if (locale === 'en' && en?.trim()) return en.trim();
  return es?.trim() ?? '';
}

/** Alineación de párrafos por bloque (control del editor, no bilingüe: es layout). */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Izquierda (editorial)' },
  { value: 'center', label: 'Centrado' },
  { value: 'justify', label: 'Justificado (bloque libro)' },
  { value: 'right', label: 'Derecha' },
] as const;

export function parseTextAlign(raw: unknown): TextAlign {
  return raw === 'center' || raw === 'right' || raw === 'justify' ? raw : 'left';
}

/**
 * Clase Tailwind para la alineación. 'left' no emite clase: el bloque hereda
 * su diseño actual (cero cambios visuales por defecto).
 * 'justify' añade hyphens-auto para evitar huecos en pantallas responsivas.
 */
export function alignToClass(align: TextAlign | undefined | null): string {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  if (align === 'justify') return 'text-justify hyphens-auto';
  return '';
}

export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  // Grano: 0-1 → 0-6% opacidad. El ruido visible se satura muy rápido: el
  // default histórico de GrainOverlay era 0.02 y grain_intensity default es
  // 0.35, así que la escala mapea 0.35 → ~0.021 (look actual).
  const grainOpacity = String(Math.min(0.06, Number(theme.grain_intensity) * 0.06));
  // Radio: presets alineados con las cards de la tienda (rounded-lg = 0.5rem).
  const radiusMap = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem' };

  const sDarkH = theme.surface_dark_h ?? theme.bg_dark_h;
  const sDarkS = theme.surface_dark_s ?? theme.bg_dark_s;
  const sDarkL = theme.surface_dark_l ?? Math.min(100, theme.bg_dark_l + 4);

  const sLightH = theme.surface_light_h ?? theme.bg_light_h;
  const sLightS = theme.surface_light_s ?? theme.bg_light_s;
  const sLightL = theme.surface_light_l ?? 100;

  const tDarkH = theme.text_dark_h ?? 35;
  const tDarkS = theme.text_dark_s ?? 60;
  const tDarkL = theme.text_dark_l ?? 93;

  const tLightH = theme.text_light_h ?? 0;
  const tLightS = theme.text_light_s ?? 0;
  const tLightL = theme.text_light_l ?? 7;

  return {
    '--tienda-grain-opacity': grainOpacity,
    '--tienda-radius': radiusMap[theme.border_radius],
    // Formato de canales: las reglas usan hsl(var(--accent))
    '--accent': `${theme.accent_h} ${theme.accent_s}% ${theme.accent_l}%`,
    // Variante clara del accent para TEXTO sobre fondo oscuro: el accent del
    // CMS (verde bosque, L≈35%) no alcanza 4.5:1 WCAG en texto pequeño.
    // El chrome (bordes/fondos/badges) conserva --accent intacto; en modo
    // claro el app revierte --accent-text a la variante OSCURA (L-8), que
    // cumple incluso sobre fondos tintados (bg-accent/10-15).
    '--accent-text': `${theme.accent_h} ${theme.accent_s}% ${Math.min(68, theme.accent_l + 20)}%`,
    '--accent-text-light': `${theme.accent_h} ${theme.accent_s}% ${Math.max(15, theme.accent_l - 8)}%`,
    // Fondos dinámicos por tema
    '--tienda-bg-dark': `${theme.bg_dark_h} ${theme.bg_dark_s}% ${theme.bg_dark_l}%`,
    '--tienda-bg-light': `${theme.bg_light_h} ${theme.bg_light_s}% ${theme.bg_light_l}%`,
    // Superficies / tarjetas
    '--tienda-surface-dark': `${sDarkH} ${sDarkS}% ${sDarkL}%`,
    '--tienda-surface-light': `${sLightH} ${sLightS}% ${sLightL}%`,
    '--tienda-card-dark': `${sDarkH} ${sDarkS}% ${Math.max(0, sDarkL - 1)}%`,
    '--tienda-card-light': `${sLightH} ${sLightS}% ${sLightL}%`,
    // Texto / lectura
    '--tienda-text-dark': `${tDarkH} ${tDarkS}% ${tDarkL}%`,
    '--tienda-text-light': `${tLightH} ${tLightS}% ${tLightL}%`,
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

// ── Ola 2: Landing / Catálogo / PDP ────────────────────────────────────────

export type LandingSectionId =
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

export type LandingSectionConfig = {
  id: LandingSectionId;
  enabled: boolean;
  order: number;
};

export type LandingLayoutSettings = {
  sections: LandingSectionConfig[];
  hero_variant: string;
  hero_video_url: string;
  show_grain: boolean;
  show_custom_cursor: boolean;
  show_bee_canvas: boolean;
  /** >=2: respeta toggles. <2: fuerza ornamento off (CMS viejo tenía true por default). */
  atmosphere_rev: number;
  hero_cta_label: string;
  hero_cta_label_en?: string;
  hero_cta_href: string;
  show_hero_cta: boolean;
  /** Copy del hero editable desde el editor de nucleo. Vacío = la tienda cae al i18n (messages/*.json). */
  hero_eyebrow: string;
  hero_eyebrow_en?: string;
  hero_title_line1: string;
  hero_title_line1_en?: string;
  hero_title_line2: string;
  hero_title_line2_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_formula: string;
  hero_formula_en?: string;
};

export const DEFAULT_LANDING_SECTIONS: LandingSectionConfig[] = [
  { id: 'hero', enabled: true, order: 0 },
  { id: 'identidad', enabled: true, order: 1 },
  { id: 'conservation', enabled: true, order: 2 },
  { id: 'collections', enabled: true, order: 3 },
  { id: 'media', enabled: true, order: 4 },
  { id: 'products', enabled: true, order: 5 },
  { id: 'video', enabled: true, order: 6 },
  { id: 'club_legado', enabled: true, order: 7 },
  { id: 'map', enabled: true, order: 8 },
  { id: 'experiencias', enabled: true, order: 9 },
  { id: 'alianzas', enabled: true, order: 10 },
];

export const DEFAULT_LANDING_LAYOUT: LandingLayoutSettings = {
  sections: DEFAULT_LANDING_SECTIONS,
  hero_variant: 'hueco',
  hero_video_url: '',
  show_grain: false,
  show_custom_cursor: false,
  show_bee_canvas: false,
  atmosphere_rev: 2,
  hero_cta_label: 'Explorar creaciones',
  hero_cta_label_en: 'Explore creations',
  hero_cta_href: '/catalogo',
  show_hero_cta: true,
  // Copy del hero: vacío por defecto → la tienda usa el i18n (messages/*.json)
  hero_eyebrow: '',
  hero_title_line1: '',
  hero_title_line2: '',
  hero_subtitle: '',
  hero_formula: '',
};

export type ImageAspectRatio = '16/9' | '16/10' | '4/3' | '1/1' | '3/4' | 'auto';
export type ImageFitMode = 'cover' | 'contain';

export const ASPECT_RATIOS: readonly ImageAspectRatio[] = ['16/9', '16/10', '4/3', '1/1', '3/4', 'auto'];
export const FIT_MODES: readonly ImageFitMode[] = ['cover', 'contain'];

export type CollectionsSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  grid_columns: number;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_COLLECTIONS_SETTINGS: CollectionsSettings = {
  kicker: 'Colecciones',
  kicker_en: 'Collections',
  title: 'Explora nuestras categorías estacionales',
  title_en: 'Explore our seasonal categories',
  subtitle: '',
  subtitle_en: '',
  image_aspect_ratio: '4/3',
  image_fit: 'cover',
  grid_columns: 3,
};

/** Tarjetas del home si no hay filas CMS. La primera ficha en el editor pisa esta lista. */
export type HomeColeccionCard = {
  kicker: string;
  title: string;
  desc: string;
  href: string;
  image?: string;
};

export const DEFAULT_HOME_COLECCIONES: readonly HomeColeccionCard[] = [
  {
    kicker: 'Sachets',
    title: 'Gotas de Néctar',
    desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.',
    href: '/catalogo?formato=15g',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/1f714fa6-7892-4d9b-8e12-39365cdaefcb.png',
  },
  {
    kicker: 'Frascos Medios',
    title: 'Tesoros del Colmenar',
    desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.',
    href: '/catalogo?formato=150g',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/e8476505-205c-4150-bafc-a03755216817.png',
  },
  {
    kicker: 'Frascos Mayores',
    title: 'Reservas del Bosque',
    desc: 'Nuestra mayor reserva para el futuro. Sobrevive a la incertidumbre y acompaña momentos únicos.',
    href: '/catalogo?formato=900g,1kg',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/6af34762-5831-4c00-8299-e1ea39294111.png',
  },
  {
    kicker: 'Miel Virgen',
    title: 'Panal de Bosque',
    desc: 'El placer de miel libre de intervenciones. La pureza del néctar, una huella del cosmos.',
    href: '/catalogo?formato=Panal',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/e26742e5-7cc3-4a9a-9d3b-8dc6b78671f5.png',
  },
  {
    kicker: 'Cajas de Sachets',
    title: 'Cofres del Enjambre',
    desc: '20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.',
    href: '/catalogo?formato=Cofre',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/755ef288-fe31-4539-b1a7-cc028a30f404.png',
  },
  {
    kicker: 'Suscripciones',
    title: 'Legado del Bosque',
    desc: 'La búsqueda de legado y regeneración desde el sur del planeta. Creaciones en su máximo esplendor.',
    href: '/club-legado-del-bosque',
    image:
      'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/5fcf161c-44b0-42fa-9900-3646c6a9f5d4.png',
  },
];

export type GaleriaSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  grid_columns: number;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_GALERIA_SETTINGS: GaleriaSettings = {
  kicker: 'Galería',
  kicker_en: 'Gallery',
  title: 'Un recorrido visual de nuestras huellas',
  title_en: 'A visual journey of our footsteps',
  subtitle: 'Imágenes del bosque, las colmenas y el proceso regenerativo en Chiloé.',
  subtitle_en: 'Images of the forest, hives and regenerative process in Chiloé.',
  image_aspect_ratio: '4/3',
  image_fit: 'cover',
  grid_columns: 3,
};

export type CarouselHeightMode = '50vh/70vh' | '40vh/60vh' | '60vh/80vh' | '70vh/90vh';
export const CAROUSEL_HEIGHT_MODES: readonly CarouselHeightMode[] = [
  '50vh/70vh',
  '40vh/60vh',
  '60vh/80vh',
  '70vh/90vh',
];

export type NosotrosSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  hero_image_opacity?: number;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_NOSOTROS_SETTINGS: NosotrosSettings = {
  kicker: 'Nuestra Historia',
  kicker_en: 'Our Story',
  title: 'Renacer de las Cenizas en Chiloé',
  title_en: 'Rebirth from the Ashes in Chiloé',
  subtitle: '22 años de regeneración ecológica, apicultura regenerativa y miel cruda.',
  subtitle_en: '22 years of ecological regeneration, regenerative apiculture and raw honey.',
  image_aspect_ratio: '16/9',
  image_fit: 'cover',
  hero_image_opacity: 100,
};

export const NOSOTROS_SETTINGS_TEMPLATE = { ...DEFAULT_NOSOTROS_SETTINGS };

export type MediaSettings = {
  carousel_height: CarouselHeightMode;
  image_fit: ImageFitMode;
  autoplay_ms: number;
};

export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  carousel_height: '50vh/70vh',
  image_fit: 'cover',
  autoplay_ms: 5000,
};

export const MEDIA_SETTINGS_TEMPLATE = { ...DEFAULT_MEDIA_SETTINGS };

export type CienciaSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  hero_image?: string;
  hero_image_opacity?: number;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_CIENCIA_SETTINGS: CienciaSettings = {
  kicker: 'Ciencia & Innovación',
  kicker_en: 'Science & Innovation',
  title: 'Respaldado por la naturaleza y la investigación',
  title_en: 'Backed by nature and research',
  subtitle: 'Estudios sobre los compuestos bioactivos de la miel de ulmo y flora chilota.',
  subtitle_en: 'Studies on the bioactive compounds of ulmo honey and flora of Chiloé.',
  image_aspect_ratio: '4/3',
  image_fit: 'cover',
  hero_image: '',
  hero_image_opacity: 25,
};

export type AuthBackgroundStyle = 'cosmic' | 'bosque_nativo' | 'abeja_cosmos' | 'dark_luxury';
export type AuthParticleEffect = 'none' | 'pollen_gold' | 'mist_bosque' | 'cosmic_stars';

export const AUTH_BACKGROUND_STYLES: readonly AuthBackgroundStyle[] = [
  'cosmic',
  'bosque_nativo',
  'abeja_cosmos',
  'dark_luxury',
];
export const AUTH_PARTICLE_EFFECTS: readonly AuthParticleEffect[] = [
  'none',
  'pollen_gold',
  'mist_bosque',
  'cosmic_stars',
];

export type AuthSettings = {
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  tagline_phrase: string;
  tagline_phrase_en?: string;
  background_style: AuthBackgroundStyle;
  background_image_url?: string;
  particle_effect: AuthParticleEffect;
  blur_orb_color?: string;
};

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  hero_title: 'Enjambre Legado',
  hero_title_en: 'Enjambre Legado',
  hero_subtitle: 'La Obrera y el Zángano',
  hero_subtitle_en: 'The Worker & The Drone',
  tagline_phrase: 'Miel del Bosque Nativo · Chiloé',
  tagline_phrase_en: 'Native Forest Honey · Chiloé',
  background_style: 'cosmic',
  background_image_url: '',
  particle_effect: 'cosmic_stars',
  blur_orb_color: '#D4A017',
};

export const CIENCIA_SETTINGS_TEMPLATE = { ...DEFAULT_CIENCIA_SETTINGS };

export type CatalogSortKey = 'default' | 'price-asc' | 'price-desc' | 'name' | 'newest' | 'impacto';

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
  show_formats_filter?: boolean;
  show_categories_filter?: boolean;
  show_stock_filter?: boolean;
  show_impact_filter?: boolean;
  sticky_bar?: boolean;
  show_ratings: boolean;
  show_badges: boolean;
  empty_message: string;
  empty_message_en?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  text_align?: TextAlign;
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
  show_formats_filter: true,
  show_categories_filter: true,
  show_stock_filter: true,
  show_impact_filter: false,
  sticky_bar: false,
  show_ratings: true,
  show_badges: true,
  empty_message: 'No hay productos con esos filtros.',
  empty_message_en: 'No products match those filters.',
  image_aspect_ratio: '1/1',
  image_fit: 'cover',
  text_align: 'center',
};

export type PdpSettings = {
  show_breadcrumb: boolean;
  show_format_badge: boolean;
  show_badges: boolean;
  show_traceability: boolean;
  show_sensory_profile?: boolean;
  show_reviews: boolean;
  show_replenishment: boolean;
  continue_label: string;
  continue_label_en?: string;
  gallery_overlay_opacity: number;
};

export const DEFAULT_PDP_SETTINGS: PdpSettings = {
  show_breadcrumb: true,
  show_format_badge: true,
  show_badges: true,
  show_traceability: true,
  show_sensory_profile: true,
  show_reviews: true,
  show_replenishment: true,
  continue_label: 'Seguir explorando',
  continue_label_en: 'Keep exploring',
  gallery_overlay_opacity: 0,
};

const LANDING_IDS: LandingSectionId[] = [
  'hero',
  'identidad',
  'conservation',
  'collections',
  'media',
  'products',
  'video',
  'club_legado',
  'map',
  'experiencias',
  'alianzas',
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

  const atmosphereRev = asNumber(raw.atmosphere_rev, 0, 0, 99);
  const atmosphereOptIn = atmosphereRev >= 2;

  return {
    sections,
    hero_variant: asString(raw.hero_variant, d.hero_variant),
    hero_video_url: asString(raw.hero_video_url, d.hero_video_url),
    show_grain: atmosphereOptIn ? asBool(raw.show_grain, false) : false,
    show_custom_cursor: atmosphereOptIn ? asBool(raw.show_custom_cursor, false) : false,
    show_bee_canvas: atmosphereOptIn ? asBool(raw.show_bee_canvas, false) : false,
    atmosphere_rev: atmosphereOptIn ? atmosphereRev : 2,
    hero_cta_label: asString(raw.hero_cta_label, d.hero_cta_label),
    hero_cta_label_en:
      typeof raw.hero_cta_label_en === 'string' ? raw.hero_cta_label_en : d.hero_cta_label_en,
    hero_cta_href: sanitizeStoreHref(raw.hero_cta_href, d.hero_cta_href) ?? d.hero_cta_href,
    show_hero_cta: asBool(raw.show_hero_cta, d.show_hero_cta),
    hero_eyebrow: asString(raw.hero_eyebrow, d.hero_eyebrow).trim(),
    hero_eyebrow_en:
      typeof raw.hero_eyebrow_en === 'string' ? raw.hero_eyebrow_en.trim() : d.hero_eyebrow_en,
    hero_title_line1: asString(raw.hero_title_line1, d.hero_title_line1).trim(),
    hero_title_line1_en:
      typeof raw.hero_title_line1_en === 'string'
        ? raw.hero_title_line1_en.trim()
        : d.hero_title_line1_en,
    hero_title_line2: asString(raw.hero_title_line2, d.hero_title_line2).trim(),
    hero_title_line2_en:
      typeof raw.hero_title_line2_en === 'string'
        ? raw.hero_title_line2_en.trim()
        : d.hero_title_line2_en,
    hero_subtitle: asString(raw.hero_subtitle, d.hero_subtitle).trim(),
    hero_subtitle_en:
      typeof raw.hero_subtitle_en === 'string' ? raw.hero_subtitle_en.trim() : d.hero_subtitle_en,
    hero_formula: asString(raw.hero_formula, d.hero_formula).trim(),
    hero_formula_en:
      typeof raw.hero_formula_en === 'string' ? raw.hero_formula_en.trim() : d.hero_formula_en,
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
      ['default', 'price-asc', 'price-desc', 'name', 'newest', 'impacto'] as const,
      d.default_sort,
    ),
    show_search: asBool(raw.show_search, d.show_search),
    show_filters: asBool(raw.show_filters, d.show_filters),
    show_formats_filter: asBool(raw.show_formats_filter, d.show_formats_filter ?? true),
    show_categories_filter: asBool(raw.show_categories_filter, d.show_categories_filter ?? true),
    show_stock_filter: asBool(raw.show_stock_filter, d.show_stock_filter ?? true),
    show_impact_filter: asBool(raw.show_impact_filter, d.show_impact_filter ?? false),
    sticky_bar: asBool(raw.sticky_bar, d.sticky_bar ?? false),
    show_ratings: asBool(raw.show_ratings, d.show_ratings),
    show_badges: asBool(raw.show_badges, d.show_badges),
    empty_message: asString(raw.empty_message, d.empty_message),
    empty_message_en:
      typeof raw.empty_message_en === 'string' ? raw.empty_message_en : d.empty_message_en,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    text_align: parseTextAlign(raw.text_align),
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
    show_sensory_profile: asBool(raw.show_sensory_profile, d.show_sensory_profile ?? true),
    show_reviews: asBool(raw.show_reviews, d.show_reviews),
    show_replenishment: asBool(raw.show_replenishment, d.show_replenishment),
    continue_label: asString(raw.continue_label, d.continue_label).trim(),
    continue_label_en:
      typeof raw.continue_label_en === 'string' ? raw.continue_label_en.trim() : d.continue_label_en,
    gallery_overlay_opacity: asNumber(raw.gallery_overlay_opacity, d.gallery_overlay_opacity ?? 0, 0, 100),
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
  identidad: 'Identidad',
  conservation: 'Impacto',
  collections: 'Grid colecciones',
  media: 'Media',
  products: 'Creaciones',
  video: 'Video',
  club_legado: 'Club Legado',
  map: 'Mapa',
  experiencias: 'Encuentros & Origen',
  alianzas: 'Alianzas & Negocios',
};

/** Fila de “Orden del home” → herramienta que edita las fichas (no otra entrada gemela). */
export const LANDING_SECTION_EDITOR_KEY: Partial<Record<LandingSectionId, string>> = {
  identidad: 'identidad_settings',
  conservation: 'conservation_content',
  collections: 'colecciones',
  media: 'media_items',
  products: 'products_settings',
  video: 'video_settings',
  club_legado: 'club_legado_settings',
  map: 'map_settings',
  experiencias: 'experiencias_home_settings',
  alianzas: 'alianzas_home_settings',
};


// ── Ola 3: SEO / Contacto / Banners ────────────────────────────────────────

export type PageSeoItem = {
  title?: string;
  description?: string;
  noindex?: boolean;
  keywords?: string[];
};

export type StoreSeoPageCategory = 'main' | 'catalog' | 'legal' | 'experience';

export type StoreSeoPageDef = {
  path: string;
  label: string;
  category: StoreSeoPageCategory;
  defaultTitle: string;
  defaultDescription: string;
};

export const STORE_SEO_PAGES: readonly StoreSeoPageDef[] = [
  {
    path: '/',
    label: 'Inicio',
    category: 'main',
    defaultTitle: 'Pureo, Chiloé · Miel de Patrimonio Forestal y Origen Territorial',
    defaultDescription: 'Miel cruda de floración viva, batido en frío y panal silvestre del Predio Pureo. 22 años regenerando el bosque nativo en Chiloé — La Obrera y el Zángano.',
  },
  {
    path: '/catalogo',
    label: 'Creaciones · Catálogo',
    category: 'catalog',
    defaultTitle: 'Creaciones · Catálogo',
    defaultDescription: 'Miel cruda del bosque nativo de Chiloé. Sachets, frascos y recolecciones con trazabilidad y origen de patrimonio forestal — La Obrera y el Zángano.',
  },
  {
    path: '/nosotros',
    label: 'Nosotros · Trayectoria',
    category: 'main',
    defaultTitle: 'Nosotros · Trayectoria y Vínculo',
    defaultDescription: 'Nuestra presencia en el bosque nativo de Chiloé y el compromiso con la abeja virgen — La Obrera y el Zángano.',
  },
  {
    path: '/experiencias',
    label: 'Experiencias de Origen',
    category: 'experience',
    defaultTitle: 'Experiencias de Origen en Chiloé',
    defaultDescription: 'Encuentros en el bosque nativo, catas guiadas y conocimiento apícola en el Predio Pureo.',
  },
  {
    path: '/club-legado-del-bosque',
    label: 'Club Legado del Bosque',
    category: 'main',
    defaultTitle: 'Club Legado del Bosque',
    defaultDescription: 'Membresía estacional de recolecciones exclusivas, asignaciones reservadas y catas de origen.',
  },
  {
    path: '/ciencia',
    label: 'Ciencia y Floraciones',
    category: 'main',
    defaultTitle: 'Ciencia · Patrimonio Botánico y Polen',
    defaultDescription: 'Estudio melisopalinológico, compuestos bioactivos y pureza de las floraciones nativas de Chiloé.',
  },
  {
    path: '/galeria',
    label: 'Galería Territorial',
    category: 'main',
    defaultTitle: 'Galería · Registros del Bosque',
    defaultDescription: 'Memoria visual, fotografía del bosque nativo y momentos de recolección en el archipiélago.',
  },
  {
    path: '/contacto',
    label: 'Contacto',
    category: 'main',
    defaultTitle: 'Contacto · La Obrera y el Zángano',
    defaultDescription: 'Canales directos de atención, pedidos especiales y alianzas con La Obrera y el Zángano.',
  },
  {
    path: '/alianzas',
    label: 'Alianzas B2B',
    category: 'main',
    defaultTitle: 'Alianzas y Formatos Profesionales',
    defaultDescription: 'Formatos para hotelería boutique, tostadurías, restaurantes de alta gama y tiendas de especialidad.',
  },
  {
    path: '/terminos',
    label: 'Términos del servicio',
    category: 'legal',
    defaultTitle: 'Términos del Servicio',
    defaultDescription: 'Condiciones de compra, derechos del consumidor y normas de uso del sitio web oficial.',
  },
  {
    path: '/privacidad',
    label: 'Política de privacidad',
    category: 'legal',
    defaultTitle: 'Política de Privacidad',
    defaultDescription: 'Tratamiento de datos personales y seguridad de la información conforme a la legislación chilena.',
  },
  {
    path: '/envio',
    label: 'Política de envío',
    category: 'legal',
    defaultTitle: 'Política de Envío y Despachos',
    defaultDescription: 'Tiempos de entrega, cobertura nacional y especificaciones de transporte con Blue Express.',
  },
  {
    path: '/reembolso',
    label: 'Política de reembolso',
    category: 'legal',
    defaultTitle: 'Política de Reembolso y Devolución',
    defaultDescription: 'Procedimientos y plazos para devoluciones y reembolsos de pedidos en la tienda.',
  },
  {
    path: '/cancelacion',
    label: 'Política de cancelación',
    category: 'legal',
    defaultTitle: 'Política de Cancelación',
    defaultDescription: 'Condiciones para anulación de compras antes del despacho logístico.',
  },
  {
    path: '/garantia',
    label: 'Garantía legal',
    category: 'legal',
    defaultTitle: 'Garantía Legal',
    defaultDescription: 'Garantía legal de 6 meses y estándar de calidad de origen conforme a la Ley del Consumidor.',
  },
  {
    path: '/cookies',
    label: 'Política de cookies',
    category: 'legal',
    defaultTitle: 'Política de Cookies',
    defaultDescription: 'Uso de cookies técnicas y de preferencias para el funcionamiento de la tienda.',
  },
];

export type SeoDefaults = {
  default_title: string;
  title_template: string;
  default_description: string;
  default_description_en?: string;
  og_image_url: string;
  site_name: string;
  twitter_handle: string;
  pages?: Record<string, PageSeoItem>;
};

export const DEFAULT_SEO_DEFAULTS: SeoDefaults = {
  default_title: 'La Obrera y el Zángano · Tienda',
  title_template: '%s · La Obrera y el Zángano',
  default_description: 'Miel cruda del bosque nativo de Chiloé.',
  default_description_en: 'Raw honey from the native forests of Chiloé.',
  og_image_url: '',
  site_name: 'La Obrera y el Zángano',
  twitter_handle: '',
  pages: {},
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
  /** Alineación de los párrafos de contacto (control del editor). */
  text_align?: TextAlign;
};

/** Copy del checkout editable desde el Editor de Tienda (auto-publish). */
export type CheckoutSettings = {
  title: string;
  subtitle: string;
  buyer_private_label: string;
  buyer_private_desc: string;
  buyer_legacy_label: string;
  buyer_legacy_desc: string;
  shipping_title: string;
  courier_label: string;
  shipping_note: string;
  postal_label: string;
  secure_payment_text: string;
  secure_transaction_text: string;
  terms_prefix: string;
  secure_note: string;
  /** Alineación de los párrafos del checkout (control del editor). */
  text_align?: TextAlign;
};

/** Copy del carrito editable desde el Editor de Tienda (auto-publish). */
export type CartSettings = {
  empty_title: string;
  empty_desc: string;
  empty_cta: string;
  subtotal_label: string;
  shipping_note: string;
  cta_label: string;
  free_shipping_enabled: boolean;
  free_shipping_threshold_clp: number;
  free_shipping_progress_text?: string;
  free_shipping_unlocked_text?: string;
  /** Alineación de los párrafos del carrito (control del editor). */
  text_align?: TextAlign;
};

/** Configuración de la campaña y vista de Reserva Anual en Tienda */
export type ReservaAnualSettings = {
  enabled: boolean;
  title: string;
  title_en: string;
  subtitle: string;
  subtitle_en: string;
  description: string;
  description_en: string;
  featured_product_id: string;
  button_text: string;
  button_text_en: string;
  allow_prepayment: boolean;
  /** Alineación de los párrafos de la reserva (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_RESERVA_ANUAL_SETTINGS: ReservaAnualSettings = {
  enabled: true,
  title: 'Reserva Anual',
  title_en: 'Annual Reservation',
  subtitle: 'Asegura tu parte del legado antes de que la naturaleza lo entregue',
  subtitle_en: 'Secure your share of the legacy before nature delivers it',
  description: 'Reserva anticipada vinculada a recolección de temporada. Te contactaremos para confirmar despacho y liquidación.',
  description_en: 'Early reservation tied to seasonal harvest. We will contact you to confirm shipping and settlement.',
  featured_product_id: '',
  button_text: 'Garantizar Mi Cupo',
  button_text_en: 'Guarantee My Spot',
  allow_prepayment: false,
};

export const RESERVA_ANUAL_TEMPLATE: ReservaAnualSettings = { ...DEFAULT_RESERVA_ANUAL_SETTINGS };

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  show_whatsapp_float: true,
  whatsapp_e164: '56940831358',
  whatsapp_prefill: 'Hola, vengo de la tienda La Obrera y el Zángano.',
  whatsapp_prefill_en: 'Hi, I am writing from the La Obrera y el Zángano store.',
  email: 'obrerayzangano@gmail.com',
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

export function parseLegalDoc(raw: Record<string, unknown> | null | undefined): LegalDocContent {
  const last =
    typeof raw?.last_updated === 'string' && raw.last_updated.trim()
      ? raw.last_updated.trim()
      : typeof raw?.updated_at === 'string' && raw.updated_at.trim()
        ? raw.updated_at.trim()
        : '';
  return {
    title: typeof raw?.title === 'string' ? raw.title.trim() : '',
    body: typeof raw?.body === 'string' ? raw.body.trim() : '',
    last_updated: last,
  };
}

export type PublicCopyRiskKind = 'stack_leak' | 'health_claim';

export type PublicCopyRisk = {
  kind: PublicCopyRiskKind;
  label: string;
};

/** Fugas de patio que no deben salir en copy público (legales, Nosotros, Ciencia). */
const STACK_LEAK_PATTERNS: ReadonlyArray<{ re: RegExp; label: string }> = [
  { re: /hostinger/i, label: 'Hostinger' },
  { re: /next\.js/i, label: 'Next.js' },
  { re: /turbopack/i, label: 'Turbopack' },
  { re: /\bhmr\b/i, label: 'HMR' },
  { re: /localhost:\d+/i, label: 'localhost' },
  { re: /\bsb-[a-z0-9]{8,}/i, label: 'ref sb-' },
];

/** Claims sanitarios / 20.606 que el editor no debe publicar como ficha de producto. */
const HEALTH_CLAIM_PATTERNS: ReadonlyArray<{ re: RegExp; label: string }> = [
  { re: /sustituye\s+az[uú]car/i, label: '“Sustituye azúcar”' },
  { re: /[ií]ndice\s+glic[eé]mico/i, label: 'índice glicémico' },
  { re: /\bhba1c\b/i, label: 'HbA1c' },
  { re: /ansi[oó]litic/i, label: 'claim ansiolítico' },
  { re: /antidepresiv/i, label: 'claim antidepresivo' },
  { re: /adicti/i, label: 'adicción' },
  { re: /trata(r|miento)?\s+(la\s+)?diabetes/i, label: 'tratar diabetes' },
  { re: /s[ií]ndrome\s+metab[oó]lico/i, label: 'síndrome metabólico' },
];

export function scanPublicCopyRisks(
  text: string,
  kinds: readonly PublicCopyRiskKind[] = ['stack_leak', 'health_claim'],
): PublicCopyRisk[] {
  if (!text.trim()) return [];
  const want = new Set(kinds);
  const found: PublicCopyRisk[] = [];
  if (want.has('stack_leak')) {
    for (const { re, label } of STACK_LEAK_PATTERNS) {
      if (re.test(text)) found.push({ kind: 'stack_leak', label });
    }
  }
  if (want.has('health_claim')) {
    for (const { re, label } of HEALTH_CLAIM_PATTERNS) {
      if (re.test(text)) found.push({ kind: 'health_claim', label });
    }
  }
  return found;
}

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
export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  title: 'Checkout Seguro',
  subtitle:
    'Tu pedido será procesado de forma segura. Cada compra contribuye a regenerar el bosque nativo de Chiloé.',
  buyer_private_label: 'Compra privada',
  buyer_private_desc: 'Entrega puntual sin cuenta. Tus datos no quedan en tu perfil.',
  buyer_legacy_label: 'Continuar mi legado',
  buyer_legacy_desc: 'Guardamos tu historial, impacto y direcciones para futuras visitas.',
  shipping_title: 'Envío en Chile',
  courier_label: 'Courier',
  shipping_note:
    'Por defecto despachamos con BlueExpress. Si necesitas otro operador o modalidad, elígelo aquí o contáctanos para coordinar algo a medida.',
  postal_label: 'Código postal',
  secure_payment_text: 'Pago encriptado',
  secure_transaction_text: 'Transacción segura',
  terms_prefix: 'Al completar tu compra, aceptas nuestros',
  secure_note: 'Tu pago está protegido con encriptación de grado bancario.',
};

export const DEFAULT_CART_SETTINGS: CartSettings = {
  empty_title: 'Tu carrito está vacío',
  empty_desc: 'Agrega productos para comenzar',
  empty_cta: 'Seguir comprando',
  subtotal_label: 'Subtotal',
  shipping_note: 'Envío calculado en checkout',
  cta_label: 'Finalizar compra',
  free_shipping_enabled: true,
  free_shipping_threshold_clp: 45000,
  free_shipping_progress_text: 'Te faltan {amount} para despacho gratis',
  free_shipping_unlocked_text: '✨ ¡Tienes despacho gratis incluido!',
};

export const CONTACT_SETTINGS_TEMPLATE = { ...DEFAULT_CONTACT_SETTINGS };
export const CHECKOUT_SETTINGS_TEMPLATE = { ...DEFAULT_CHECKOUT_SETTINGS };
export const CART_SETTINGS_TEMPLATE = { ...DEFAULT_CART_SETTINGS };

function parsePageSeoRecord(rawPages: unknown): Record<string, PageSeoItem> {
  if (!rawPages || typeof rawPages !== 'object' || Array.isArray(rawPages)) {
    return {};
  }
  const result: Record<string, PageSeoItem> = {};
  for (const [path, item] of Object.entries(rawPages as Record<string, unknown>)) {
    if (!item || typeof item !== 'object') continue;
    const itemObj = item as Record<string, unknown>;
    const keywords = Array.isArray(itemObj.keywords)
      ? itemObj.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      : undefined;

    result[path] = {
      title: typeof itemObj.title === 'string' ? itemObj.title : undefined,
      description: typeof itemObj.description === 'string' ? itemObj.description : undefined,
      noindex: typeof itemObj.noindex === 'boolean' ? itemObj.noindex : undefined,
      keywords,
    };
  }
  return result;
}

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
    pages: parsePageSeoRecord(raw.pages),
  };
}

/**
 * Resuelve título, descripción, directiva robots y palabras clave para una página
 * específica de la tienda, aplicando los overrides configurados en el CMS o
 * cayendo en el fallback predeterminado.
 */
export function resolvePageSeoMetadata(
  path: string,
  seo: SeoDefaults | null | undefined,
  fallback: { title: string; description: string },
): {
  title: string;
  description: string;
  robots?: { index: boolean; follow: boolean };
  keywords?: string[];
} {
  const pageSeo = seo?.pages?.[path];
  const title = pageSeo?.title?.trim() ? pageSeo.title.trim() : fallback.title;
  const description = pageSeo?.description?.trim() ? pageSeo.description.trim() : fallback.description;
  const isNoindex = Boolean(pageSeo?.noindex);

  return {
    title,
    description,
    robots: isNoindex ? { index: false, follow: false } : undefined,
    keywords: pageSeo?.keywords && pageSeo.keywords.length > 0 ? pageSeo.keywords : undefined,
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
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseCheckoutSettings(
  raw: Record<string, unknown> | null | undefined,
): CheckoutSettings {
  const d = DEFAULT_CHECKOUT_SETTINGS;
  if (!raw) return { ...d };
  return {
    title: asString(raw.title, d.title),
    subtitle: asString(raw.subtitle, d.subtitle),
    buyer_private_label: asString(raw.buyer_private_label, d.buyer_private_label),
    buyer_private_desc: asString(raw.buyer_private_desc, d.buyer_private_desc),
    buyer_legacy_label: asString(raw.buyer_legacy_label, d.buyer_legacy_label),
    buyer_legacy_desc: asString(raw.buyer_legacy_desc, d.buyer_legacy_desc),
    shipping_title: asString(raw.shipping_title, d.shipping_title),
    courier_label: asString(raw.courier_label, d.courier_label),
    shipping_note: asString(raw.shipping_note, d.shipping_note),
    postal_label: asString(raw.postal_label, d.postal_label),
    secure_payment_text: asString(raw.secure_payment_text, d.secure_payment_text),
    secure_transaction_text: asString(raw.secure_transaction_text, d.secure_transaction_text),
    terms_prefix: asString(raw.terms_prefix, d.terms_prefix),
    secure_note: asString(raw.secure_note, d.secure_note),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseCartSettings(raw: Record<string, unknown> | null | undefined): CartSettings {
  const d = DEFAULT_CART_SETTINGS;
  if (!raw) return { ...d };
  return {
    empty_title: asString(raw.empty_title, d.empty_title),
    empty_desc: asString(raw.empty_desc, d.empty_desc),
    empty_cta: asString(raw.empty_cta, d.empty_cta),
    subtotal_label: asString(raw.subtotal_label, d.subtotal_label),
    shipping_note: asString(raw.shipping_note, d.shipping_note),
    cta_label: asString(raw.cta_label, d.cta_label),
    free_shipping_enabled: asBool(raw.free_shipping_enabled, d.free_shipping_enabled),
    free_shipping_threshold_clp: asNumber(
      raw.free_shipping_threshold_clp,
      d.free_shipping_threshold_clp,
      0,
      1000000,
    ),
    free_shipping_progress_text: asString(
      raw.free_shipping_progress_text,
      d.free_shipping_progress_text || '',
    ),
    free_shipping_unlocked_text: asString(
      raw.free_shipping_unlocked_text,
      d.free_shipping_unlocked_text || '',
    ),
    text_align: parseTextAlign(raw.text_align),
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
    href: sanitizeStoreHref(raw.href, '/catalogo') ?? '/catalogo',
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

// ── Ola 4: Contenido de los bloques del home (CMS-izado) ───────────────────
// Vacío = la tienda cae al i18n (messages/*.json), mismo patrón del copy del
// hero en landing_layout.

export type ConservationContent = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
  /** Cabecera del bloque de triangulación (3 columnas). */
  tri_label: string;
  tri_label_en?: string;
  stat1_label: string;
  stat1_label_en?: string;
  stat2_label: string;
  stat2_label_en?: string;
  stat3_label: string;
  stat3_label_en?: string;
  stat4_label: string;
  stat4_label_en?: string;
  tri1_label: string;
  tri1_label_en?: string;
  tri1_desc: string;
  tri1_desc_en?: string;
  tri2_label: string;
  tri2_label_en?: string;
  tri2_desc: string;
  tri2_desc_en?: string;
  tri3_label: string;
  tri3_label_en?: string;
  tri3_desc: string;
  tri3_desc_en?: string;
  irr_label: string;
  irr_label_en?: string;
  irr_pos_title: string;
  irr_pos_title_en?: string;
  irr_pos_desc: string;
  irr_pos_desc_en?: string;
  irr_neg_title: string;
  irr_neg_title_en?: string;
  irr_neg_desc: string;
  irr_neg_desc_en?: string;
  cta_label: string;
  cta_label_en?: string;
  box_text?: string;
  box_text_en?: string;
  box_cta1_label?: string;
  box_cta1_label_en?: string;
  box_cta1_href?: string;
  box_cta2_label?: string;
  box_cta2_label_en?: string;
  box_cta2_href?: string;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export type HomeMediaItem = {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
};

export type VideoSettings = {
  /** Vacío → fallback a NEXT_PUBLIC_YOUTUBE_VIDEO_ID / id por defecto. */
  youtube_id: string;
  title?: string;
};

export type MapSettings = {
  lat: number;
  lng: number;
  popup_title: string;
  popup_body: string;
};

export type ProductsSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
  /** Productos destacados (se muestran primero en el bloque). Vacío = todos en orden. */
  featured_ids: string[];
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export type IdentidadSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
  body: string;
  body_en?: string;
  image: string;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_IDENTIDAD_SETTINGS: IdentidadSettings = {
  kicker: 'Identidad territorial',
  kicker_en: 'Territorial identity',
  title: 'Hecho en Chiloé',
  title_en: 'Made in Chiloé',
  desc: 'Nuestra apicultura real de la isla: La Obrera y el Zángano, 22 años regenerando el bosque nativo en el Predio Pureo, Queilén. Lo que el bosque nos enseña llega a tu mesa tal como nace: crudo, sin filtrar y trazado desde el apiario.',
  desc_en: 'Our real island beekeeping: La Obrera y el Zángano, 22 years regenerating native forest at Predio Pureo, Queilén. What the forest teaches us arrives at your table exactly as it is born: raw, unfiltered and traced from the apiary.',
  body: 'Lo que el bosque nos comparte, directo desde el sol, no se mejora: se honra. Que la miel de Chiloé se disfrute en Chile y el planeta, y que cada frasco siga sembrando el bosque que nos sobrevivirá.',
  body_en: 'What the forest shares with us, directly from the sun, is not improved: it is honored. May the honey of Chiloé be enjoyed in Chile and the planet, and may each jar continue to sow the forest that will outlive us.',
  image: '/assets/editorial/experiencias.jpg',
};

/** Defaults = copy actual de es.json/en.json (mensajes conservation + science). */
export const DEFAULT_CONSERVATION_CONTENT: ConservationContent = {
  kicker: 'Conservación demostrable',
  kicker_en: 'Proven conservation',
  title: 'Impacto sin atajos',
  title_en: 'Impact without shortcuts',
  desc: 'No certificamos con sellos de tercera mano. Nuestro impacto se demuestra por triangulación: papers revisados por pares, datos locales de Chiloé, y cálculos abiertos que cualquier persona puede verificar.',
  desc_en:
    "We don't certify with third-party seals. Our impact is proven by triangulation: peer-reviewed papers, local Chiloé data, and open calculations anyone can verify.",
  tri_label: 'Triangulación de fuentes',
  tri_label_en: 'Triangulation of sources',
  stat1_label: 'Árboles plantados',
  stat1_label_en: 'Trees planted',
  stat2_label: 'CO₂ evitado (kg)',
  stat2_label_en: 'CO₂ avoided (kg)',
  stat3_label: 'Colmenas activas',
  stat3_label_en: 'Active hives',
  stat4_label: 'Especies nativas',
  stat4_label_en: 'Native species',
  tri1_label: 'Papers revisados por pares',
  tri1_label_en: 'Peer-reviewed papers',
  tri1_desc:
    'Secuestro de carbono en bosque templado lluvioso: 10–25 kg CO₂/árbol/año (Schneider et al., 2020; Gutiérrez & Lara, 2022). Actividad antimicrobiana en mieles chilenas comparable a Manuka (Montes et al., 2019).',
  tri1_desc_en:
    'Carbon sequestration in temperate rainforest: 10–25 kg CO₂/tree/year (Schneider et al., 2020; Gutiérrez & Lara, 2022). Antimicrobial activity in Chilean honeys comparable to Manuka (Montes et al., 2019).',
  tri2_label: 'Datos locales de Chiloé',
  tri2_label_en: 'Local Chiloé data',
  // Versión estática: los números vivos (RPC get_ecosystem_metrics) solo se
  // interpolar en el fallback i18n; si se edita este campo, se usa tal cual.
  tri2_desc:
    'Árboles registrados con coordenadas y especie en sectores de Pureo. Colmenas monitoreadas en apiarios entre Quemchi, Molulco y Pureo-Queilén.',
  tri2_desc_en:
    'Trees registered with coordinates and species in sectors of Pureo. Hives monitored in apiaries between Quemchi, Molulco and Pureo-Queilén.',
  tri3_label: 'Cálculo abierto',
  tri3_label_en: 'Open calculation',
  tri3_desc:
    'IRR = CO₂ capturado / CO₂ emitido. Fórmula y datos verificables en nuestra página de ciencia.',
  tri3_desc_en:
    'IRR = CO₂ captured / CO₂ emitted. Formula and data verifiable on our science page.',
  irr_label: 'Índice de Regeneración Relativa',
  irr_label_en: 'Relative Regeneration Index',
  irr_pos_title: 'IRR · Impacto > Huella',
  irr_pos_title_en: 'IRR · Impact > Footprint',
  irr_pos_desc:
    'El bosque captura más CO₂ del que la cadena productiva emite. Demostrable por registro forestal + balances de emisión.',
  irr_pos_desc_en:
    'The forest captures more CO₂ than the production chain emits. Verifiable by forest registry + emission balances.',
  irr_neg_title: 'Miel de bosque + Reforestación > Huella de producción',
  irr_neg_title_en: 'Forest honey + Reforestation > Production footprint',
  irr_neg_desc:
    'Años de reforestación nativa. Cada pedido financia árboles y sostiene apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen.',
  irr_neg_desc_en:
    'Years of native reforestation. Each order funds trees and sustains apiaries in native forest between Quemchi, Molulco and Pureo-Quelen.',
  cta_label: 'Ver la ciencia detrás',
  cta_label_en: 'View the science behind',
  box_text: 'Cada frasco y membresía sostiene la reforestación activa y el censo de árboles en Chiloé.',
  box_text_en: 'Each jar and membership sustains active reforestation and tree census in Chiloé.',
  box_cta1_label: 'Conoce el Club Legado',
  box_cta1_label_en: 'Discover the Legacy Club',
  box_cta1_href: '/club-legado-del-bosque',
  box_cta2_label: 'Metodología y Ciencia Abierta →',
  box_cta2_label_en: 'Open Science & Methodology →',
  box_cta2_href: '/ciencia',
};

export const DEFAULT_MEDIA_ITEMS: HomeMediaItem[] = [
  { type: 'image', src: '/assets/editorial/immersion.png', alt: 'Inmersión en el bosque' },
  { type: 'image', src: '/assets/editorial/sachets.png', alt: 'Sachets de miel' },
  { type: 'image', src: '/assets/editorial/honey-jar.png', alt: 'Frascos de miel' },
];

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  youtube_id: '',
  title: 'La Obrera y el Zángano',
};

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  lat: -43.0837,
  lng: -73.6144,
  popup_title: 'Pureo Rural km 8560',
  popup_body: 'Queilén ~ Chiloé',
};

export const DEFAULT_PRODUCTS_SETTINGS: ProductsSettings = {
  kicker: 'Creaciones',
  kicker_en: 'Creations',
  title: 'La materia de nuestras búsquedas',
  title_en: 'The matter of our search',
  desc: 'Creaciones cargadas de experiencias y legado.',
  desc_en: 'Creations loaded with experiences and legacy.',
  featured_ids: [],
  image_aspect_ratio: '1/1',
  image_fit: 'cover',
};

export const COLLECTIONS_SETTINGS_TEMPLATE = { ...DEFAULT_COLLECTIONS_SETTINGS };
export const IDENTIDAD_SETTINGS_TEMPLATE = { ...DEFAULT_IDENTIDAD_SETTINGS };
export const GALERIA_SETTINGS_TEMPLATE = { ...DEFAULT_GALERIA_SETTINGS };
export const CONSERVATION_CONTENT_TEMPLATE = { ...DEFAULT_CONSERVATION_CONTENT };
export const HOME_MEDIA_ITEM_TEMPLATE: Record<string, string> = {
  /** Imagen: SIEMPRE subida (nunca URL manual) — el editor muestra uploader.
      Video: `type` en 'video' convierte `src` en URL del video (input de texto). */
  type: 'image',
  src: '',
  alt: '',
  kicker: '',
  title: '',
  subtitle: '',
  cta_label: '',
  cta_link: '',
};
export const VIDEO_SETTINGS_TEMPLATE = { ...DEFAULT_VIDEO_SETTINGS };
export const MAP_SETTINGS_TEMPLATE = { ...DEFAULT_MAP_SETTINGS };
export const PRODUCTS_SETTINGS_TEMPLATE = { ...DEFAULT_PRODUCTS_SETTINGS };
export const AUTH_SETTINGS_TEMPLATE = { ...DEFAULT_AUTH_SETTINGS };

// ── Club Legado Settings (Home) ───────────────────────────────────────────

export type ClubLegadoSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  button_text: string;
  button_text_en?: string;
  button_href: string;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_CLUB_LEGADO_SETTINGS: ClubLegadoSettings = {
  kicker: 'Club Legado del Bosque',
  kicker_en: 'Forest Legacy Club',
  title: 'Membresía y privilegios de cliente',
  title_en: 'Membership and client privileges',
  subtitle:
    'Al registrarte en la tienda formas parte del Club Legado. Una cuenta personal que activa beneficios exclusivos: reposición a tu ritmo, acceso preferente a reservas y microlotes, retorno de frascos con saldo a favor y trazabilidad de origen en cada entrega.',
  subtitle_en:
    'By registering in the store you join the Legacy Club. A personal account unlocking exclusive perks: flexible replenishment, priority reservations, jar return store credits, and verified origin traceability.',
  button_text: 'Unirme al Club',
  button_text_en: 'Join the Club',
  button_href: '/club-legado-del-bosque',
};

export const CLUB_LEGADO_SETTINGS_TEMPLATE: ClubLegadoSettings = {
  ...DEFAULT_CLUB_LEGADO_SETTINGS,
};

export function parseClubLegadoSettings(
  raw: Record<string, unknown> | null | undefined,
): ClubLegadoSettings {
  const d = DEFAULT_CLUB_LEGADO_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    button_text: asString(raw.button_text, d.button_text).trim(),
    button_text_en:
      typeof raw.button_text_en === 'string' ? raw.button_text_en.trim() : d.button_text_en,
    button_href: sanitizeStoreHref(raw.button_href, d.button_href) ?? d.button_href,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── Club Page Settings (/club-legado-del-bosque) ───────────────────────────

export type ClubPageSettings = {
  hero_kicker?: string;
  hero_kicker_en?: string;
  hero_badge?: string;
  hero_badge_en?: string;
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_image?: string;
  hero_image_opacity?: number;
  hero_card_image?: string;
  hero_card_kicker?: string;
  hero_card_kicker_en?: string;
  hero_card_badge_top?: string;
  hero_card_badge_top_en?: string;
  hero_card_title?: string;
  hero_card_title_en?: string;
  hero_card_text?: string;
  hero_card_text_en?: string;
  hero_card_badge_bottom?: string;
  hero_card_badge_bottom_en?: string;
  hero_card_link_label?: string;
  hero_card_link_label_en?: string;
  hero_card_link_href?: string;
  show_hero_card?: boolean;
  hero_cta_label?: string;
  hero_cta_label_en?: string;
  hero_cta_href?: string;
  hero_secondary_label?: string;
  hero_secondary_label_en?: string;
  hero_secondary_href?: string;
  beneficios_kicker?: string;
  beneficios_kicker_en?: string;
  beneficios_title?: string;
  beneficios_title_en?: string;
  beneficios_subtitle?: string;
  beneficios_subtitle_en?: string;
  show_beneficios?: boolean;
  how_it_works_title: string;
  how_it_works_title_en?: string;
  step1_text: string;
  step1_text_en?: string;
  step2_text: string;
  step2_text_en?: string;
  step3_text: string;
  step3_text_en?: string;
  step4_text: string;
  step4_text_en?: string;
  custodia_badge: string;
  custodia_badge_en?: string;
  custodia_title: string;
  custodia_title_en?: string;
  custodia_text: string;
  custodia_text_en?: string;
  tiers_title?: string;
  tiers_title_en?: string;
  tiers_subtitle?: string;
  tiers_subtitle_en?: string;
  wallet_title?: string;
  wallet_title_en?: string;
  wallet_text?: string;
  wallet_text_en?: string;
  retorno_title?: string;
  retorno_title_en?: string;
  retorno_text?: string;
  retorno_text_en?: string;
  seasons_kicker?: string;
  seasons_kicker_en?: string;
  seasons_title?: string;
  seasons_title_en?: string;
  seasons_subtitle?: string;
  seasons_subtitle_en?: string;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_CLUB_PAGE_SETTINGS: ClubPageSettings = {
  hero_kicker: 'Club Legado del Bosque',
  hero_kicker_en: 'Forest Legacy Club',
  hero_badge: 'Membresía de Cliente',
  hero_badge_en: 'Client Membership',
  hero_title: 'Club Legado del Bosque',
  hero_title_en: 'Forest Legacy Club',
  hero_subtitle:
    'Al registrarte en la tienda formas parte del Club Legado del Bosque. Tu cuenta activa un universo dedicado de privilegios: reposición periódica a tu medida, acceso prioritario a ediciones limitadas, trazabilidad botánica de cada frasco e invitaciones a catas privadas de autor.',
  hero_subtitle_en:
    'By registering in the store you become part of the Forest Legacy Club. Your account unlocks a dedicated universe of privileges: flexible replenishment, priority reservations, botanical traceability, and invitations to private author tastings.',
  hero_image: '/assets/editorial/hero-bosque-apertura.jpg',
  hero_image_opacity: 35,
  hero_card_image: '',
  hero_card_kicker: 'Club Legado',
  hero_card_kicker_en: 'Legacy Club',
  hero_card_badge_top: 'Membresía de Cliente',
  hero_card_badge_top_en: 'Client Membership',
  hero_card_title: 'Tu espacio reservado en el enjambre',
  hero_card_title_en: 'Your dedicated place in the swarm',
  hero_card_text:
    'Al crear tu cuenta en la tienda accedes a reposición flexible a tu ritmo, reservas prioritarias de floraciones escasas, pasaporte botánico en cada entrega y retorno circular de frascos con saldo a favor.',
  hero_card_text_en:
    'By creating your store account you access flexible replenishment at your pace, priority reservations for scarce blooms, a botanical passport with every delivery, and circular jar returns with store credit.',
  hero_card_badge_bottom: 'Registro Libre',
  hero_card_badge_bottom_en: 'Free Registration',
  hero_card_link_label: 'Ver 4 Ciclos →',
  hero_card_link_label_en: 'View 4 Cycles →',
  hero_card_link_href: '#niveles',
  show_hero_card: true,
  hero_cta_label: 'Crear mi cuenta',
  hero_cta_label_en: 'Create account',
  hero_cta_href: '/perfil',
  hero_secondary_label: 'Explorar privilegios',
  hero_secondary_label_en: 'Explore privileges',
  hero_secondary_href: '#beneficios',
  beneficios_kicker: 'Privilegios del Club',
  beneficios_kicker_en: 'Club Privileges',
  beneficios_title: 'Todas las posibilidades de ser parte del Club Legado',
  beneficios_title_en: 'All possibilities of joining the Legacy Club',
  beneficios_subtitle:
    'El Club no impone cobros de entrada: al crear tu cuenta en la tienda accedes a una experiencia dedicada, diseñada para acompañar tu consumo consciente con rigor, comodidad y origen directo.',
  beneficios_subtitle_en:
    'The Club imposes no membership fees: by creating your store account you access a dedicated experience designed to accompany your conscious consumption with rigor, ease, and direct origin.',
  show_beneficios: true,
  how_it_works_title: 'Cómo funciona',
  how_it_works_title_en: 'How it works',
  step1_text:
    'Registro libre en la tienda: Al crear tu cuenta quedas acreditado automáticamente en el Club Legado del Bosque, sin costos de membresía ni permanencias forzadas.',
  step1_text_en:
    'Free store registration: By creating your account you automatically join the Forest Legacy Club with no fees or lock-ins.',
  step2_text:
    'Reposición y reservas a tu medida: Configura entregas periódicas para tus variedades favoritas a tu propio ritmo, o asegura cupos preferentes en floraciones limitadas.',
  step2_text_en:
    'Replenishment and reservations tailored to you: Set periodic deliveries for your favorite honeys at your own pace, or secure priority spots in limited seasonal blooms.',
  step3_text:
    'Entrega directa con pasaporte de lote: Cada frasco llega directamente desde Chiloé acompañado de su pasaporte digital, análisis de laboratorio y relato de colmena.',
  step3_text_en:
    'Direct delivery with batch passport: Every jar arrives directly from Chiloé accompanied by its digital passport, lab analysis, and hive narrative.',
  step4_text:
    'Beneficios acumulables y economía circular: Suma ciclos de lealtad en cada compra, retorna tus frascos limpios con saldo a favor en tu cuenta y accede a catas privadas de autor.',
  step4_text_en:
    'Accumulated benefits and circular economy: Earn loyalty cycles with each order, return clean jars for store credit, and enjoy invitations to private author tastings.',
  custodia_badge: 'Presencia Territorial y Origen',
  custodia_badge_en: 'Territorial Presence and Origin',
  custodia_title: 'Apiarios propios en el bosque templado de Chiloé',
  custodia_title_en: 'Dedicated apiaries in the temperate rainforest of Chiloé',
  custodia_text:
    'Cada miel de La Obrera y el Zángano proviene exclusivamente de apiarios emplazados en el bosque nativo de Chiloé. Ser miembro del Club te conecta directamente con este territorio: sin intermediarios, con trazabilidad botánica y respeto absoluto por los ciclos naturales de la colmena.',
  custodia_text_en:
    'Every honey from La Obrera y el Zángano originates exclusively from our own apiaries in the native forest of Chiloé. Joining the Club connects you directly with this territory: no middlemen, full botanical traceability, and absolute respect for natural hive cycles.',
  tiers_title: 'Cuatro ciclos de permanencia y reciprocidad',
  tiers_title_en: 'Four cycles of permanence and reciprocity',
  tiers_subtitle:
    'En el bosque austral la lealtad es un círculo vivo. Cada entrega recibida, cada frasco retornado y cada año de permanencia suma ciclos que profundizan tu vínculo con los apiarios.',
  tiers_subtitle_en:
    'In the southern forest loyalty is a living circle. Each delivery, returned jar, and year of permanence adds cycles that deepen your bond with our apiaries.',
  wallet_title: 'Credencial de Guardián',
  wallet_title_en: 'Guardian Credential',
  wallet_text:
    'Tu cuenta genera un QR personal y una credencial descargable con tus ciclos acumulados, sellos de temporada y acceso en ferias y encuentros del bosque.',
  wallet_text_en:
    'Your account generates a personal QR and downloadable credential with your accumulated cycles, seasonal stamps, and access to forest gatherings and fairs.',
  retorno_title: 'Retorno de Frascos de Vidrio',
  retorno_title_en: 'Glass Jar Circular Return',
  retorno_text:
    'Nuestros frascos de vidrio están diseñados para circular. Por cada envase limpio que entregues en ferias, catas o puntos asociados, se acreditan $500 CLP de saldo en tu cuenta y 2 ciclos de fidelidad.',
  retorno_text_en:
    'Our glass jars are designed to circulate. For each clean jar returned at markets, tastings, or partner points, you receive $500 CLP store credit and 2 loyalty cycles.',
  seasons_kicker: 'Catálogo Estacional',
  seasons_kicker_en: 'Seasonal Catalog',
  seasons_title: 'Floraciones y Recolecciones de Temporada',
  seasons_title_en: 'Seasonal Blooms and Harvests',
  seasons_subtitle:
    'Como miembro registrado, accedes a reservas anticipadas y suscripciones de reposición para las floraciones nativas a medida que maduran en las colmenas.',
  seasons_subtitle_en:
    'As a registered member, you access early reservations and replenishment subscriptions for native blooms as they mature in the hives.',
};

export const CLUB_PAGE_SETTINGS_TEMPLATE: ClubPageSettings = {
  ...DEFAULT_CLUB_PAGE_SETTINGS,
};

export function parseClubPageSettings(
  raw: Record<string, unknown> | null | undefined,
): ClubPageSettings {
  const d = DEFAULT_CLUB_PAGE_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;
  const num = (key: string, fallback: number) => {
    const v = raw[key];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return fallback;
  };
  const bool = (key: string, fallback: boolean) => {
    const v = raw[key];
    return typeof v === 'boolean' ? v : typeof v === 'string' ? v === 'true' : fallback;
  };

  return {
    hero_kicker: es('hero_kicker', d.hero_kicker ?? ''),
    hero_kicker_en: en('hero_kicker_en', d.hero_kicker_en),
    hero_badge: es('hero_badge', d.hero_badge ?? ''),
    hero_badge_en: en('hero_badge_en', d.hero_badge_en),
    hero_title: es('hero_title', d.hero_title),
    hero_title_en: en('hero_title_en', d.hero_title_en),
    hero_subtitle: es('hero_subtitle', d.hero_subtitle),
    hero_subtitle_en: en('hero_subtitle_en', d.hero_subtitle_en),
    hero_image: es('hero_image', d.hero_image ?? ''),
    hero_image_opacity: num('hero_image_opacity', d.hero_image_opacity ?? 35),
    hero_card_image: es('hero_card_image', d.hero_card_image ?? ''),
    hero_card_kicker: es('hero_card_kicker', d.hero_card_kicker ?? ''),
    hero_card_kicker_en: en('hero_card_kicker_en', d.hero_card_kicker_en),
    hero_card_badge_top: es('hero_card_badge_top', d.hero_card_badge_top ?? ''),
    hero_card_badge_top_en: en('hero_card_badge_top_en', d.hero_card_badge_top_en),
    hero_card_title: es('hero_card_title', d.hero_card_title ?? ''),
    hero_card_title_en: en('hero_card_title_en', d.hero_card_title_en),
    hero_card_text: es('hero_card_text', d.hero_card_text ?? ''),
    hero_card_text_en: en('hero_card_text_en', d.hero_card_text_en),
    hero_card_badge_bottom: es('hero_card_badge_bottom', d.hero_card_badge_bottom ?? ''),
    hero_card_badge_bottom_en: en('hero_card_badge_bottom_en', d.hero_card_badge_bottom_en),
    hero_card_link_label: es('hero_card_link_label', d.hero_card_link_label ?? ''),
    hero_card_link_label_en: en('hero_card_link_label_en', d.hero_card_link_label_en),
    hero_card_link_href: es('hero_card_link_href', d.hero_card_link_href ?? ''),
    show_hero_card: bool('show_hero_card', d.show_hero_card ?? true),
    hero_cta_label: es('hero_cta_label', d.hero_cta_label ?? ''),
    hero_cta_label_en: en('hero_cta_label_en', d.hero_cta_label_en),
    hero_cta_href: es('hero_cta_href', d.hero_cta_href ?? ''),
    hero_secondary_label: es('hero_secondary_label', d.hero_secondary_label ?? ''),
    hero_secondary_label_en: en('hero_secondary_label_en', d.hero_secondary_label_en),
    hero_secondary_href: es('hero_secondary_href', d.hero_secondary_href ?? ''),
    beneficios_kicker: es('beneficios_kicker', d.beneficios_kicker ?? ''),
    beneficios_kicker_en: en('beneficios_kicker_en', d.beneficios_kicker_en),
    beneficios_title: es('beneficios_title', d.beneficios_title ?? ''),
    beneficios_title_en: en('beneficios_title_en', d.beneficios_title_en),
    beneficios_subtitle: es('beneficios_subtitle', d.beneficios_subtitle ?? ''),
    beneficios_subtitle_en: en('beneficios_subtitle_en', d.beneficios_subtitle_en),
    show_beneficios: bool('show_beneficios', d.show_beneficios ?? true),
    how_it_works_title: es('how_it_works_title', d.how_it_works_title),
    how_it_works_title_en: en('how_it_works_title_en', d.how_it_works_title_en),
    step1_text: es('step1_text', d.step1_text),
    step1_text_en: en('step1_text_en', d.step1_text_en),
    step2_text: es('step2_text', d.step2_text),
    step2_text_en: en('step2_text_en', d.step2_text_en),
    step3_text: es('step3_text', d.step3_text),
    step3_text_en: en('step3_text_en', d.step3_text_en),
    step4_text: es('step4_text', d.step4_text),
    step4_text_en: en('step4_text_en', d.step4_text_en),
    custodia_badge: es('custodia_badge', d.custodia_badge),
    custodia_badge_en: en('custodia_badge_en', d.custodia_badge_en),
    custodia_title: es('custodia_title', d.custodia_title),
    custodia_title_en: en('custodia_title_en', d.custodia_title_en),
    custodia_text: es('custodia_text', d.custodia_text),
    custodia_text_en: en('custodia_text_en', d.custodia_text_en),
    tiers_title: es('tiers_title', d.tiers_title ?? ''),
    tiers_title_en: en('tiers_title_en', d.tiers_title_en),
    tiers_subtitle: es('tiers_subtitle', d.tiers_subtitle ?? ''),
    tiers_subtitle_en: en('tiers_subtitle_en', d.tiers_subtitle_en),
    wallet_title: es('wallet_title', d.wallet_title ?? ''),
    wallet_title_en: en('wallet_title_en', d.wallet_title_en),
    wallet_text: es('wallet_text', d.wallet_text ?? ''),
    wallet_text_en: en('wallet_text_en', d.wallet_text_en),
    retorno_title: es('retorno_title', d.retorno_title ?? ''),
    retorno_title_en: en('retorno_title_en', d.retorno_title_en),
    retorno_text: es('retorno_text', d.retorno_text ?? ''),
    retorno_text_en: en('retorno_text_en', d.retorno_text_en),
    seasons_kicker: es('seasons_kicker', d.seasons_kicker ?? ''),
    seasons_kicker_en: en('seasons_kicker_en', d.seasons_kicker_en),
    seasons_title: es('seasons_title', d.seasons_title ?? ''),
    seasons_title_en: en('seasons_title_en', d.seasons_title_en),
    seasons_subtitle: es('seasons_subtitle', d.seasons_subtitle ?? ''),
    seasons_subtitle_en: en('seasons_subtitle_en', d.seasons_subtitle_en),
    text_align: parseTextAlign(raw.text_align),
  };
}

const MEDIA_TYPES = ['image', 'video'] as const;

export function parseIdentidadSettings(
  raw: Record<string, unknown> | null | undefined,
): IdentidadSettings {
  const d = DEFAULT_IDENTIDAD_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string) : fallback;
  return {
    kicker: es('kicker', d.kicker),
    kicker_en: en('kicker_en', d.kicker_en),
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    desc: es('desc', d.desc),
    desc_en: en('desc_en', d.desc_en),
    body: es('body', d.body),
    body_en: en('body_en', d.body_en),
    image: es('image', d.image),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseConservationContent(
  raw: Record<string, unknown> | null | undefined,
): ConservationContent {
  const d = DEFAULT_CONSERVATION_CONTENT;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string) : fallback;
  return {
    kicker: es('kicker', d.kicker),
    kicker_en: en('kicker_en', d.kicker_en),
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    desc: es('desc', d.desc),
    desc_en: en('desc_en', d.desc_en),
    tri_label: es('tri_label', d.tri_label),
    tri_label_en: en('tri_label_en', d.tri_label_en),
    stat1_label: es('stat1_label', d.stat1_label),
    stat1_label_en: en('stat1_label_en', d.stat1_label_en),
    stat2_label: es('stat2_label', d.stat2_label),
    stat2_label_en: en('stat2_label_en', d.stat2_label_en),
    stat3_label: es('stat3_label', d.stat3_label),
    stat3_label_en: en('stat3_label_en', d.stat3_label_en),
    stat4_label: es('stat4_label', d.stat4_label),
    stat4_label_en: en('stat4_label_en', d.stat4_label_en),
    tri1_label: es('tri1_label', d.tri1_label),
    tri1_label_en: en('tri1_label_en', d.tri1_label_en),
    tri1_desc: es('tri1_desc', d.tri1_desc),
    tri1_desc_en: en('tri1_desc_en', d.tri1_desc_en),
    tri2_label: es('tri2_label', d.tri2_label),
    tri2_label_en: en('tri2_label_en', d.tri2_label_en),
    tri2_desc: es('tri2_desc', d.tri2_desc),
    tri2_desc_en: en('tri2_desc_en', d.tri2_desc_en),
    tri3_label: es('tri3_label', d.tri3_label),
    tri3_label_en: en('tri3_label_en', d.tri3_label_en),
    tri3_desc: es('tri3_desc', d.tri3_desc),
    tri3_desc_en: en('tri3_desc_en', d.tri3_desc_en),
    irr_label: es('irr_label', d.irr_label),
    irr_label_en: en('irr_label_en', d.irr_label_en),
    irr_pos_title: es('irr_pos_title', d.irr_pos_title),
    irr_pos_title_en: en('irr_pos_title_en', d.irr_pos_title_en),
    irr_pos_desc: es('irr_pos_desc', d.irr_pos_desc),
    irr_pos_desc_en: en('irr_pos_desc_en', d.irr_pos_desc_en),
    irr_neg_title: es('irr_neg_title', d.irr_neg_title),
    irr_neg_title_en: en('irr_neg_title_en', d.irr_neg_title_en),
    irr_neg_desc: es('irr_neg_desc', d.irr_neg_desc),
    irr_neg_desc_en: en('irr_neg_desc_en', d.irr_neg_desc_en),
    cta_label: es('cta_label', d.cta_label),
    cta_label_en: en('cta_label_en', d.cta_label_en),
    box_text: es('box_text', d.box_text ?? ''),
    box_text_en: en('box_text_en', d.box_text_en),
    box_cta1_label: es('box_cta1_label', d.box_cta1_label ?? ''),
    box_cta1_label_en: en('box_cta1_label_en', d.box_cta1_label_en),
    box_cta1_href: es('box_cta1_href', d.box_cta1_href ?? '/club-legado-del-bosque'),
    box_cta2_label: es('box_cta2_label', d.box_cta2_label ?? ''),
    box_cta2_label_en: en('box_cta2_label_en', d.box_cta2_label_en),
    box_cta2_href: es('box_cta2_href', d.box_cta2_href ?? '/ciencia'),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseHomeMediaItem(raw: Record<string, unknown>): HomeMediaItem | null {
  // `image` (nuevo, uploader) con fallback a `src` (items viejos de la ola 4), `url` y `image_url`.
  const src =
    (typeof raw.image === 'string' ? raw.image.trim() : '') ||
    (typeof raw.src === 'string' ? raw.src.trim() : '') ||
    (typeof raw.url === 'string' ? raw.url.trim() : '') ||
    (typeof raw.image_url === 'string' ? raw.image_url.trim() : '');
  if (!src) return null;
  return {
    type: pickEnum(raw.type, MEDIA_TYPES, 'image'),
    src,
    alt: typeof raw.alt === 'string' && raw.alt.trim() ? raw.alt.trim() : undefined,
    kicker: typeof raw.kicker === 'string' && raw.kicker.trim() ? raw.kicker.trim() : undefined,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : undefined,
    subtitle: typeof raw.subtitle === 'string' && raw.subtitle.trim() ? raw.subtitle.trim() : undefined,
    cta_label: typeof raw.cta_label === 'string' && raw.cta_label.trim() ? raw.cta_label.trim() : undefined,
    cta_link: typeof raw.cta_link === 'string' && raw.cta_link.trim() ? raw.cta_link.trim() : undefined,
  };
}

export function parseVideoSettings(raw: Record<string, unknown> | null | undefined): VideoSettings {
  const d = DEFAULT_VIDEO_SETTINGS;
  if (!raw) return { ...d };
  return {
    youtube_id: typeof raw.youtube_id === 'string' ? raw.youtube_id.trim() : d.youtube_id,
    title: typeof raw.title === 'string' ? raw.title : d.title,
  };
}

export function parseMapSettings(raw: Record<string, unknown> | null | undefined): MapSettings {
  const d = DEFAULT_MAP_SETTINGS;
  if (!raw) return { ...d };
  return {
    lat: asNumber(raw.lat, d.lat, -90, 90),
    lng: asNumber(raw.lng, d.lng, -180, 180),
    popup_title: asString(raw.popup_title, d.popup_title),
    popup_body: asString(raw.popup_body, d.popup_body),
  };
}

export function parseProductsSettings(
  raw: Record<string, unknown> | null | undefined,
): ProductsSettings {
  const d = DEFAULT_PRODUCTS_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en : d.kicker_en,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    desc: asString(raw.desc, d.desc),
    desc_en: typeof raw.desc_en === 'string' ? raw.desc_en : d.desc_en,
    featured_ids: Array.isArray(raw.featured_ids)
      ? raw.featured_ids.filter((x): x is string => typeof x === 'string')
      : [],
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseCollectionsSettings(
  raw: Record<string, unknown> | null | undefined,
): CollectionsSettings {
  const d = DEFAULT_COLLECTIONS_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en : d.kicker_en,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    grid_columns: asNumber(raw.grid_columns, d.grid_columns, 2, 4),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseGaleriaSettings(
  raw: Record<string, unknown> | null | undefined,
): GaleriaSettings {
  const d = DEFAULT_GALERIA_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en : d.kicker_en,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    grid_columns: asNumber(raw.grid_columns, d.grid_columns, 2, 4),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseNosotrosSettings(
  raw: Record<string, unknown> | null | undefined,
): NosotrosSettings {
  const d = DEFAULT_NOSOTROS_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en : d.kicker_en,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 100, 0, 100),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseMediaSettings(
  raw: Record<string, unknown> | null | undefined,
): MediaSettings {
  const d = DEFAULT_MEDIA_SETTINGS;
  if (!raw) return { ...d };
  let autoplayMs = d.autoplay_ms;
  if (typeof raw.autoplay_seconds === 'number') {
    autoplayMs = raw.autoplay_seconds * 1000;
  } else if (typeof raw.autoplay_ms === 'number') {
    // Si viene en segundos (<= 20, ej: 0, 2, 5, 7, 10, 12, 15), multiplicar por 1000
    autoplayMs = raw.autoplay_ms <= 20 ? raw.autoplay_ms * 1000 : raw.autoplay_ms;
  }
  return {
    carousel_height: pickEnum(raw.carousel_height, CAROUSEL_HEIGHT_MODES, d.carousel_height),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    autoplay_ms: Math.max(0, Math.min(30000, autoplayMs)),
  };
}

export function parseCienciaSettings(
  raw: Record<string, unknown> | null | undefined,
): CienciaSettings {
  const d = DEFAULT_CIENCIA_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en : d.kicker_en,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    hero_image: typeof raw.hero_image === 'string' ? raw.hero_image.trim() : d.hero_image,
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 25, 0, 100),
    text_align: parseTextAlign(raw.text_align),
  };
}

export function parseAuthSettings(
  raw: Record<string, unknown> | null | undefined,
): AuthSettings {
  const d = DEFAULT_AUTH_SETTINGS;
  if (!raw) return { ...d };
  return {
    hero_title: asString(raw.hero_title, d.hero_title),
    hero_title_en: typeof raw.hero_title_en === 'string' ? raw.hero_title_en : d.hero_title_en,
    hero_subtitle: asString(raw.hero_subtitle, d.hero_subtitle),
    hero_subtitle_en: typeof raw.hero_subtitle_en === 'string' ? raw.hero_subtitle_en : d.hero_subtitle_en,
    tagline_phrase: asString(raw.tagline_phrase, d.tagline_phrase),
    tagline_phrase_en: typeof raw.tagline_phrase_en === 'string' ? raw.tagline_phrase_en : d.tagline_phrase_en,
    background_style: pickEnum(raw.background_style, AUTH_BACKGROUND_STYLES, d.background_style),
    background_image_url: typeof raw.background_image_url === 'string' ? raw.background_image_url : d.background_image_url,
    particle_effect: pickEnum(raw.particle_effect, AUTH_PARTICLE_EFFECTS, d.particle_effect),
    blur_orb_color: typeof raw.blur_orb_color === 'string' ? raw.blur_orb_color : d.blur_orb_color,
  };
}

export function parseReservaAnualSettings(
  raw: Record<string, unknown> | null | undefined,
): ReservaAnualSettings {
  const d = DEFAULT_RESERVA_ANUAL_SETTINGS;
  if (!raw) return { ...d };
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : d.enabled,
    title: asString(raw.title, d.title),
    title_en: typeof raw.title_en === 'string' ? raw.title_en : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    description: asString(raw.description, d.description),
    description_en: typeof raw.description_en === 'string' ? raw.description_en : d.description_en,
    featured_product_id: asString(raw.featured_product_id, d.featured_product_id),
    button_text: asString(raw.button_text, d.button_text),
    button_text_en: typeof raw.button_text_en === 'string' ? raw.button_text_en : d.button_text_en,
    allow_prepayment: typeof raw.allow_prepayment === 'boolean' ? raw.allow_prepayment : d.allow_prepayment,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── B2B Alianzas & Negocios ────────────────────────────────────────────────

export type B2BSegmentSlug =
  | 'cafeterias'
  | 'hoteles'
  | 'tiendas-gourmet'
  | 'ferias'
  | 'revendedores';

export const B2B_SEGMENT_SLUGS: readonly B2BSegmentSlug[] = [
  'cafeterias',
  'hoteles',
  'tiendas-gourmet',
  'ferias',
  'revendedores',
] as const;

export type B2BValueProp = {
  icon: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
};

export type B2BStat = {
  value: string;
  label: string;
  label_en?: string;
};

export type B2BProcessStep = {
  step: string;
  title: string;
  title_en?: string;
  desc: string;
  desc_en?: string;
};

export type B2BFaqItem = {
  question: string;
  question_en?: string;
  answer: string;
  answer_en?: string;
};

export type B2BKitComponent = {
  cantidad: string;
  item: string;
  detalle?: string;
};

export type B2BKitIntegration = {
  titulo: string;
  descripcion: string;
  tag: 'resenas' | 'trazabilidad' | 'fidelizacion' | 'pricing' | 'marketing';
};

export type B2BKitItem = {
  id: string;
  nombre: string;
  nombre_en?: string;
  badge: string;
  badge_en?: string;
  tier: 'entrada' | 'medio' | 'avanzado' | 'especialidad';
  tagline: string;
  tagline_en?: string;
  descripcion: string;
  descripcion_en?: string;
  precio_neto_clp: number;
  pvp_estimado_clp: number;
  margen_estimado_pct: number;
  moq_summary: string;
  moq_summary_en?: string;
  sales_strategy: string;
  sales_strategy_en?: string;
  componentes_fisicos: (B2BKitComponent | string)[];
  herramientas_servicio: string[];
  materiales_exhibicion: string[];
  integraciones_digitales: (B2BKitIntegration | string)[];
  recomendado_para: string;
  recomendado_para_en?: string;
};

export type B2BToolItem = {
  id: string;
  nombre: string;
  nombre_en?: string;
  material: string;
  rol: string;
  descripcion: string;
  descripcion_en?: string;
  impacto_ventas: string;
  impacto_ventas_en?: string;
  foto?: string;
};

export type B2BCommercialStrategy = {
  titulo: string;
  titulo_en?: string;
  bajada: string;
  bajada_en?: string;
  aumento_ticket: string;
  aumento_ticket_en?: string;
  mecanica_ventas: string[];
  herramienta_clave: string;
  herramienta_clave_en?: string;
};

export type B2BCodeModule = {
  id: string;
  package_name: string;
  titulo: string;
  titulo_en?: string;
  descripcion: string;
  descripcion_en?: string;
  badge: string;
  beneficio_comercial: string;
  beneficio_comercial_en?: string;
};

export type B2BSegmentContentSettings = {
  slug: B2BSegmentSlug;
  tipo: string;
  kicker: string;
  kicker_en?: string;
  headline: string;
  headline_en?: string;
  subheadline: string;
  subheadline_en?: string;
  hero_image: string;
  suggested_products_copy: string;
  suggested_products_copy_en?: string;
  cta_text: string;
  cta_text_en?: string;
  cta_href: string;
  value_props: B2BValueProp[];
  stats: B2BStat[];
  process: B2BProcessStep[];
  faq: B2BFaqItem[];
  kits?: B2BKitItem[];
  tools?: B2BToolItem[];
  commercial_strategy?: B2BCommercialStrategy;
  code_modules?: B2BCodeModule[];
  seo_title?: string;
  seo_title_en?: string;
  seo_description?: string;
  seo_description_en?: string;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => asString(x, '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function parseB2BValueProp(raw: unknown): B2BValueProp | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title, '').trim();
  if (!title) return null;
  return {
    icon: asString(r.icon, 'Package').trim(),
    title,
    title_en: typeof r.title_en === 'string' ? r.title_en.trim() : undefined,
    description: asString(r.description, '').trim(),
    description_en: typeof r.description_en === 'string' ? r.description_en.trim() : undefined,
  };
}

export function parseB2BStat(raw: unknown): B2BStat | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const value = asString(r.value, '').trim();
  if (!value) return null;
  return {
    value,
    label: asString(r.label, '').trim(),
    label_en: typeof r.label_en === 'string' ? r.label_en.trim() : undefined,
  };
}

export function parseB2BProcessStep(raw: unknown): B2BProcessStep | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title, '').trim();
  if (!title) return null;
  const descVal = r.desc !== undefined ? r.desc : r.description;
  const descEnVal = r.desc_en !== undefined ? r.desc_en : r.description_en;
  return {
    step: asString(r.step, '01').trim(),
    title,
    title_en: typeof r.title_en === 'string' ? r.title_en.trim() : undefined,
    desc: asString(descVal, '').trim(),
    desc_en: typeof descEnVal === 'string' ? descEnVal.trim() : undefined,
  };
}

export function parseB2BFaqItem(raw: unknown): B2BFaqItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const question = asString(r.question, '').trim();
  if (!question) return null;
  return {
    question,
    question_en: typeof r.question_en === 'string' ? r.question_en.trim() : undefined,
    answer: asString(r.answer, '').trim(),
    answer_en: typeof r.answer_en === 'string' ? r.answer_en.trim() : undefined,
  };
}

export function parseB2BKitItem(raw: unknown): B2BKitItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nombre = asString(r.nombre ?? r.name, '').trim();
  if (!nombre) return null;
  const id = asString(r.id, '').trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const badge = asString(r.badge, '').trim();
  const tierRaw = asString(r.tier, 'entrada').trim().toLowerCase();
  const tier: 'entrada' | 'medio' | 'avanzado' | 'especialidad' =
    tierRaw === 'medio' || tierRaw === 'avanzado' || tierRaw === 'especialidad' ? tierRaw : 'entrada';
  const tagline = asString(r.tagline, '').trim();
  const descripcion = asString(r.descripcion ?? r.description, '').trim();
  const precio_neto_clp = typeof r.precio_neto_clp === 'number'
    ? r.precio_neto_clp
    : typeof r.precioNetoClp === 'number'
    ? r.precioNetoClp
    : Number(asString(r.precio_neto_clp ?? r.precioNetoClp, '0').replace(/[^0-9]/g, '')) || 0;
  const pvp_estimado_clp = typeof r.pvp_estimado_clp === 'number'
    ? r.pvp_estimado_clp
    : typeof r.pvpEstimadoClp === 'number'
    ? r.pvpEstimadoClp
    : Number(asString(r.pvp_estimado_clp ?? r.pvpEstimadoClp, '0').replace(/[^0-9]/g, '')) || 0;
  const margen_estimado_pct = typeof r.margen_estimado_pct === 'number'
    ? r.margen_estimado_pct
    : typeof r.margenEstimadoPct === 'number'
    ? r.margenEstimadoPct
    : Number(asString(r.margen_estimado_pct ?? r.margenEstimadoPct, '0').replace(/[^0-9]/g, '')) || 0;
  const moq_summary = asString(r.moq_summary ?? r.moqSummary, '').trim();
  const sales_strategy = asString(r.sales_strategy ?? r.salesStrategy, '').trim();

  const componentes_fisicos: (B2BKitComponent | string)[] = [];
  const rawComp = r.componentes_fisicos ?? r.componentesFisicos;
  if (Array.isArray(rawComp)) {
    for (const c of rawComp) {
      if (typeof c === 'string' && c.trim()) {
        componentes_fisicos.push(c.trim());
      } else if (c && typeof c === 'object') {
        const co = c as Record<string, unknown>;
        const itm = asString(co.item, '').trim();
        if (itm) {
          componentes_fisicos.push({
            cantidad: asString(co.cantidad, '1 un.').trim(),
            item: itm,
            detalle: typeof co.detalle === 'string' ? co.detalle.trim() : undefined,
          });
        }
      }
    }
  }

  const herramientas_servicio = parseStringList(r.herramientas_servicio ?? r.herramientasServicio);
  const materiales_exhibicion = parseStringList(r.materiales_exhibicion ?? r.materialesExhibicion);

  const integraciones_digitales: (B2BKitIntegration | string)[] = [];
  const rawInt = r.integraciones_digitales ?? r.integracionesDigitales;
  if (Array.isArray(rawInt)) {
    for (const item of rawInt) {
      if (typeof item === 'string' && item.trim()) {
        integraciones_digitales.push(item.trim());
      } else if (item && typeof item === 'object') {
        const io = item as Record<string, unknown>;
        const tit = asString(io.titulo ?? io.title, '').trim();
        if (tit) {
          integraciones_digitales.push({
            titulo: tit,
            descripcion: asString(io.descripcion ?? io.description, '').trim(),
            tag: (io.tag as B2BKitIntegration['tag']) || 'marketing',
          });
        }
      }
    }
  }

  const recomendado_para = asString(r.recomendado_para ?? r.recomendadoPara, '').trim();

  return {
    id,
    nombre,
    nombre_en: typeof r.nombre_en === 'string' ? r.nombre_en.trim() : undefined,
    badge,
    badge_en: typeof r.badge_en === 'string' ? r.badge_en.trim() : undefined,
    tier,
    tagline,
    tagline_en: typeof r.tagline_en === 'string' ? r.tagline_en.trim() : undefined,
    descripcion,
    descripcion_en: typeof r.descripcion_en === 'string' ? r.descripcion_en.trim() : undefined,
    precio_neto_clp,
    pvp_estimado_clp,
    margen_estimado_pct,
    moq_summary,
    moq_summary_en: typeof r.moq_summary_en === 'string' ? r.moq_summary_en.trim() : undefined,
    sales_strategy,
    sales_strategy_en: typeof r.sales_strategy_en === 'string' ? r.sales_strategy_en.trim() : undefined,
    componentes_fisicos,
    herramientas_servicio,
    materiales_exhibicion,
    integraciones_digitales,
    recomendado_para,
    recomendado_para_en: typeof r.recomendado_para_en === 'string' ? r.recomendado_para_en.trim() : undefined,
  };
}

export function parseB2BToolItem(raw: unknown): B2BToolItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nombre = asString(r.nombre ?? r.name, '').trim();
  if (!nombre) return null;
  const id = asString(r.id, '').trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id,
    nombre,
    nombre_en: typeof r.nombre_en === 'string' ? r.nombre_en.trim() : undefined,
    material: asString(r.material, '').trim(),
    rol: asString(r.rol ?? r.role, '').trim(),
    descripcion: asString(r.descripcion ?? r.description, '').trim(),
    descripcion_en: typeof r.descripcion_en === 'string' ? r.descripcion_en.trim() : undefined,
    impacto_ventas: asString(r.impacto_ventas ?? r.impactoVentas, '').trim(),
    impacto_ventas_en: typeof r.impacto_ventas_en === 'string' ? r.impacto_ventas_en.trim() : undefined,
    foto: typeof r.foto === 'string' ? r.foto.trim() : undefined,
  };
}

export function parseB2BCommercialStrategy(raw: unknown): B2BCommercialStrategy | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const titulo = asString(r.titulo ?? r.title ?? r.strategy_title, '').trim();
  if (!titulo) return null;
  return {
    titulo,
    titulo_en: typeof r.titulo_en === 'string' ? r.titulo_en.trim() : (typeof r.strategy_title_en === 'string' ? r.strategy_title_en.trim() : undefined),
    bajada: asString(r.bajada ?? r.summary ?? r.strategy_summary, '').trim(),
    bajada_en: typeof r.bajada_en === 'string' ? r.bajada_en.trim() : (typeof r.strategy_summary_en === 'string' ? r.strategy_summary_en.trim() : undefined),
    aumento_ticket: asString(r.aumento_ticket ?? r.aumentoTicket ?? r.strategy_ticket_boost, '').trim(),
    aumento_ticket_en: typeof r.aumento_ticket_en === 'string' ? r.aumento_ticket_en.trim() : (typeof r.strategy_ticket_boost_en === 'string' ? r.strategy_ticket_boost_en.trim() : undefined),
    mecanica_ventas: parseStringList(r.mecanica_ventas ?? r.mecanicaVentas ?? r.strategy_steps),
    herramienta_clave: asString(r.herramienta_clave ?? r.herramientaClave ?? r.strategy_key_tool, '').trim(),
    herramienta_clave_en: typeof r.herramienta_clave_en === 'string' ? r.herramienta_clave_en.trim() : (typeof r.strategy_key_tool_en === 'string' ? r.strategy_key_tool_en.trim() : undefined),
  };
}

export function parseB2BCodeModule(raw: unknown): B2BCodeModule | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const titulo = asString(r.titulo ?? r.title, '').trim();
  if (!titulo) return null;
  const package_name = asString(r.package_name ?? r.packageName ?? r.package, '@enjambre/sale-qr').trim();
  const id = asString(r.id, '').trim() || package_name.replace(/[^a-z0-9]+/g, '-');
  return {
    id,
    package_name,
    titulo,
    titulo_en: typeof r.titulo_en === 'string' ? r.titulo_en.trim() : undefined,
    descripcion: asString(r.descripcion ?? r.description, '').trim(),
    descripcion_en: typeof r.descripcion_en === 'string' ? r.descripcion_en.trim() : undefined,
    badge: asString(r.badge, 'software').trim(),
    beneficio_comercial: asString(r.beneficio_comercial ?? r.beneficioComercial ?? r.benefit, '').trim(),
    beneficio_comercial_en: typeof r.beneficio_comercial_en === 'string' ? r.beneficio_comercial_en.trim() : undefined,
  };
}

export const DEFAULT_B2B_CAFETERIAS: B2BSegmentContentSettings = {
  slug: 'cafeterias',
  tipo: 'cafeteria',
  kicker: 'PARA CAFETERÍAS DE ESPECIALIDAD',
  kicker_en: 'FOR SPECIALTY COFFEE SHOPS',
  headline: 'Pequeñas creaciones para una gran taza.',
  headline_en: 'Small creations for an exceptional cup.',
  subheadline:
    'Cuatro cremas de miel cruda de Chiloé, batidas en frío y servidas en frascos de 25 g. Bosque, colmena, cacao y avellana en una pieza de mesa que transforma una infusión en un gesto de origen.',
  subheadline_en:
    'Four raw honey creams from Chiloé, cold-churned and served in 25 g jars. Forest, hive, cacao, and hazelnut in a table piece that elevates any brew into an origin statement.',
  hero_image: '/images/b2b/hero-cafeterias.jpg',
  suggested_products_copy:
    'CREACIONES PARA LA BARRA. Cada creación comienza con crema de miel cruda de Chiloé y se abre hacia un segundo ingrediente cuidadosamente elegido. No son sabores añadidos para distraer: son encuentros de textura, origen y tiempo.',
  cta_text: 'SOLICITAR PROPUESTA PARA MI CAFETERÍA',
  cta_text_en: 'REQUEST PROPOSAL FOR MY COFFEE SHOP',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Barra: El Gesto de Origen en Taza',
    titulo_en: 'Bar Strategy: The Statement of Origin in Every Cup',
    bajada:
      'Transforma cada infusión o café en una experiencia de degustación que incrementa el ticket medio y despierta el deseo de llevar frascos a casa.',
    bajada_en:
      'Transform each brew into a sensory tasting experience that lifts the average ticket and drives retail jar take-home sales.',
    aumento_ticket: '+$1.500 CLP por taza servida · Rotación estimada: 18 frascos/semana',
    aumento_ticket_en: '+$1,500 CLP per served cup · Estimated turnover: 18 jars/week',
    mecanica_ventas: [
      'Servicio en mesa: Añade una monodosis de 25g de crema de miel cruda o crema de avellana/cacao en la bandeja de la infusión o espresso con un recargo de +$1.500 CLP.',
      'Ritual sensorial: El barista presenta la rueda de maridaje de café y miel, explicando cómo el origen botánico equilibra la acidez y notas de cata.',
      'Conversión a retail: El comensal que disfrutó su taza ve el exhibidor de mesón y adquiere el frasco de 150g para continuar la experiencia en casa (margen 40%).',
      'Captura de reseñas: El cliente escanea el tótem QR de mesa en madera nativa, registra su nota de cata y desbloquea beneficios en su próxima visita.',
    ],
    herramienta_clave: 'Tótem de Barra en Roble Chilote con QR de Origen & Reseñas',
    herramienta_clave_en: 'Chiloé Oak Counter Totem with Origin QR & Verified Reviews',
  },
  tools: [
    {
      id: 'totem-roble',
      nombre: 'Tótem de Barra en Roble Chilote',
      nombre_en: 'Chiloé Native Oak Counter Totem',
      material: 'Roble de Chiloé recuperado curado con cera virgen de abejas',
      rol: 'Soporte de Mesón & QR de Origen',
      descripcion:
        'Pieza maciza con grabado láser del mapa de Chiloé y código QR de alta resolución que conecta con el pasaporte de lote y reseñas verificadas.',
      descripcion_en:
        'Solid native oak piece laser-engraved with the Chiloé map and high-resolution QR linking to batch passports and verified customer reviews.',
      impacto_ventas: 'Genera interacción visual inmediata en el mesón de caja e incrementa el registro de comensales en un 35%.',
      impacto_ventas_en: 'Drives immediate visual interest at point-of-sale and boosts customer onboarding by 35%.',
    },
    {
      id: 'rueda-maridaje',
      nombre: 'Rueda de Maridaje Café & Miel en Papel Mineral',
      nombre_en: 'Coffee & Honey Pairing Wheel in Mineral Paper',
      material: 'Papel mineral impermeable lavable de alta densidad',
      rol: 'Guía de Servicio para Baristas',
      descripcion:
        'Matriz técnica que correlaciona perfiles de café (etíope floral, colombiano frutal, keniano cítrico) con miel cruda, crema de avellana, cacao y polen.',
      descripcion_en:
        'Technical matrix matching coffee roast profiles with raw forest honey, hazelnut cream, cacao, and pollen.',
      impacto_ventas: 'Facilita al barista recomendar el maridaje exacto, logrando un 42% de aceptación de upsell en taza.',
      impacto_ventas_en: 'Empowers baristas to recommend exact pairings, achieving 42% upsell acceptance per table.',
    },
    {
      id: 'tablilla-flight',
      nombre: 'Tablilla Flight de Degustación en Madera Nativa',
      nombre_en: 'Native Wood Table Tasting Flight Tray',
      material: 'Ulmo o roble chilote con encajes fresados y cuchara de madera',
      rol: 'Ritual de Servicio en Mesa',
      descripcion:
        'Bandeja individual con espacio para la taza de café o tetera y un frasquito de 25g de miel de autor.',
      descripcion_en:
        'Single-serving wooden board precision-carved for an espresso cup or teapot alongside a 25g honey jar.',
      impacto_ventas: 'Presentación fotogénica que eleva la percepción de valor y motiva publicaciones orgánicas de clientes en redes sociales.',
      impacto_ventas_en: 'Photogenic presentation that elevates perceived value and triggers organic social shares.',
    },
  ],
  kits: [
    {
      id: 'barra-esencial',
      nombre: 'Barra Esencial & Monodosis',
      badge: 'Iniciación y Barra',
      tier: 'entrada',
      tagline: 'El primer gesto de origen en la mesa de café',
      descripcion:
        'Orientado a cafeterías de especialidad que desean incorporar una pieza de mesa memorable para infusiones y bollería sin sobrecargar stock inicial.',
      precio_neto_clp: 89000,
      pvp_estimado_clp: 145000,
      margen_estimado_pct: 39,
      moq_summary: '48 frascos 25g + 6 frascos 150g',
      sales_strategy:
        'Incorpora el gesto de origen en la mesa añadiendo una monodosis de 25g en cada bandeja de café de especialidad con un recargo de +$1.500 CLP sobre la taza, logrando un retorno inmediato desde la primera semana.',
      componentes_fisicos: [
        {
          cantidad: '48 un.',
          item: 'Crema de Miel 25g (mesa)',
          detalle: '12 Cruda Floral, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Pureo',
        },
        {
          cantidad: '6 un.',
          item: 'Frascos 150g vitrina',
          detalle: 'Ediciones de venta directa para llevar a casa',
        },
      ],
      herramientas_servicio: [
        '1 Tótem de barra en roble chilote recuperado con grabado láser',
        '1 Rueda de maridaje sensorial café & miel en papel mineral',
      ],
      materiales_exhibicion: [
        'Tótem de mesa en roble chilote con QR grabado',
        'Ficha técnica de cata para baristas',
      ],
      integraciones_digitales: [
        {
          titulo: 'Trazabilidad por Lote (sale-qr)',
          descripcion: 'Certificado de pureza botánica y humedad <18% escaneable en mesa',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Ficha Barista Digital',
          descripcion: 'Guía de maridaje con cafés lavados, naturales y métodos filtrados',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Cafeterías boutique o barras de especialidad iniciando experiencia con miel nativa',
    },
    {
      id: 'experiencia-barista',
      nombre: 'Experiencia Barista & Maridaje',
      badge: 'Más Elegido · Recomendado',
      tier: 'medio',
      tagline: 'Integración completa entre barra, cocina y vitrina de venta',
      descripcion:
        'El mix equilibrado para dotar la barra de producto de servicio, repostería con miel cruda y vitrina de alta rotación para los clientes del café.',
      precio_neto_clp: 189000,
      pvp_estimado_clp: 310000,
      margen_estimado_pct: 40,
      moq_summary: '96 frascos 25g + 18 frascos 150g + 2 potes 500g',
      sales_strategy:
        'Triangula la experiencia entre servicio de mesa, uso en bebidas de barra y venta retail de vitrina. El exhibidor de mesón y las tablillas de servicio en roble chilote multiplican la compra por impulso de frascos para llevar.',
      componentes_fisicos: [
        {
          cantidad: '96 un.',
          item: 'Crema de Miel 25g (mesa)',
          detalle: '24 de c/u: Cruda, Avellana, Cacao, Polen',
        },
        {
          cantidad: '18 un.',
          item: 'Frascos 150g vitrina',
          detalle: 'Surtido completo para venta directa en barra',
        },
        {
          cantidad: '2 un.',
          item: 'Potes 500g uso barra',
          detalle: 'Miel cruda de bosque nativo para bebidas y obrador',
        },
      ],
      herramientas_servicio: [
        '1 Estante exhibidor de barra en roble chilote (capacidad 6 frascos)',
        '3 Tótems QR de mesa grabados en madera nativa',
        '6 Tablillas flight de servicio individual para taza y miel',
      ],
      materiales_exhibicion: [
        'Estante exhibidor de barra en roble chilote',
        '3 tótems QR de mesa grabados',
        'Set de 12 fichas de maridaje café & miel impresas',
      ],
      integraciones_digitales: [
        {
          titulo: 'QR de Reseñas Verificadas (@enjambre/resenas)',
          descripcion:
            'Los comensales califican su experiencia y dejan notas de maridaje visibles para nuevos clientes',
          tag: 'resenas',
        },
        {
          titulo: 'Sellos de Fidelización (fid_programas)',
          descripcion:
            'Tus clientes acumulan sellos por cada café con miel de autor servido en tu local',
          tag: 'fidelizacion',
        },
        {
          titulo: 'Pack de Contenidos Digitales',
          descripcion:
            'Fotografías en alta resolución y gráficas para cartas o redes del local',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Cafeterías con flujo constante que buscan diferenciar su propuesta gastronómica y fidelizar comensales',
    },
    {
      id: 'alianza-integral',
      nombre: 'Alianza Integral & Barra de Autor',
      badge: 'Escala & Alta Rotación',
      tier: 'avanzado',
      tagline: 'El estándar máximo de presencia y volumen preferente',
      descripcion:
        'Diseñado para cafeterías de alto volumen, tostadurías con salón o múltiples locales que buscan la máxima rentabilidad y soporte continuo.',
      precio_neto_clp: 349000,
      pvp_estimado_clp: 590000,
      margen_estimado_pct: 42,
      moq_summary: '192 frascos 25g + 36 frascos 150g + 6 potes 500g',
      sales_strategy:
        'Operación de máxima rotación: abastece la barra, vitrina de salida y carta de temporada. Incluye capacitación técnica para el equipo de baristas y acceso automático al tramo de descuento preferente en reposición.',
      componentes_fisicos: [
        {
          cantidad: '192 un.',
          item: 'Crema de Miel 25g monodosis',
          detalle: '48 de c/u: Cruda, Avellana, Cacao, Polen',
        },
        {
          cantidad: '36 un.',
          item: 'Frascos 150g de vitrina',
          detalle: 'Lotes numerados con sello de recolección de bosque',
        },
        {
          cantidad: '6 un.',
          item: 'Potes 500g barista/cocina',
          detalle: 'Para carta de bebidas de temporada y repostería interna',
        },
      ],
      herramientas_servicio: [
        '1 Exhibidor maestro de 2 niveles en madera noble chilota',
        '6 Tótems de mesa en roble chilote con QR interactivo',
        '12 Tablillas flight de servicio para taza y miel',
        '1 Rueda sensorial de maridaje café & miel en papel mineral',
      ],
      materiales_exhibicion: [
        'Exhibidor de sobremesa de 2 niveles en madera nativa',
        '6 tótems QR de mesa',
        'Muestrario de cata de barra',
        'Rueda sensorial de maridaje barista',
      ],
      integraciones_digitales: [
        {
          titulo: 'Reseñas Verificadas y Sello de Origen',
          descripcion:
            'Presencia prioritaria en el mapa digital de cafeterías aliadas',
          tag: 'resenas',
        },
        {
          titulo: 'Capacitación Virtual para Baristas',
          descripcion:
            'Sesión de 30 min con el equipo apícola para el staff de atención',
          tag: 'marketing',
        },
        {
          titulo: 'Reposición Prioritaria con Descuento Mayorista',
          descripcion:
            'Acceso automático al tramo de descuento preferente en @enjambre/pricing',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Tostadurías, cafeterías con alto tránsito y espacios gastronómicos consolidados',
    },
    {
      id: 'obrador-reposteria',
      nombre: 'Obrador & Creaciones Dulces',
      badge: 'Especialidad Culinaria',
      tier: 'especialidad',
      tagline: 'Abastecimiento noble para cocina, repostería y coctelería',
      descripcion:
        'Formatos a granel de miel cruda pura y cremas botánicas para elaboración de bollería, almíbares de autor y cocina de vanguardia.',
      precio_neto_clp: 165000,
      pvp_estimado_clp: 260000,
      margen_estimado_pct: 37,
      moq_summary: '12 potes 500g + 1 balde 5kg miel cruda',
      sales_strategy:
        'Diferenciación gastronómica directa: reemplaza azúcares refinados y mieles industriales por miel cruda pura certificada (<18% humedad) en almíbares, fermentos y bollería de autor con certificación oficial.',
      componentes_fisicos: [
        {
          cantidad: '12 un.',
          item: 'Potes 500g Miel Cruda de Bosque',
          detalle: 'Pureza botánica garantizada sin pasteurizar',
        },
        {
          cantidad: '1 un.',
          item: 'Balde 5kg Miel Cruda a Granel',
          detalle: 'Envase grado alimentario con precinto de seguridad',
        },
        {
          cantidad: '1 un.',
          item: 'Certificado de análisis físico-químico',
          detalle: 'Humedad <18% y trazabilidad botánica por lote',
        },
      ],
      herramientas_servicio: [
        '1 Certificado de pureza botánica enmarcado en madera nativa para cocina u obrador',
        '1 Ficha técnica de densidades y temperaturas óptimas para emulsiones',
      ],
      materiales_exhibicion: [
        'Certificado de origen enmarcable para la cocina u obrador',
      ],
      integraciones_digitales: [
        {
          titulo: 'Ficha Técnica de Inocuidad y Laboratorio',
          descripcion:
            'Respaldo sanitario oficial y parámetros Codex para manipulación culinaria',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Contrato de Suministro Continuo',
          descripcion:
            'Garantía de precio congelado por temporada de recolección',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Talleres de panadería de masa madre, reposterías finas y cocinas de autor',
    },
  ],
  value_props: [
    {
      icon: 'Package',
      title: 'Crema de Miel Cruda',
      description:
        'Floral, delicada y profunda; hecha para abrirse junto a una taza y dejar que el bosque hable primero. Ideal para: té negro, infusiones florales, mantequilla, croissants y tostadas.',
    },
    {
      icon: 'Coffee',
      title: 'Crema de Miel + Avellana',
      description:
        'Miel cruda de Chiloé y avellana chilena tostada. Dulzor floral y calidez terrosa. No es una crema dulce convencional. Ideal para: capuccino, chai, bollería de mantequilla, tostadas y yogurt.',
    },
    {
      icon: 'Droplets',
      title: 'Crema de Miel + Cacao',
      description:
        'Miel cruda de bosque nativo y nibs de cacao molidos de Santander. Una crema de profundidad limpia, sin azúcar añadida. Ideal para: espresso, mocaccino, café filtrado, pan brioche.',
    },
    {
      icon: 'Flower',
      title: 'Crema de Miel + Polen',
      description:
        'La suavidad cremosa encuentra pequeños granos dorados de la colmena de Pureo: una textura viva, floral y terrosa. Ideal para: té verde, infusiones herbales, yogurt, granola.',
    },
  ],
  stats: [
    { value: '25 g', label: 'Pieza de mesa' },
    { value: '150 g', label: 'Reserva para llevar' },
    { value: '500 g', label: 'Uso interno de barra' },
    { value: '<18%', label: 'Humedad controlada por lote' },
  ],
  process: [
    {
      step: '01',
      title: '25 g — Pieza de mesa',
      desc: 'Para una infusión, croissant o regalo de salida. El cliente lo abre en el local; el frasco mantiene valor visual y puede llevarse.',
    },
    {
      step: '02',
      title: '150 g — Reserva para llevar',
      desc: 'Para vender desde la barra. Es la continuidad doméstica de una experiencia que comenzó con una taza.',
    },
    {
      step: '03',
      title: '500 g — Uso interno de barra',
      desc: 'Cocina, repostería y degustación del staff para que conozcan la base del producto y recomienden cada creación con propiedad.',
    },
  ],
  faq: [
    {
      question: 'Ingredientes y Alérgenos',
      answer:
        "Las preparaciones se formulan y etiquetan bajo el Reglamento Sanitario (ej: 'Crema de miel cruda de bosque nativo, avellana chilena tostada y molida'). Las variantes Avellana y Polen contienen alérgenos. La variante Cacao puede contener trazas. No son aptas para menores de 12 meses.",
    },
    {
      question: 'Vida útil y Almacenamiento',
      answer:
        'A diferencia de una miel genérica, cada crema tiene una condición de almacenamiento y fecha de vencimiento validada por su estabilidad física, previniendo alteraciones por humedad y oxidación de sus adiciones naturales.',
    },
    {
      question: 'Mix recomendado y trazabilidad',
      answer:
        'Una barra no necesita más productos, necesita mejores gestos. Definimos contigo el mix, la frecuencia de abastecimiento y la trazabilidad por lote respaldada en los análisis físico-químicos y botánicos de nuestra sección de ciencia.',
    },
  ],
  code_modules: [
    {
      id: 'modulo-sale-qr',
      package_name: '@enjambre/sale-qr',
      titulo: 'Pasaporte Digital de Lote & QR de Mesa',
      titulo_en: 'Batch Digital Passport & Table QR',
      descripcion:
        'Genera códigos QR dinámicos para los tótems de roble chilote. Los comensales escanean desde la mesa para descubrir el mapa de origen botánico, fecha de recolección y análisis de pureza de la miel que acompaña su café.',
      descripcion_en:
        'Generates dynamic batch QR codes for native oak table totems. Patrons scan from their table to explore botanical origin maps, collection dates, and laboratory purity metrics.',
      badge: 'Trazabilidad Dinámica',
      beneficio_comercial:
        'Eleva la percepción de lujo en la mesa, justificando un recargo de +$1.500 CLP por taza servida y convirtiendo comensales en compradores de frascos para llevar.',
      beneficio_comercial_en:
        'Elevates table luxury perception, justifying a +$1,500 CLP premium per served cup and converting patrons into takeaway retail jar buyers.',
    },
    {
      id: 'modulo-resenas',
      package_name: '@enjambre/resenas',
      titulo: 'Motor de Reseñas Verificadas de Cata',
      titulo_en: 'Verified Tasting Review Engine',
      descripcion:
        'Sistema de calificación sensorial en escala chilena 1–7 que captura notas de maridaje de tus baristas y comensales en tiempo real, publicándolas de forma transparente.',
      descripcion_en:
        'Sensory evaluation engine on the Chilean 1–7 scale capturing real-time coffee-and-honey pairing notes from your baristas and guests.',
      badge: 'Prueba Social',
      beneficio_comercial:
        'Genera validación social inmediata en barra y posiciona a tu cafetería como referente en maridaje de café de especialidad.',
      beneficio_comercial_en:
        'Builds immediate social proof at the counter, positioning your coffee shop as a premier specialty pairing destination.',
    },
    {
      id: 'modulo-wallet',
      package_name: '@enjambre/wallet',
      titulo: 'Pase Digital Apple & Google Wallet con Retorno de Frascos',
      titulo_en: 'Apple & Google Digital Wallet Pass with Jar Return',
      descripcion:
        'Permite a tus clientes guardar su tarjeta de membresía en su smartphone sin descargar aplicaciones. Acumulan sellos por cada café con miel y reciben abonos por devolver frascos de vidrio vacíos.',
      descripcion_en:
        'Enables customers to save their membership pass on smartphones with zero app downloads. They collect stamps per coffee and receive credits for returning empty glass jars.',
      badge: 'Fidelización & Circularidad',
      beneficio_comercial:
        'Multiplica la retención de clientes recurrentes e impulsa un ciclo de reciclaje noble con incentivo de consumo en tu local.',
      beneficio_comercial_en:
        'Drives repeat patron retention while fueling a circular packaging loop that incentivizes spending in your store.',
    },
    {
      id: 'modulo-ciencia',
      package_name: '@enjambre/ciencia',
      titulo: 'Dossier Técnico & Triangulación de Laboratorio',
      titulo_en: 'Technical Laboratory Dossier & Calibration',
      descripcion:
        'Acceso directo a análisis físico-químicos (humedad <18%, índice HMF, espectro polínico NCh2981) para calibrar recetas de autor, extracción espresso y emulsionado en frío.',
      descripcion_en:
        'Direct access to physico-chemical analyses (moisture <18%, HMF index, pollen profile) to calibrate signature recipes, espresso extractions, and cold churning.',
      badge: 'Estándar Científico',
      beneficio_comercial:
        'Garantiza estabilidad técnica en cocina y barra sin fermentación ni azúcares adulterados, asegurando consistencia en cada taza.',
      beneficio_comercial_en:
        'Guarantees technical kitchen and bar stability with zero fermentation or adulterated sugars, ensuring consistency in every cup.',
    },
  ],
  seo_title: 'Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano',
  seo_description:
    'Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen.',
};

export const DEFAULT_B2B_HOTELES: B2BSegmentContentSettings = {
  slug: 'hoteles',
  tipo: 'hotel',
  kicker: 'Para Hoteles',
  kicker_en: 'For Hotels & Amenities',
  headline: 'Amenities que cuentan la historia del bosque',
  headline_en: 'Amenities that narrate the forest heritage',
  subheadline:
    'Mini frascos de 25g con tapa dorada como amenity premium. Un detalle inolvidable que diferencia la experiencia de hospedaje en tu hotel.',
  subheadline_en:
    '25g jars with golden lids as a luxury amenity. An unforgettable detail elevating your hospitality guest experience.',
  hero_image: '/images/b2b/hero-hoteles.jpg',
  suggested_products_copy:
    'El formato ideal como amenity es el frasco de 25g con tapa dorada. También proveemos frascos de gran formato para cocinas o buffets.',
  cta_text: 'Solicitar cotización',
  cta_text_en: 'Request quote',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Hospitalidad: Estación Noble & Souvenir de Checkout',
    titulo_en: 'Hospitality Strategy: Noble Buffet Station & Checkout Souvenir',
    bajada:
      'Elimina los envases plásticos desechables y transforma el desayuno y las habitaciones en un embajador silencioso de venta de regalos de alto valor.',
    bajada_en:
      'Eliminate single-use plastic cups and turn breakfast and guest rooms into a silent ambassador for high-margin souvenir sales.',
    aumento_ticket: '22% de huéspedes adquieren caja de 3 frascos al checkout ($24.990 PVP)',
    aumento_ticket_en: '22% of guests purchase a 3-jar souvenir box at checkout ($24,990 CLP retail)',
    mecanica_ventas: [
      'Buffet sin plástico: La estación noble de vidrio soplado y roble nativo reemplaza mermeladas y sobres plásticos por un punto focal estético.',
      'Amenity de bienvenida: El mini frasco de 25g con tarjeta bilingüe espera al huésped en su habitación como gesto de hospitalidad auténtica.',
      'Cata interactiva en habitación: El huésped escanea el QR bilingüe para explorar el bosque nativo y calificar las notas aromáticas.',
      'Venta en recepción/lobby: Durante el checkout, la boutique de recepción ofrece el set de regalo conmemorativo de 3 frascos con margen hotelero del 45%.',
    ],
    herramienta_clave: 'Dispensador Noble de Buffet en Vidrio y Roble Nativo',
    herramienta_clave_en: 'Noble Buffet Glass & Native Oak Dispenser',
  },
  tools: [
    {
      id: 'dispensador-buffet',
      nombre: 'Dispensador Noble de Buffet en Vidrio y Roble',
      nombre_en: 'Noble Buffet Glass & Native Oak Dispenser',
      material: 'Vidrio soplado artesanal, grifo dosificador de bronce y base de roble chilote',
      rol: 'Estación Central de Desayuno',
      descripcion:
        'Depósito higiénico de servicio continuo que dosifica miel fluida sin goteos ni contacto manual.',
      descripcion_en:
        'Hygienic continuous-service dispenser that cleanly pours fluid honey without dripping or manual touch.',
      impacto_ventas: 'Reduce mermas de servicio en un 30% y eleva la calificación de satisfacción de desayuno en encuestas de huéspedes.',
      impacto_ventas_en: 'Cuts service waste by 30% and elevates breakfast satisfaction ratings in guest surveys.',
    },
    {
      id: 'tarjetero-habitacion',
      nombre: 'Set de Tótems Bilingües de Habitación',
      nombre_en: 'Bilingual Guest Room Totem Set',
      material: 'Roble y papel mineral satinado (ES/EN)',
      rol: 'Amenity & Relato en Mesa de Noche',
      descripcion:
        'Soporte discreto para habitación con tarjeta que narra la recolección estacional y enlaza al pasaporte digital.',
      descripcion_en:
        'Understated bedside wooden stand carrying cards narrating seasonal collection with digital passports.',
      impacto_ventas: 'Convierte el 22% de estancias en ventas de souvenirs en el mostrador del lobby.',
      impacto_ventas_en: 'Converts 22% of guest stays into lobby souvenir sales upon checkout.',
    },
    {
      id: 'estuche-tepa',
      nombre: 'Estuches de Madera de Tepa para 3 Frascos',
      nombre_en: 'Native Tepa Wood 3-Jar Souvenir Gift Boxes',
      material: 'Madera de tepa chilota con tapa deslizante pirograbada',
      rol: 'Caja de Souvenir de Lujo en Recepción',
      descripcion:
        'Estuche de regalo para tres frascos de 150g o minidosis, listo para viaje con protección anti-impacto.',
      descripcion_en:
        'Gift case holding three 150g jars or tasting minis, travel-ready with protective timber cushioning.',
      impacto_ventas: 'Aumenta el ticket de venta en el lobby hotelero en $24.990 CLP por huésped.',
      impacto_ventas_en: 'Generates an incremental $24,990 CLP per guest transaction at the lobby boutique.',
    },
  ],
  kits: [
    {
      id: 'bienvenida-boutique',
      nombre: 'Kit Bienvenida Boutique',
      badge: 'Hospitalidad & Amenities',
      tier: 'entrada',
      tagline: 'Amenities de 25g que elevan la bienvenida del huésped',
      descripcion:
        'Mini frascos de crema de miel cruda con tapa dorada y tarjeta de bienvenida que introduce al huésped en el bosque chilote.',
      precio_neto_clp: 99000,
      pvp_estimado_clp: 165000,
      margen_estimado_pct: 40,
      moq_summary: '72 frascos 25g + 72 tarjetas',
      sales_strategy:
        'Entrega un amenity memorable en habitación con tarjeta QR que induce al huésped a solicitar el set de regalo en recepción antes de su salida.',
      componentes_fisicos: [
        {
          cantidad: '72 un.',
          item: 'Mini frascos 25g cortesía',
          detalle: 'Tapa dorada y sello de garantía botánica',
        },
        {
          cantidad: '72 un.',
          item: 'Tarjetas de bienvenida con relato de bosque',
          detalle: 'Papel mineral impreso con QR de cata guiada',
        },
      ],
      herramientas_servicio: [
        '1 Tótem de bienvenida bilingüe en madera nativa para recepción',
        '72 Tarjetas de habitación en papel mineral',
      ],
      materiales_exhibicion: [
        'Tarjetas de bienvenida para habitaciones',
        'Tótem de recepción',
      ],
      integraciones_digitales: [
        {
          titulo: 'Experiencia Sensorial Digital',
          descripcion:
            'El huésped escanea el QR del frasco y realiza una cata guiada desde su teléfono',
          tag: 'trazabilidad',
        },
      ],
      recomendado_para:
        'Lodges boutique, hoteles de autor y bed & breakfast premium',
    },
    {
      id: 'desayuno-buffet',
      nombre: 'Kit Desayuno & Buffet Austral',
      badge: 'Más Elegido · Servicio Continuo',
      tier: 'medio',
      tagline: 'Estación noble de miel cruda fluida para el salón de desayuno',
      descripcion:
        'Elimina los envases plásticos individuales. Presenta miel cruda fluida en dispensadores nobles de vidrio y madera nativa con reposición continua.',
      precio_neto_clp: 219000,
      pvp_estimado_clp: 365000,
      margen_estimado_pct: 40,
      moq_summary: '12 potes 500g + 36 frasquitos 25g + 1 dispensador noble',
      sales_strategy:
        'Estación noble de servicio para el salón de desayuno. Elimina mermas y envases individuales de plástico, proyectando calidad hotelera superior.',
      componentes_fisicos: [
        {
          cantidad: '12 un.',
          item: 'Potes 500g Miel Cruda de Bosque',
          detalle: 'Para recarga continua de dispensadores',
        },
        {
          cantidad: '36 un.',
          item: 'Mini frascos 25g cortesía',
          detalle: 'Para atención VIP o room service',
        },
      ],
      herramientas_servicio: [
        '1 Dispensador noble de buffet en vidrio y base de roble chilote',
        '3 Tótems explicativos bilingües de mesa (ES/EN)',
        '1 Cuchara vertedora en madera nativa',
      ],
      materiales_exhibicion: [
        'Dispensador de vidrio y roble nativo para mesa buffet',
        'Tótems de mesa bilingües',
      ],
      integraciones_digitales: [
        {
          titulo: 'Pasaporte de Origen Forestal',
          descripcion:
            'QR en estación de buffet con mapa botánico de los predios protegidos',
          tag: 'trazabilidad',
        },
      ],
      recomendado_para:
        'Hoteles con servicio de desayuno buffet, salones de té y resorts',
    },
    {
      id: 'gran-hospitalidad',
      nombre: 'Gran Hospitalidad & Boutique del Lobby',
      badge: 'Experiencia Completa & Lobby',
      tier: 'avanzado',
      tagline: 'La solución integral de amenities, buffet y venta en lobby',
      descripcion:
        'Cubre el ciclo completo del huésped: amenity de llegada, estación de desayuno austral y exhibidor de frascos para venta de souvenirs en recepción.',
      precio_neto_clp: 385000,
      pvp_estimado_clp: 650000,
      margen_estimado_pct: 42,
      moq_summary: '144 frascos 25g + 24 frascos 150g + 6 potes 500g',
      sales_strategy:
        'La solución total para el hotel: cubre habitaciones (amenities), buffet central y la boutique del lobby para capturar ventas de souvenirs de alto margen.',
      componentes_fisicos: [
        {
          cantidad: '144 un.',
          item: 'Mini frascos 25g de cortesía',
          detalle: 'Para turndown service y bienvenida',
        },
        {
          cantidad: '24 un.',
          item: 'Frascos 150g vitrina lobby',
          detalle: 'Ediciones numeradas con empaque para regalo',
        },
        {
          cantidad: '6 un.',
          item: 'Potes 500g cocina/buffet',
          detalle: 'Para estación de desayuno y bar',
        },
      ],
      herramientas_servicio: [
        '1 Dispensador noble de buffet en vidrio y roble',
        '1 Exhibidor de lobby en madera nativa para 12 frascos',
        '6 Tótems bilingües de habitación en roble chilote',
        '6 Estuches de madera de tepa para 3 frascos',
      ],
      materiales_exhibicion: [
        'Exhibidor de madera nativa para recepción',
        'Dispensador noble de buffet',
        'Tótems bilingües de mesa',
      ],
      integraciones_digitales: [
        {
          titulo: 'Co-Branding Digital & Reseñas',
          descripcion:
            'Insignia compartida en la experiencia móvil y reseñas de huéspedes',
          tag: 'marketing',
        },
        {
          titulo: 'Despacho Programado Continuo',
          descripcion:
            'Garantía de stock reservado anual según ocupación hotelera',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Hoteles 4 y 5 estrellas, lodges de lujo y complejos turísticos con boutique',
    },
    {
      id: 'spa-ritual',
      nombre: 'Kit Spa & Ritual Austral',
      badge: 'Cabina & Bienestar',
      tier: 'especialidad',
      tagline: 'Miel cruda pura y polen vivo para cabinas de masaje y spa',
      descripcion:
        'Protocolo de bienestar autóctono: formulado para envolturas corporales, tratamientos faciales y degustación post-sesión de relajación.',
      precio_neto_clp: 145000,
      pvp_estimado_clp: 240000,
      margen_estimado_pct: 40,
      moq_summary: '8 potes 500g + 4 potes polen de Pureo',
      sales_strategy:
        'Incorpora miel cruda pura y polen vivo en protocolos de spa, masajes australes y faciales regenerativos, permitiendo cobrar un plus por tratamiento autóctono de Chiloé.',
      componentes_fisicos: [
        {
          cantidad: '8 un.',
          item: 'Potes 500g Miel Cruda Pura',
          detalle: 'Grado cosmético y alimentario para cabina',
        },
        {
          cantidad: '4 un.',
          item: 'Potes Polen de Pureo',
          detalle: 'Granos dorados ricos en antioxidantes',
        },
      ],
      herramientas_servicio: [
        '1 Cuenco de mezcla en madera nativa tratada',
        '2 Pinceles de cerdas suaves para aplicación en cabina',
        '1 Protocolo de aplicación spa impreso',
      ],
      materiales_exhibicion: [
        'Ficha de tratamiento austral para recepción de spa',
      ],
      integraciones_digitales: [
        {
          titulo: 'Protocolo de Bienestar Austral',
          descripcion:
            'Guía técnica de preparación de emulsiones y mascarillas frescas',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Spas de destino, cabinas de masaje y centros holísticos de hotelería',
    },
  ],
  value_props: [
    {
      icon: 'Hotel',
      title: 'Amenity de lujo',
      description:
        'Pequeños frascos de 25g con tapa dorada que elevan la percepción del desayuno, el room service o el welcome pack.',
    },
    {
      icon: 'Palette',
      title: 'Marca conjunta (Co-branding Opcional)',
      description:
        'Como upgrade premium, integramos la insignia de tu hotel en la etiqueta dedicada. El huésped se lleva un recuerdo donde tu marca y el bosque son uno solo.',
    },
    {
      icon: 'BarChart3',
      title: 'Experiencia Sensorial Digital',
      description:
        'Tus huéspedes pueden escanear un QR incluido en el amenity y registrar su percepción (aroma, sabor, notas de bosque) en nuestra plataforma, llevándose una experiencia inmersiva.',
    },
    {
      icon: 'Leaf',
      title: 'Compromiso territorial demostrable',
      description:
        'Tu compra apoya un proyecto real de restauración en Chiloé. Mantenemos el censo georreferenciado de árboles nativos y apiarios en expansión continua.',
    },
  ],
  stats: [
    { value: '25 g', label: 'Amenity de origen' },
    { value: 'Nativo', label: 'Origen botánico de Chiloé (NCh2981)' },
    { value: 'Planificado', label: 'Suministro anual reservado' },
    { value: '1 QR', label: 'Cata sensorial guiada' },
  ],
  process: [
    {
      step: '01',
      title: 'Evaluación',
      desc: 'Definimos el volumen mensual ideal para tus operaciones de desayuno o welcome packs.',
    },
    {
      step: '02',
      title: 'Personalización (Opcional)',
      desc: 'Opcionalmente añadimos el logo de tu hotel al diseño de los mini frascos.',
    },
    {
      step: '03',
      title: 'Preservación conjunta',
      desc: 'Despachos recurrentes con suministro planificado. Tu hotel se convierte en un aliado clave sosteniendo el censo forestal y la apicultura viva en Chiloé.',
    },
  ],
  faq: [
    {
      question: '¿Es posible personalizar los frascos de 25g con nuestra marca?',
      answer:
        'Sí, ofrecemos co-branding como un servicio opcional de plusvalía. Integramos tu logo en un área dedicada de nuestra etiqueta para mantener ambas identidades en armonía.',
    },
    {
      question: '¿Qué es la Experiencia Sensorial Digital?',
      answer:
        'El huésped escanea un código y entra a una interfaz móvil donde registra su percepción de cata (textura, notas, etc.). Convierte el simple acto de desayunar en una experiencia turística y de conexión con el origen.',
    },
    {
      question: '¿Tienen reportes de impacto ambiental o trazabilidad forestal?',
      answer:
        'Nuestra trazabilidad forestal avanza progresivamente mediante el censo georreferenciado de ejemplares nativos en Predio Pureo y sectores asociados. Compartimos esta evidencia metodológica con nuestros aliados institucionales.',
    },
  ],
  code_modules: [
    {
      id: 'modulo-hotel-wallet',
      package_name: '@enjambre/wallet',
      titulo: 'Pase Digital de Huésped & Llave de Beneficios',
      titulo_en: 'Guest Digital Pass & Hospitality Perks',
      descripcion:
        'Tarjeta para Apple Wallet y Google Wallet que el huésped activa al escanear el amenity de su habitación. Desbloquea la historia de la recolección estacional, cata guiada y descuento exclusivo en la boutique del lobby.',
      descripcion_en:
        'Digital pass for Apple Wallet and Google Wallet activated from the guest room amenity. Unlocks seasonal collection storytelling, guided tastings, and boutique discounts.',
      badge: 'Hospitality Mobile',
      beneficio_comercial:
        'Convierte la cortesía de habitación en una venta de souvenir en recepción antes del checkout, con margen hotelero del 45%.',
      beneficio_comercial_en:
        'Converts bedside room amenities into high-margin souvenir checkout sales at the front desk (45% hotel margin).',
    },
    {
      id: 'modulo-impacto',
      package_name: '@enjambre/impacto',
      titulo: 'Certificados de Conservación Territorial & Reporte ESG',
      titulo_en: 'Territorial Conservation Certificates & ESG Reporting',
      descripcion:
        'Módulo auditable que calcula y certifica los metros cuadrados de bosque nativo de Chiloé preservados y árboles censados gracias a los amenities y consumos de tu hotel.',
      descripcion_en:
        'Auditable reporting module computing and certifying the square meters of Chiloé native forest protected and geo-tagged trees preserved through your hotel purchases.',
      badge: 'Métricas ESG Auditables',
      beneficio_comercial:
        'Entrega a tu cadena hotelera reportes oficiales de sostenibilidad y conservación para memorias anuales y certificaciones ambientales.',
      beneficio_comercial_en:
        'Provides official sustainability and conservation metrics for corporate annual reports and environmental hospitality badges.',
    },
    {
      id: 'modulo-hotel-qr',
      package_name: '@enjambre/sale-qr',
      titulo: 'Tótems de Buffet Bilingües & Pasaporte Botánico',
      titulo_en: 'Bilingual Buffet Totems & Botanical Passport',
      descripcion:
        'Códigos QR de alta resolución con detección automática de idioma (español/inglés) para la estación de desayuno, mostrando a turistas internacionales el origen de cada gota.',
      descripcion_en:
        'High-resolution QR codes with automatic language detection (Spanish/English) for breakfast buffet stations, showing international travelers the forest source.',
      badge: 'Experiencia Bilingüe',
      beneficio_comercial:
        'Elimina los plásticos de un solo uso en el buffet y posiciona el desayuno del hotel como una experiencia gastronómica de nivel mundial.',
      beneficio_comercial_en:
        'Eliminates single-use plastics from the buffet line and elevates hotel breakfast into a world-class gastronomic experience.',
    },
    {
      id: 'modulo-fiscal',
      package_name: '@enjambre/fiscal',
      titulo: 'Facturación Electrónica DTE Automatizada con RUT Empresa',
      titulo_en: 'Automated Electronic DTE Invoicing with Corporate Tax ID',
      descripcion:
        'Integración contable de emisión directa de facturas exentas y afectas a IVA 19%, órdenes de compra corporativas y despacho programado continuo.',
      descripcion_en:
        'Direct accounting integration issuing electronic tax invoices with Chilean 19% VAT, corporate purchase orders, and scheduled replenishment.',
      badge: 'Operación Corporativa',
      beneficio_comercial:
        'Simplifica los procesos de compras y finanzas del hotel con conciliación bancaria instantánea y despacho prioritario sin demoras.',
      beneficio_comercial_en:
        'Streamlines procurement and hotel accounting with instant bank reconciliation and uninterrupted priority supply.',
    },
  ],
  seo_title: 'Amenities de Miel para Hoteles · La Obrera y el Zángano',
  seo_description:
    'Mini frascos de 25g de miel cruda como amenity premium para hoteles. Catas digitales, co-branding opcional y protección activa del bosque nativo.',
};

export const DEFAULT_B2B_TIENDAS_GOURMET: B2BSegmentContentSettings = {
  slug: 'tiendas-gourmet',
  tipo: 'tienda_gourmet',
  kicker: 'Para Tiendas Gourmet',
  kicker_en: 'For Gourmet Stores',
  headline: 'El frasco que tus clientes buscan',
  headline_en: 'The jar your customers are searching for',
  subheadline:
    'Miel cruda de bosque nativo con un ecosistema completo para retail: trazabilidad desde la colmena, fondos de co-marketing y lealtad digital encadenada.',
  subheadline_en:
    'Raw native honey with a full retail ecosystem: hive-to-table traceability, co-op marketing and digital customer loyalty.',
  hero_image: '/images/b2b/hero-tiendas-gourmet.jpg',
  suggested_products_copy:
    'Para retail gourmet recomendamos el espectro completo: mini frascos de 25g para compra de impulso/regalos, y los formatos de 150g y 500g para los entusiastas de la gastronomía.',
  cta_text: 'Solicitar catálogo',
  cta_text_en: 'Request catalog',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Rotación Acelerada & Maridaje Cruzado',
    titulo_en: 'Rapid Turnover & Cross-Merchandising Strategy',
    bajada:
      'Ubica la miel junto a quesos maduros y charcutería fina. Una sola gota de degustación en el mostrador convierte al 80% de los visitantes en compradores.',
    bajada_en:
      'Position honey beside aged cheeses and fine charcuterie. A single sample at the counter converts 80% of browsing visitors into buyers.',
    aumento_ticket: '+$8.500 CLP por ticket promedio mediante venta cruzada gourmet',
    aumento_ticket_en: '+$8,500 CLP average basket increase via gourmet cross-merchandising',
    mecanica_ventas: [
      'Cata activa de mesón: El expositor de degustación permite al cliente probar una gota en paleta compostable sin esperar al dependiente.',
      'Cross-merchandising: Fichas de maridaje que sugieren combinar Miel Cruda con queso azul o de cabra, y Crema con Avellana sobre pan de masa madre.',
      'Escala de formatos: Mini frascos de 25g junto a la caja para impulso rápido ($2.500 CLP) y frascos de 150g/500g en góndola principal.',
      'Cajas de regalo festivas: Empaques en madera de tepa preparados que elevan el ticket en fechas clave y regalos corporativos.',
    ],
    herramienta_clave: 'Exhibidor Escalonado de Mostrador & Muestrario de Degustación',
    herramienta_clave_en: 'Tiered Counter Stand & Active Tasting Bar',
  },
  tools: [
    {
      id: 'exhibidor-escalonado',
      nombre: 'Exhibidor Escalonado de Mostrador en Roble',
      nombre_en: 'Tiered Native Oak Counter Stand',
      material: 'Roble chilote con dos niveles y ranura para fichas botánicas',
      rol: 'Punto Focal de Mesón y Vitrina',
      descripcion:
        'Diseñado para destacar 12 frascos de frente con visibilidad 360 y sello de trazabilidad de lote.',
      descripcion_en:
        'Crafted to feature 12 facing jars with 360 visibility and batch provenance seal.',
      impacto_ventas: 'Triplica la velocidad de rotación visual frente a productos colocados en estantería plana.',
      impacto_ventas_en: 'Triples visual sell-through rate compared to flat shelf product placements.',
    },
    {
      id: 'muestrario-degustacion',
      nombre: 'Estación de Degustación Activa con Paletas Biodegradables',
      nombre_en: 'Active Tasting Bar with Compostable Sticks',
      material: 'Madera nativa, frasquito de cata y depósito para descarte limpio',
      rol: 'Activador de Prueba y Conversión',
      descripcion:
        'Permite a los comensales probar la textura viva de la miel sin contaminar el frasco ni generar desorden.',
      descripcion_en:
        'Allows shoppers to sample living raw honey texture cleanly without contamination or counter mess.',
      impacto_ventas: 'El 80% de los clientes que degustan una gota completan la compra de un frasco.',
      impacto_ventas_en: '80% of customers sampling a droplet complete a jar purchase.',
    },
    {
      id: 'cajas-regalo-tepa',
      nombre: 'Cajas de Madera de Tepa Numeradas para Regalo',
      nombre_en: 'Numbered Tepa Wood Gift Boxes',
      material: 'Tepa de Chiloé con sello lacrado y tarjeta de origen',
      rol: 'Empaque de Regalo Gourmet de Alto Ticket',
      descripcion:
        'Presentación de 2 o 3 frascos lista para regalar, con ventana para observar la cristalización noble.',
      descripcion_en:
        'Two or three-jar presentation ready for gift giving, showing raw noble crystallization.',
      impacto_ventas: 'Aumenta el ticket promedio navideño y corporativo a más de $32.000 CLP por compra.',
      impacto_ventas_en: 'Lifts average holiday and corporate order basket above $32,000 CLP.',
    },
  ],
  kits: [
    {
      id: 'vitrina-autor',
      nombre: 'Kit Vitrina de Autor & Degustación',
      badge: 'Iniciación Retail',
      tier: 'entrada',
      tagline: 'El set indispensable para probar rotación en tu mostrador',
      descripcion:
        '24 frascos de 150g en las variedades más aclamadas, acompañado de un tótem QR con reseñas verificadas para mesón de caja.',
      precio_neto_clp: 75000,
      pvp_estimado_clp: 125000,
      margen_estimado_pct: 40,
      moq_summary: '24 frascos 150g surtidos',
      sales_strategy:
        'Coloca los 24 frascos en el mostrador junto a la estación de degustación para convertir compras de impulso con margen del 40%.',
      componentes_fisicos: [
        {
          cantidad: '24 un.',
          item: 'Frascos 150g surtidos',
          detalle: '8 Miel Cruda Floral, 8 Crema con Avellana, 8 Crema con Cacao',
        },
      ],
      herramientas_servicio: [
        '1 Muestrario de cata de mesón en madera nativa',
        '1 Tótem QR de reseñas y notas botánicas',
      ],
      materiales_exhibicion: [
        'Estante de sobremesa de 1 nivel en madera nativa',
        '1 Tótem QR con reseñas verificadas',
      ],
      integraciones_digitales: [
        {
          titulo: 'QR de Reseñas en Vivo',
          descripcion:
            'Tus clientes leen calificaciones reales de otros comensales antes de comprar',
          tag: 'resenas',
        },
      ],
      recomendado_para:
        'Emporios boutique, panaderías de masa madre y tiendas de quesos artesanales',
    },
    {
      id: 'emporio-selecto',
      nombre: 'Kit Emporio Selecto & Alta Rotación',
      badge: 'Más Elegido · Alta Rotación',
      tier: 'medio',
      tagline: 'El mix completo de formatos pequeños, medianos y de reserva',
      descripcion:
        'Combina frascos de 150g para consumo personal y 500g Reserva del Bosque, junto a un exhibidor de 2 niveles en madera de roble chilote.',
      precio_neto_clp: 195000,
      pvp_estimado_clp: 330000,
      margen_estimado_pct: 41,
      moq_summary: '48 frascos 150g + 12 frascos 500g',
      sales_strategy:
        'La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina, generando recompra recurrente cada 3 semanas.',
      componentes_fisicos: [
        {
          cantidad: '48 un.',
          item: 'Frascos 150g vitrina',
          detalle: '16 Miel Cruda, 16 Avellana, 8 Cacao, 8 Polen',
        },
        {
          cantidad: '12 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Miel cruda de bosque nativo con sello de recolección',
        },
      ],
      herramientas_servicio: [
        '1 Exhibidor escalonado de 2 niveles en roble chilote',
        '1 Estación de degustación activa con paletas biodegradables',
        '2 Tótems de mesón con QR de trazabilidad',
      ],
      materiales_exhibicion: [
        'Exhibidor de sobremesa de 2 niveles en madera nativa',
        'Material POP impreso para góndola',
        '2 tótems QR de mesón',
      ],
      integraciones_digitales: [
        {
          titulo: 'Sello de Fidelización de Tienda',
          descripcion:
            'Los clientes acumulan puntos por escanear en tu local y vuelven a recomprar',
          tag: 'fidelizacion',
        },
        {
          titulo: 'Pack de Marketing y Redes',
          descripcion:
            'Fotografías en alta resolución para que publiques en las redes de tu tienda',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Tiendas gourmet consolidadas, fiambrerías finas y tiendas de vinos y quesos',
    },
    {
      id: 'coleccion-maestra',
      nombre: 'Colección Maestra & Cajas de Regalo',
      badge: 'Escala & Cajas de Madera',
      tier: 'avanzado',
      tagline: 'Volumen preferente con cajas de madera para regalo gourmet',
      descripcion:
        'La solución para tiendas de gran volumen que buscan cajas de madera artesanales para regalos corporativos y packs navideños de alto ticket.',
      precio_neto_clp: 420000,
      pvp_estimado_clp: 720000,
      margen_estimado_pct: 42,
      moq_summary: '96 frascos 150g + 24 frascos 500g + 18 cajas de regalo',
      sales_strategy:
        'Las 18 cajas de madera de tepa preparadas elevan el ticket promedio en fechas festivas a más de $32.000 CLP, manteniendo un margen protegido superior al 42%.',
      componentes_fisicos: [
        {
          cantidad: '96 un.',
          item: 'Frascos 150g surtidos',
          detalle: 'Colección completa de 4 variedades',
        },
        {
          cantidad: '24 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Miel cruda con numeración de lote',
        },
        {
          cantidad: '18 un.',
          item: 'Cajas de regalo en madera de tepa',
          detalle: 'Empaque de lujo con visor para 2 o 3 frascos',
        },
      ],
      herramientas_servicio: [
        '1 Exhibidor de pie en madera nativa de Chiloé',
        '18 Cajas de regalo de madera numeradas',
        '1 Estación de cata de mesón',
      ],
      materiales_exhibicion: [
        'Exhibidor de pie en madera nativa de Chiloé',
        '18 cajas de regalo de madera de tepa',
      ],
      integraciones_digitales: [
        {
          titulo: 'Fondo de Co-Marketing (Co-op)',
          descripcion:
            'Rebate porcentual reinvertido en publicidad geolocalizada para tu tienda',
          tag: 'marketing',
        },
        {
          titulo: 'Descuento de Recompra Rápida',
          descripcion:
            'Precios preferentes automáticos al reordenar antes de 30 días',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Emporios de alta gama, tiendas de aeropuerto y tiendas gourmet de alto tráfico',
    },
    {
      id: 'regalos-corporativos',
      nombre: 'Kit Regalos Corporativos & Temporada',
      badge: 'Edición Regalo',
      tier: 'especialidad',
      tagline: 'Packs armados en cajas de madera con tarjeta territorial',
      descripcion:
        'Orientado a tiendas con demanda de regalos institucionales y fechas festivas (Navidad, Fiestas Patrias, eventos de empresas).',
      precio_neto_clp: 280000,
      pvp_estimado_clp: 480000,
      margen_estimado_pct: 42,
      moq_summary: '30 cajas de regalo armadas en madera nativa',
      sales_strategy:
        'Solución llave en mano para vender regalos corporativos de lujo austral sin tener que gestionar armado ni compras secundarias.',
      componentes_fisicos: [
        {
          cantidad: '30 un.',
          item: 'Cajas de Madera de Tepa con 2 frascos 150g',
          detalle: '1 Miel Cruda Floral + 1 Crema Avellana o Cacao con sello lacrado',
        },
        {
          cantidad: '30 un.',
          item: 'Tarjetas de Origen Territorial',
          detalle: 'Papel mineral con relato del bosque nativo',
        },
      ],
      herramientas_servicio: [
        '30 Cajas de madera de tepa curadas con cera virgen',
        '1 Muestra de mostrador abierta para exhibición',
      ],
      materiales_exhibicion: [
        'Caja de muestra abierta con caballete de madera para mostrador',
      ],
      integraciones_digitales: [
        {
          titulo: 'Pasaporte Digital de Regalo',
          descripcion:
            'El receptor del obsequio escanea el sello y conoce el árbol protegido',
          tag: 'trazabilidad',
        },
      ],
      recomendado_para:
        'Tiendas con venta corporativa activa, clubes de vino y boutiques de diseño',
    },
  ],
  value_props: [
    {
      icon: 'Shield',
      title: 'Trazabilidad verificable por lote',
      description:
        'Cada frasco lleva número de lote y origen botánico verificado. Tu cliente accede a la trazabilidad y respalda una economía de preservación.',
    },
    {
      icon: 'Award',
      title: 'Fondos de Co-Marketing (Co-op)',
      description:
        'Nuestra relación es bidireccional. Las recompras rápidas y altos volúmenes generan fondos de co-marketing y rebates porcentuales que invertimos juntos en activar ventas en tu tienda.',
    },
    {
      icon: 'Users',
      title: 'Kit de Entrada y Pack Digital',
      description:
        "Tu primer pedido viene como un 'Set de Entrada'. Incluye material impreso y un pack digital listo para desplegar en tus redes sociales y góndola.",
    },
    {
      icon: 'Package',
      title: 'Línea completa',
      description:
        'Mini frascos de 25g para regalo/impulso, frascos de 150g y frascos mayores de 500g Reserva del Bosque.',
    },
  ],
  stats: [
    { value: '3 formatos', label: 'Presentaciones 25g, 150g y 500g' },
    { value: '35–45%', label: 'Margen comercial proyectado' },
    { value: 'SAG', label: 'Certificación sanitaria oficial' },
    { value: 'Alta', label: 'Recompra documentada en retail' },
  ],
  process: [
    {
      step: '01',
      title: 'Set de Entrada',
      desc: 'Inicia con un Set diseñado para rotar rápido, acompañado de tu pack digital.',
    },
    {
      step: '02',
      title: 'Onboarding de Clientes',
      desc: 'A través de un código QR, tus consumidores se unen a nuestro programa de fidelidad, ganando su primer sello solo por visitar tu local.',
    },
    {
      step: '03',
      title: 'Crecimiento de Tier',
      desc: 'Tus recompras rápidas desbloquean rebates, fondos de co-marketing y el status Guardián de exclusividad territorial.',
    },
  ],
  faq: [
    {
      question: '¿Cómo funcionan los fondos de co-marketing (Co-op)?',
      answer:
        'Premiamos tu velocidad y volumen. Ciertos umbrales de compra activan fondos que La Obrera y el Zángano re-invierte en publicidad local, eventos en tu tienda o degustaciones para ayudarte a rotar el inventario aún más rápido.',
    },
    {
      question: '¿Qué es el Pack Digital del Set de Entrada?',
      answer:
        'Junto a tus primeros frascos, te enviamos material fotográfico profesional, videos cortos e historias del bosque optimizadas para que alimentes las redes sociales de tu tienda inmediatamente.',
    },
    {
      question: '¿Cómo funciona la exclusividad territorial?',
      answer:
        "Al alcanzar el tier de 'Guardián' en nuestro programa de Aliados del Bosque, te otorgamos exclusividad de radio (ej. única tienda autorizada en 5km a la redonda).",
    },
  ],
  code_modules: [
    {
      id: 'modulo-directorio-mapa',
      package_name: '@enjambre/shop-chrome',
      titulo: 'Directorio Oficial de Embajadas & Geolocalización',
      titulo_en: 'Official Partner Directory & Map Geolocation',
      descripcion:
        'Inclusión destacada de tu emporio o tienda en el mapa oficial de puntos de venta de Enjambre Legado. Los comensales que buscan miel cruda en tu ciudad son guiados a tu dirección física.',
      descripcion_en:
        'Featured listing on the official Enjambre Legado partner map. Discerning shoppers searching for raw honey in your city are directed straight to your doorstep.',
      badge: 'Tráfico Cualificado',
      beneficio_comercial:
        'Canaliza clientes con alta intención de compra directamente a tu tienda física sin costos publicitarios adicionales.',
      beneficio_comercial_en:
        'Channels high-intent gourmet shoppers directly into your retail shop without extra advertising ad spend.',
    },
    {
      id: 'modulo-tienda-resenas',
      package_name: '@enjambre/resenas',
      titulo: 'QR de Reseñas de Mesón & Validación en Góndola',
      titulo_en: 'Counter Review QR & Shelf Proof Validation',
      descripcion:
        'Material POP inteligente con código QR que muestra a los compradores notas de cata y calificaciones de clientes reales justo en el punto de decisión de compra.',
      descripcion_en:
        'Smart shelf display material linking directly to verified tasting notes and customer ratings right at the point of decision.',
      badge: 'Conversión Retail',
      beneficio_comercial:
        'Multiplica la velocidad de rotación en estantería al eliminar dudas sobre el sabor o la pureza frente a marcas convencionales.',
      beneficio_comercial_en:
        'Accelerates shelf turnover by eliminating doubts regarding authenticity and taste versus conventional brands.',
    },
    {
      id: 'modulo-pricing',
      package_name: '@enjambre/pricing',
      titulo: 'Motor de Márgenes Escalonados (40%–45%) & Rebates Co-Op',
      titulo_en: 'Tiered Wholesale Margins (40%–45%) & Co-Op Rebates',
      descripcion:
        'Algoritmo de precios mayoristas con cálculo dinámico de márgenes y asignación automática de fondos de co-marketing al mantener recompras regulares.',
      descripcion_en:
        'Wholesale pricing algorithm calculating real-time margins and allocating co-op marketing rebates for timely store restocks.',
      badge: 'Rentabilidad Protegida',
      beneficio_comercial:
        'Garantiza un margen comercial protegido superior al 40% y financia degustaciones o publicidad local compartida para tu tienda.',
      beneficio_comercial_en:
        'Guarantees protected 40%+ margins while co-funding in-store tastings and shared local advertising.',
    },
    {
      id: 'modulo-tienda-sale-qr',
      package_name: '@enjambre/sale-qr',
      titulo: 'Trazabilidad de Recolección & Certificado Botánico por Lote',
      titulo_en: 'Harvest Provenance & Batch Botanical Certificate',
      descripcion:
        'Cada frasco en tu vitrina porta un sello de trazabilidad que conecta con los predios protegidos de Chiloé, fecha de recolección y análisis de laboratorio.',
      descripcion_en:
        'Each jar on your display carries a traceability seal linking to the Chiloé protected apiary, collection date, and lab tests.',
      badge: 'Origen Auténtico',
      beneficio_comercial:
        'Justifica un PVP gourmet de alto valor frente a mieles industriales de supermercado, fidelizando a clientes de paladar exigente.',
      beneficio_comercial_en:
        'Justifies a premium gourmet retail price over supermarket industrial honeys, building loyalty with demanding food lovers.',
    },
  ],
  seo_title: 'Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano',
  seo_description:
    'Miel cruda para tiendas gourmet. Trazabilidad completa, formatos de 25g, 150g y 500g, y un programa de fidelidad y referidos.',
};

export const DEFAULT_B2B_FERIAS: B2BSegmentContentSettings = {
  slug: 'ferias',
  tipo: 'feria_evento',
  kicker: 'Para Ferias y Eventos',
  kicker_en: 'For Fairs & Events',
  headline: 'Del bosque al encuentro',
  headline_en: 'From the forest to the gathering',
  subheadline:
    'Formatos ideales para venta directa e impulso: destácate con nuestros mini frascos de 25g y gana beneficios inmediatos al rotar inventario.',
  subheadline_en:
    'Ideal formats for direct and impulse sales: stand out with our 25g jars and unlock immediate restocking perks.',
  hero_image: '/images/b2b/hero-ferias.jpg',
  suggested_products_copy:
    'Para eventos sugerimos una fuerte presencia de mini frascos de 25g, son altamente atractivos y tienen excelente margen en formato de regalo.',
  cta_text: 'Pedir kit de feria',
  cta_text_en: 'Order fair kit',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Impacto de Flujo Rápido & Conversión en 45 Segundos',
    titulo_en: 'Rapid-Flow Impact & 45-Second Conversion Strategy',
    bajada:
      'En eventos masivos, la atención dura segundos. Usa la bandeja flight de cata para enganchar el paso del público y cierra con pago QR exprés.',
    bajada_en:
      'In high-traffic events, attention lasts seconds. Use the portable tasting flight to catch passing crowds and close fast via QR checkout.',
    aumento_ticket: 'Ticket promedio de $15.000 CLP · Tiempo de atención <60 segundos',
    aumento_ticket_en: 'Average basket of $15,000 CLP · Service cycle <60 seconds',
    mecanica_ventas: [
      'Enganche en pasillo: Ofrece una muestra guiada en la bandeja flight de 3 puntos (Cruda, Avellana, Cacao) al público que transita.',
      'Precio anzuelo y escala: Mini frascos de 25g como compra impulsiva accesible ($2.500 CLP) y pack de 3 por $6.900 CLP para asegurar volumen.',
      'Pago QR sin fricción: Soporte QR inclinado visible a 2 metros; el cliente escanea y paga en 15 segundos sin hacer filas.',
      'Fidelización in situ: El cliente registra su correo o WhatsApp para ganar su primer sello digital, creando una base de contactos para venta posterior.',
    ],
    herramienta_clave: 'Bandeja Flight de Degustación Portátil en Madera de Chiloé',
    herramienta_clave_en: 'Portable Chiloé Native Wood Tasting Flight Tray',
  },
  tools: [
    {
      id: 'bandeja-flight-feria',
      nombre: 'Bandeja Flight de Degustación Portátil',
      nombre_en: 'Portable Tasting Flight Paddle',
      material: 'Ulmo ligero con mango ergonómico y 3 cavidades para frascos de cata',
      rol: 'Prospección Activa en Pasillo y Stand',
      descripcion:
        'Permite al expositor desplazarse libremente ofreciendo catas rápidas sin depender de que el cliente se acerque al mesón.',
      descripcion_en:
        'Allows the booth host to roam freely offering quick tastings without waiting for foot traffic to stop.',
      impacto_ventas: 'Multiplica por 4 las degustaciones por hora y atrae visitantes directamente hacia el stand.',
      impacto_ventas_en: 'Quadruples tasting interactions per hour and steers foot traffic straight to the booth.',
    },
    {
      id: 'totem-qr-cobro',
      nombre: 'Tótem Inclinado de Cobro QR & Reseña en Vivo',
      nombre_en: 'Slanted QR Express Pay & Live Review Totem',
      material: 'Madera noble y soporte acrílico anti-reflejo',
      rol: 'Terminal de Pago Rápido y Captura de Leads',
      descripcion:
        'Muestra código QR de transferencia bancaria / Transbank y QR para calificar la miel y unirse al club.',
      descripcion_en:
        'Displays bank transfer and card QR payment links alongside tasting feedback onboarding.',
      impacto_ventas: 'Reduce el tiempo de cobro a la mitad, eliminando pérdidas de ventas por aglomeración.',
      impacto_ventas_en: 'Halves checkout delays, eliminating missed impulse sales during peak rushes.',
    },
    {
      id: 'exhibidor-feria-plegable',
      nombre: 'Exhibidor Plegable Escalonado de Feria',
      nombre_en: 'Foldable Tiered Pop-Up Fair Stand',
      material: 'Roble de Chiloé ensamblado con encajes sin tornillos',
      rol: 'Montaje y Desmontaje Rápido en Stand',
      descripcion:
        'Estructura modular resistente que se arma en 30 segundos y soporta 50 frascos con visibilidad vertical.',
      descripcion_en:
        'Tool-free modular timber stand assembling in 30 seconds, holding 50 facing jars vertically.',
      impacto_ventas: 'Optimiza el espacio del stand permitiendo triplicar la cantidad de producto exhibido.',
      impacto_ventas_en: 'Maximizes narrow booth footprint, tripling visible stock density.',
    },
  ],
  kits: [
    {
      id: 'stand-degustacion',
      nombre: 'Kit Stand de Degustación Rápida',
      badge: 'Feria Inicial',
      tier: 'entrada',
      tagline: 'Configuración ágil para ferias de fin de semana y mercados de autor',
      descripcion:
        '72 mini frascos de 25g para venta rápida de impulso y 18 frascos de 150g para regalo, con bandeja flight de cata y tótem QR de cobro.',
      precio_neto_clp: 95000,
      pvp_estimado_clp: 165000,
      margen_estimado_pct: 42,
      moq_summary: '72 frascos 25g + 18 frascos 150g',
      sales_strategy:
        'Los mini frascos a $2.500 CLP y el pack de 3 a $6.900 CLP garantizan un flujo ininterrumpido de ventas sin objeción de precio.',
      componentes_fisicos: [
        {
          cantidad: '72 un.',
          item: 'Mini frascos 25g',
          detalle: 'Surtido de 4 variedades con tapa dorada',
        },
        {
          cantidad: '18 un.',
          item: 'Frascos 150g',
          detalle: 'Para clientes que buscan el formato de mesa',
        },
      ],
      herramientas_servicio: [
        '1 Bandeja flight de degustación portátil con mango',
        '1 Tótem QR de cobro rápido y reseñas',
        '200 Paletas de madera biodegradables para cata',
      ],
      materiales_exhibicion: [
        'Bandeja flight de degustación portátil',
        'Tótem QR de mesón',
      ],
      integraciones_digitales: [
        {
          titulo: 'Cobro Exprés con QR de Venta',
          descripcion:
            'El visitante escanea y paga directamente desde su aplicación bancaria',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Emprendedores en ferias gastronómicas, bazares de diseño y ferias de fin de semana',
    },
    {
      id: 'encuentro-gastronomico',
      nombre: 'Kit Encuentro Gastronómico & Cemento de Ventas',
      badge: 'Más Elegido · Evento Mayor',
      tier: 'medio',
      tagline: 'Presencia robusta para festivales, ferias de 3 a 5 días y congresos',
      descripcion:
        'Un mix completo de 25g, 150g y 500g con exhibidor plegable de mesón en madera noble y 2 bandejas de cata para atención simultánea.',
      precio_neto_clp: 220000,
      pvp_estimado_clp: 380000,
      margen_estimado_pct: 42,
      moq_summary: '144 frascos 25g + 36 frascos 150g + 12 frascos 500g',
      sales_strategy:
        'Doble punto de degustación simultáneo: mientras un expositor atiende en mesón, otro ofrece muestras en pasillo, duplicando las ventas diarias.',
      componentes_fisicos: [
        {
          cantidad: '144 un.',
          item: 'Mini frascos 25g',
          detalle: 'Para venta por impulso y degustación masiva',
        },
        {
          cantidad: '36 un.',
          item: 'Frascos 150g vitrina',
          detalle: 'Ediciones completas de bosque nativo',
        },
        {
          cantidad: '12 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Para compradores gourmet y familias',
        },
      ],
      herramientas_servicio: [
        '1 Exhibidor plegable escalonado de mesón en roble chilote',
        '2 Bandejas flight de degustación con mango ergonómico',
        '2 Tótems de cobro QR y captura de leads',
        '400 Paletas biodegradables de cata',
      ],
      materiales_exhibicion: [
        'Exhibidor plegable de madera nativa para feria',
        '2 bandejas flight de cata',
      ],
      integraciones_digitales: [
        {
          titulo: 'Catas Digitales & Registro en Stand',
          descripcion:
            'Captura de correos y WhatsApp a cambio del primer sello del club',
          tag: 'fidelizacion',
        },
      ],
      recomendado_para:
        'Festivales gastronómicos, ferias costumbristas y expo de turismo austral',
    },
    {
      id: 'activacion-masiva',
      nombre: 'Kit Activación Masiva & Gran Feria',
      badge: 'Gran Escala',
      tier: 'avanzado',
      tagline: 'Volumen y puesta en escena para pabellones y eventos multitudinarios',
      descripcion:
        'El equipamiento total para ferias nacionales o exposiciones de más de 10.000 asistentes con soporte de reposición express durante el evento.',
      precio_neto_clp: 480000,
      pvp_estimado_clp: 850000,
      margen_estimado_pct: 44,
      moq_summary: '288 frascos 25g + 72 frascos 150g + 24 frascos 500g',
      sales_strategy:
        'Puesta en escena de lujo territorial que domina el pasillo ferial. Diseñado para facturar más de $850.000 CLP en un fin de semana con margen protegido del 44%.',
      componentes_fisicos: [
        {
          cantidad: '288 un.',
          item: 'Mini frascos 25g',
          detalle: 'Máxima rotación en mesón de impulso',
        },
        {
          cantidad: '72 un.',
          item: 'Frascos 150g',
          detalle: 'Mix completo con etiqueta numerada',
        },
        {
          cantidad: '24 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Gran formato para el hogar',
        },
      ],
      herramientas_servicio: [
        '2 Exhibidores plegables dobles de feria en roble chilote',
        '3 Bandejas flight de cata para el equipo de atención',
        '3 Tótems QR de cobro y reseñas',
        '1000 Paletas biodegradables',
      ],
      materiales_exhibicion: [
        '2 exhibidores dobles de feria',
        '3 bandejas flight de cata',
        'Gráficas de stand y pendón de mesa en lino',
      ],
      integraciones_digitales: [
        {
          titulo: 'Soporte POS de Feria y Respaldo Continuo',
          descripcion:
            'Monitoreo de inventario y reposición prioritaria de emergencia',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Ferias internacionales, pabellones gourmet y eventos de alta concurrencia',
    },
  ],
  value_props: [
    {
      icon: 'Package',
      title: 'El magneto de miradas',
      description:
        'Los mini frascos de 25g con tapa dorada son la compra por impulso perfecta para visitantes de ferias y eventos.',
    },
    {
      icon: 'TrendingUp',
      title: 'Retorno Inmediato',
      description:
        'Cada frasco individualizado que adquieres para la feria te acerca a bonificaciones de stock para tu próximo evento.',
    },
    {
      icon: 'BarChart3',
      title: 'Levantamiento de Datos',
      description:
        'Durante la feria, los visitantes escanean tu QR para calificar la miel y ganar puntos. Tú te quedas con un registro de contactos calificados.',
    },
    {
      icon: 'ShoppingBag',
      title: 'Set de Entrada Físico',
      description:
        'Material gráfico, displays y tarjetas de producto. Todo lo que necesitas para que el stand cuente la historia del bosque por ti.',
    },
  ],
  stats: [
    { value: '25 g', label: 'Degustación y regalo' },
    { value: '3 formatos', label: 'Mix completo para stand' },
    { value: 'Alta', label: 'Conversión comprobada en cata guiada' },
    { value: '24–48h', label: 'Respuesta y coordinación para eventos' },
  ],
  process: [
    {
      step: '01',
      title: 'Planifica',
      desc: 'Cuéntanos la fecha y magnitud de tu evento para sugerir el mix adecuado de inventario.',
    },
    {
      step: '02',
      title: 'Equípate',
      desc: 'Recibe tu Set de Entrada con los frascos y el material de exhibición físico y digital.',
    },
    {
      step: '03',
      title: 'Interactúa',
      desc: 'Usa el sistema de Catas Digitales en tu stand. Atrae público y multiplica ventas.',
    },
  ],
  faq: [
    {
      question: '¿Con cuánta anticipación debo solicitar el kit para mi feria?',
      answer:
        'Recomendamos coordinar con 5 a 7 días hábiles de anticipación para despachos a regiones, asegurando que tu material y frascos lleguen a tiempo para el montaje.',
    },
    {
      question: '¿Qué formato tiene mayor rotación en eventos masivos?',
      answer:
        'Los mini frascos de 25g son el producto de mayor velocidad. Se compran en packs de 3 o como recuerdo accesible, generando volumen sin resistencia de precio.',
    },
  ],
  code_modules: [
    {
      id: 'modulo-campo-pos',
      package_name: 'apps/campo',
      titulo: 'Terminal POS 100% Offline-First (Dexie DB)',
      titulo_en: '100% Offline-First POS Engine (Dexie DB)',
      descripcion:
        'Motor de punto de venta optimizado para ferias rurales y pabellones cerrados. Opera sin internet, registrando transacciones localmente con sincronización automática en cola cuando vuelve la red.',
      descripcion_en:
        'Point-of-sale engine engineered for remote rural fairs and enclosed exhibition pavilions. Operates 100% offline with auto-syncing queues.',
      badge: 'Cero Caídas Offline',
      beneficio_comercial:
        'Nunca pierdes una venta por falta de señal móvil o caída de red en medio de un evento masivo.',
      beneficio_comercial_en:
        'Never lose a high-traffic sale due to poor mobile reception or network outages during crowded expo weekends.',
    },
    {
      id: 'modulo-sumup',
      package_name: '@enjambre/sumup',
      titulo: 'Cobro Rápido con Tarjeta & Pasarela Portátil',
      titulo_en: 'Express Card Payments & Portable Gateway',
      descripcion:
        'Integración fluida con lectores móviles de tarjeta y soporte de débito/crédito chileno en segundos, reduciendo la fila del stand al mínimo.',
      descripcion_en:
        'Seamless integration with mobile card readers handling Chilean debit/credit in seconds, keeping stand queues ultra-short.',
      badge: 'Cobro sin Fricción',
      beneficio_comercial:
        'Reduce el tiempo de atención a menos de 45 segundos por transacción, capturando todas las compras de impulso del pasillo.',
      beneficio_comercial_en:
        'Cuts service cycle to under 45 seconds per buyer, capturing every impulse purchase from the passing crowd.',
    },
    {
      id: 'modulo-ferias-qr',
      package_name: '@enjambre/sale-qr',
      titulo: 'Cobro Inmediato con QR & Catas Digitales en Stand',
      titulo_en: 'Instant QR Payments & In-Booth Digital Tastings',
      descripcion:
        'Tótem inclinado con código QR para pagos directos y registro sensorial guiado mientras el visitante prueba las variedades en la bandeja flight.',
      descripcion_en:
        'Angled totem displaying direct QR payments alongside guided sensory feedback while visitors sample from the tasting flight.',
      badge: 'Interacción Interactiva',
      beneficio_comercial:
        'Multiplica por 4 las degustaciones efectivas y captura el contacto digital de cada comprador para ventas posteriores.',
      beneficio_comercial_en:
        'Quadruples successful tastings and captures digital contact info from every buyer for post-event reorders.',
    },
    {
      id: 'modulo-logistica',
      package_name: '@enjambre/logistica',
      titulo: 'Reposición Express para Eventos & Alerta de Stock Crítico',
      titulo_en: 'Event Restock Automation & Stock-Out Alerts',
      descripcion:
        'Monitoreo de inventario con despacho preferente en 24-48 horas para ferias de múltiples días con alta demanda no planificada.',
      descripcion_en:
        'Inventory monitoring with 24-48h rush replenishment for multi-day fairs with unexpected high demand.',
      badge: 'Respaldo Ininterrumpido',
      beneficio_comercial:
        'Garantiza no quedarse sin producto en el día de mayor asistencia, maximizando la facturación neta de todo el fin de semana.',
      beneficio_comercial_en:
        'Ensures you never run out of inventory during peak foot-traffic days, maximizing gross revenue.',
    },
  ],
  seo_title: 'Miel para Ferias y Eventos Gourmet · La Obrera y el Zángano',
  seo_description:
    'Formatos de 25g y 150g para stands de ferias gastronómicas. Venta directa por impulso y herramientas de degustación para maximizar tus ventas.',
};

export const DEFAULT_B2B_REVENDEDORES: B2BSegmentContentSettings = {
  slug: 'revendedores',
  tipo: 'otro',
  kicker: 'Para Revendedores',
  kicker_en: 'For Independent Resellers',
  headline: 'Comienza tu propio negocio con miel de bosque nativo',
  headline_en: 'Launch your own venture with native forest honey',
  subheadline:
    'Distribuye miel cruda premium en tu círculo cercano. Sin cuotas de entrada, con herramientas de venta digital, incentivos por recompra y fidelización automatizada.',
  subheadline_en:
    'Distribute premium raw honey within your network. Zero entry fees, digital selling tools, rapid restock bonuses, and automated customer loyalty.',
  hero_image: '/images/b2b/hero-revendedores.jpg',
  suggested_products_copy:
    'Para revendedores recomendamos iniciar con un mix de frascos de 150g y 500g, complementado con mini frascos de 25g ideales para dar a probar a nuevos clientes.',
  cta_text: 'Comenzar ahora',
  cta_text_en: 'Start now',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Venta por Recomendación & Micro-Catas Privadas',
    titulo_en: 'Relationship Selling & Private Micro-Tastings Strategy',
    bajada:
      'No vendas por catálogo frío. Abre el maletín de demostración en reuniones familiares, de oficina o clubes y cierra pedidos con degustación guiada.',
    bajada_en:
      'Never sell through cold brochures. Open your tasting demo kit during intimate family, office, or club gatherings and close orders through guided flavor discovery.',
    aumento_ticket: 'Pedido medio de $28.000 CLP · 40% a 45% de margen directo',
    aumento_ticket_en: 'Average order of $28,000 CLP · 40% to 45% direct profit margin',
    mecanica_ventas: [
      'Micro-cata de círculo cercano: Presenta las 4 variedades usando el maletín de lino y madera, explicando el bosque nativo de Chiloé.',
      'Pedidos inmediatos con stock de mano: Entrega los frascos en el acto cobrando al contado o transferencia directa.',
      'Trazabilidad con código personal: Cada cliente escanea tu QR asignado para ver el pasaporte de lote, registrando su contacto bajo tu cuenta.',
      'Recompra rápida bonificada: Si repones tu inventario dentro de 30 días, desbloqueas unidades adicionales de cortesía que aumentan tu ganancia neta.',
    ],
    herramienta_clave: 'Maletín de Muestras en Lino y Madera Nativa con Tarjetas QR',
    herramienta_clave_en: 'Linen & Native Wood Sample Demo Kit with Personal QR Cards',
  },
  tools: [
    {
      id: 'maletin-embajador',
      nombre: 'Maletín de Muestras en Lino y Madera Nativa',
      nombre_en: 'Linen & Native Wood Ambassador Tasting Kit',
      material: 'Maletín rígido forrado en lino crudo con interiores en madera de Chiloé',
      rol: 'Herramienta de Presentación y Demostración Móvil',
      descripcion:
        'Alberga 4 frascos de cata, espátulas dosificadoras de madera, mantel de presentación y rueda de cata impresa.',
      descripcion_en:
        'Carries 4 tasting jars, wooden sampling spatulas, presentation linen runner, and printed flavor wheel.',
      impacto_ventas: 'Proyecta profesionalismo y exclusividad, logrando una tasa de conversión superior al 85% en reuniones.',
      impacto_ventas_en: 'Projects supreme craft and confidence, generating over 85% conversion in private gatherings.',
    },
    {
      id: 'tarjetas-qr-embajador',
      nombre: 'Pack de 100 Tarjetas de Embajador con QR Personal',
      nombre_en: '100 Ambassador Cards with Personal QR Attribution',
      material: 'Papel mineral de 400g con relieve en seco',
      rol: 'Identificación y Trazabilidad Comercial',
      descripcion:
        'Tarjetas de visita que enlazan al catálogo personal del embajador para capturar pedidos repetidos automáticamente.',
      descripcion_en:
        'Luxe business cards linking to your personal catalog page to capture automated repeat commission sales.',
      impacto_ventas: 'Asegura que las recompras futuras de los comensales se atribuyan a tu comisión.',
      impacto_ventas_en: 'Guarantees that downstream repeat orders are cleanly attributed to your account.',
    },
    {
      id: 'catalogo-lujo-bolsillo',
      nombre: 'Catálogo de Bolsillo de Lujo',
      nombre_en: 'Pocket Luxury Monograph Catalog',
      material: 'Papel mineral encuadernado con fotografías de origen y ciencia',
      rol: 'Material de Apoyo a la Venta',
      descripcion:
        'Resumen visual de los análisis de laboratorio, floraciones nativas y sellos de calidad.',
      descripcion_en:
        'Compact visual dossier summarizing laboratory analyses, native blooms, and purity credentials.',
      impacto_ventas: 'Resuelve objeciones de pureza y calidad al instante frente a clientes exigentes.',
      impacto_ventas_en: 'Resolves quality and purity questions on the spot for discerning buyers.',
    },
  ],
  kits: [
    {
      id: 'maletin-inicial',
      nombre: 'Kit Maletín Embajador Inicial',
      badge: 'Iniciación Embajador',
      tier: 'entrada',
      tagline: 'Tu kit de demostración portátil para iniciar ventas en tu red cercana',
      descripcion:
        'Incluye el maletín de demostración con 4 variedades de muestra y 12 frascos de 150g para tus primeras ventas inmediatas con entrega en mano.',
      precio_neto_clp: 65000,
      pvp_estimado_clp: 110000,
      margen_estimado_pct: 41,
      moq_summary: '12 frascos 150g + Maletín de cata completo',
      sales_strategy:
        'Organiza tu primera micro-cata de 4 personas; recupera la inversión total del kit en menos de 48 horas vendiendo los 12 frascos.',
      componentes_fisicos: [
        {
          cantidad: '12 un.',
          item: 'Frascos 150g entrega inmediata',
          detalle: '4 Miel Cruda, 4 Crema Avellana, 4 Crema Cacao',
        },
      ],
      herramientas_servicio: [
        '1 Maletín de demostración en lino y madera nativa con 4 frascos de cata',
        '50 Tarjetas de embajador con código QR personalizado',
        '1 Catálogo de bolsillo de lujo en papel mineral',
      ],
      materiales_exhibicion: [
        'Maletín de muestras para demostración',
        'Tarjetas de embajador con QR',
      ],
      integraciones_digitales: [
        {
          titulo: 'Código QR de Embajador Asignado',
          descripcion:
            'Tus clientes escanean tu código y sus compras quedan vinculadas a tu cuenta',
          tag: 'trazabilidad',
        },
      ],
      recomendado_para:
        'Nuevos embajadores que inician ventas con familiares, amigos y compañeros de trabajo',
    },
    {
      id: 'stock-rotacion',
      nombre: 'Kit Stock de Rotación & Demostración',
      badge: 'Más Elegido · Círculo Activo',
      tier: 'medio',
      tagline: 'El balance ideal entre producto de entrega inmediata y obsequios',
      descripcion:
        '36 frascos de 150g y 12 frascos de 500g para abastecer hogares, más 50 mini frascos de 25g de obsequio para abrir nuevos clientes.',
      precio_neto_clp: 185000,
      pvp_estimado_clp: 320000,
      margen_estimado_pct: 42,
      moq_summary: '36 frascos 150g + 12 frascos 500g + 50 minis 25g',
      sales_strategy:
        'Los mini frascos de 25g de obsequio abren puertas instantáneamente: regala un frasco a un prospecto y genera un pedido recurrente de 500g en menos de una semana.',
      componentes_fisicos: [
        {
          cantidad: '36 un.',
          item: 'Frascos 150g surtidos',
          detalle: 'Las 4 cremas botánicas de Chiloé',
        },
        {
          cantidad: '12 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Para consumo familiar continuo',
        },
        {
          cantidad: '50 un.',
          item: 'Mini frascos 25g cortesía',
          detalle: 'Para abrir nuevos prospectos',
        },
      ],
      herramientas_servicio: [
        '1 Maletín de demostración completo',
        '100 Tarjetas de embajador con QR personal',
        '3 Catálogos de bolsillo',
      ],
      materiales_exhibicion: [
        'Maletín de presentación',
        '100 tarjetas de presentación de embajador',
      ],
      integraciones_digitales: [
        {
          titulo: 'Bonus de Recompra Rápida',
          descripcion:
            'Desbloquea unidades de cortesía al recomprar en menos de 30 días',
          tag: 'pricing',
        },
        {
          titulo: 'Pack Digital de Ventas',
          descripcion:
            'Imágenes profesionales y textos probados para estados de WhatsApp e Instagram',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Revendedores activos con red consolidada en oficinas, condominios o gimnasios',
    },
    {
      id: 'distribuidor-zonal',
      nombre: 'Kit Distribuidor Zonal & Red de Contactos',
      badge: 'Red Ampliada',
      tier: 'avanzado',
      tagline: 'Abastecimiento de volumen para liderar una micro-red en tu comuna',
      descripcion:
        'Para distribuidores independientes que colocan producto en pequeños comercios de barrio, ferias locales o grupos de compra comunitaria.',
      precio_neto_clp: 460000,
      pvp_estimado_clp: 810000,
      margen_estimado_pct: 43,
      moq_summary: '96 frascos 150g + 36 frascos 500g + 120 minis 25g',
      sales_strategy:
        'Margen máximo del 43% que permite revender a pequeños negocios aliados o clientes finales, con retorno bruto estimado de $350.000 CLP de ganancia neta por rotación.',
      componentes_fisicos: [
        {
          cantidad: '96 un.',
          item: 'Frascos 150g',
          detalle: 'Mix completo de alta rotación',
        },
        {
          cantidad: '36 un.',
          item: 'Frascos 500g Reserva',
          detalle: 'Miel cruda pura de bosque nativo',
        },
        {
          cantidad: '120 un.',
          item: 'Mini frascos 25g de impulso',
          detalle: 'Para activación comercial continua',
        },
      ],
      herramientas_servicio: [
        '2 Maletines de demostración completos en lino y madera',
        '200 Tarjetas de embajador con QR',
        '2 Exhibidores pequeños de sobremesa para locales aliados',
      ],
      materiales_exhibicion: [
        '2 maletines de cata',
        '2 exhibidores de sobremesa',
        '200 tarjetas con QR',
      ],
      integraciones_digitales: [
        {
          titulo: 'Asignación de Zona Preferente',
          descripcion:
            'Derivación de prospectos minoristas que consultan desde tu comuna',
          tag: 'fidelizacion',
        },
      ],
      recomendado_para:
        'Líderes de distribución local, profesionales independientes y distribuidores zonales',
    },
  ],
  value_props: [
    {
      icon: 'TrendingUp',
      title: 'Bonus de Recompra Rápida',
      description:
        'Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de 30 días, desbloqueas rebajas automáticas y producto bonificado.',
    },
    {
      icon: 'Shield',
      title: 'Respaldo analítico y de marca',
      description:
        'Vendes un producto con identidad territorial genuina, pureza comprobada y análisis de laboratorio certificados documentados en nuestra sección de ciencia.',
    },
    {
      icon: 'Package',
      title: 'Set de Entrada y Pack Digital',
      description:
        "Tu primera orden es un 'Set de Entrada' que incluye un kit de activos para redes sociales listos para que empieces a vender de inmediato.",
    },
    {
      icon: 'Award',
      title: 'Programa de tiers',
      description:
        'Avanza en la red de guardianes según tu volumen y regularidad de reposición. Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas.',
    },
  ],
  stats: [
    { value: '30 días', label: 'Ciclo preferente de reposición' },
    { value: '0 costo', label: 'Sin cobro de incorporación' },
    { value: 'Escalable', label: 'Margen comercial según volumen' },
    { value: 'Kit digital', label: 'Activos fotográficos de apoyo' },
  ],
  process: [
    {
      step: '01',
      title: 'Únete',
      desc: 'Regístrate sin costo, obtén tu código de revendedor y descarga tu Pack Digital de ventas.',
    },
    {
      step: '02',
      title: 'Distribuye',
      desc: 'Ofrece los formatos disponibles e invita a tus clientes a escanear tu código para acceder a la trazabilidad y cata de origen.',
    },
    {
      step: '03',
      title: 'Acelera',
      desc: 'Haz pedidos de reposición regulares para acceder a bonificaciones comerciales y condiciones preferentes.',
    },
  ],
  faq: [
    {
      question: '¿Cómo funciona el Bonus de Recompra Rápida?',
      answer:
        'El sistema mide la cadencia de tus pedidos. Si mantienes reposición continua dentro del plazo establecido, se aplica automáticamente una bonificación comercial o unidades de cortesía.',
    },
    {
      question: '¿Cómo mis clientes acceden a la trazabilidad conmigo?',
      answer:
        'Te asignamos un código único de representación. Cuando entregas un frasco, tus clientes escanean el código para acceder al pasaporte de lote y registrar su percepción sensorial.',
    },
    {
      question: '¿Qué incluye el Pack Digital?',
      answer:
        'Al registrarte, descargas un paquete con fotografías profesionales de los frascos, textos de venta probados y gráficos para redes sociales.',
    },
  ],
  code_modules: [
    {
      id: 'modulo-portal-embajador',
      package_name: '@enjambre/auth',
      titulo: 'Portal Privado de Embajador & Código de Atribución',
      titulo_en: 'Private Ambassador Portal & Attribution Codes',
      descripcion:
        'Panel digital personal con código único de representación. Cada frasco o tarjeta que entregas enlaza a tu perfil, asegurando comisiones transparentes por cada recompra de tus contactos.',
      descripcion_en:
        'Personal digital portal with dedicated reseller code. Every jar or card you hand out links to your account, securing commissions on every downstream reorder.',
      badge: 'Comisión Garantizada',
      beneficio_comercial:
        'Construye un ingreso recurrente sin depender de volver a cobrar manualmente: tus clientes recompran en la tienda y la comisión es tuya.',
      beneficio_comercial_en:
        'Builds recurring income without manual debt chasing: your contacts repurchase online and you earn your commission.',
    },
    {
      id: 'modulo-revendedor-wallet',
      package_name: '@enjambre/wallet',
      titulo: 'Pase de Membresía Móvil & Fidelización Automatizada',
      titulo_en: 'Mobile Membership Pass & Automated Retention',
      descripcion:
        'Tus clientes agregan su tarjeta a Apple Wallet o Google Wallet y acumulan sellos por cada compra que te hacen, motivando la recompra periódica del formato de 500g.',
      descripcion_en:
        'Your clients save their pass to Apple Wallet or Google Wallet, earning reward stamps on every purchase to drive steady 500g reorders.',
      badge: 'Retención sin Fricción',
      beneficio_comercial:
        'Fideliza a tu círculo cercano con incentivos digitales reales que generan una tasa de recompra cada 3 semanas.',
      beneficio_comercial_en:
        'Retains your network with digital incentives that generate recurring orders every 3 weeks.',
    },
    {
      id: 'modulo-revendedor-pricing',
      package_name: '@enjambre/pricing',
      titulo: 'Bonus de Recompra Rápida & Escala de Márgenes (41%–45%)',
      titulo_en: 'Rapid Restock Bonus & Margin Scale (41%–45%)',
      descripcion:
        'Sistema que premia la velocidad de rotación: al reponer inventario en menos de 30 días, el motor desbloquea unidades de cortesía y descuentos crecientes.',
      descripcion_en:
        'Turnover incentive system: restock within 30 days and unlock complimentary bonus jars plus progressive volume discounts.',
      badge: 'Rentabilidad Creciente',
      beneficio_comercial:
        'Aumenta tu ganancia neta por frasco a medida que construyes una base fiel de consumidores en tu comuna.',
      beneficio_comercial_en:
        'Boosts your net profit per jar as you grow a steady customer base in your neighborhood.',
    },
    {
      id: 'modulo-contable',
      package_name: '@enjambre/contable',
      titulo: 'Liquidación Transparente & Respaldo Tributario Inmediato',
      titulo_en: 'Transparent Settlement & Instant Tax Invoicing',
      descripcion:
        'Módulo contable que genera resúmenes claros de ventas, márgenes obtenidos y emisión de boletas o facturas con un clic.',
      descripcion_en:
        'Accounting module providing clear summaries of sales, realized margins, and one-click receipt and invoice generation.',
      badge: 'Control Financiero Total',
      beneficio_comercial:
        'Maneja tu negocio independiente con orden financiero impecable, cero enredos y total certeza de tus márgenes de ganancia.',
      beneficio_comercial_en:
        'Run your independent venture with pristine bookkeeping, zero accounting hassles, and complete margin transparency.',
    },
  ],
  seo_title: 'Programa de Revendedores · La Obrera y el Zángano',
  seo_description:
    'Revende miel cruda premium. Accede a bonus de recompra rápida, pack digital de ventas y un programa de fidelidad en app para retener a tus propios clientes.',
};

export const DEFAULT_B2B_SEGMENTS: Record<B2BSegmentSlug, B2BSegmentContentSettings> = {
  cafeterias: DEFAULT_B2B_CAFETERIAS,
  hoteles: DEFAULT_B2B_HOTELES,
  'tiendas-gourmet': DEFAULT_B2B_TIENDAS_GOURMET,
  ferias: DEFAULT_B2B_FERIAS,
  revendedores: DEFAULT_B2B_REVENDEDORES,
};

export function parseB2BSegmentContent(
  raw: Record<string, unknown> | null | undefined,
  fallbackSlug: B2BSegmentSlug,
): B2BSegmentContentSettings {
  const d = DEFAULT_B2B_SEGMENTS[fallbackSlug] ?? DEFAULT_B2B_CAFETERIAS;
  if (!raw) return { ...d };

  const parsedValueProps: B2BValueProp[] = [];
  if (Array.isArray(raw.value_props)) {
    for (const item of raw.value_props) {
      const vp = parseB2BValueProp(item);
      if (vp) parsedValueProps.push(vp);
    }
  }

  const parsedStats: B2BStat[] = [];
  if (Array.isArray(raw.stats)) {
    for (const item of raw.stats) {
      const st = parseB2BStat(item);
      if (st) parsedStats.push(st);
    }
  }

  const parsedProcess: B2BProcessStep[] = [];
  if (Array.isArray(raw.process)) {
    for (const item of raw.process) {
      const ps = parseB2BProcessStep(item);
      if (ps) parsedProcess.push(ps);
    }
  }

  const parsedFaq: B2BFaqItem[] = [];
  if (Array.isArray(raw.faq)) {
    for (const item of raw.faq) {
      const fq = parseB2BFaqItem(item);
      if (fq) parsedFaq.push(fq);
    }
  }

  const parsedKits: B2BKitItem[] = [];
  if (Array.isArray(raw.kits)) {
    for (const item of raw.kits) {
      const kit = parseB2BKitItem(item);
      if (kit) parsedKits.push(kit);
    }
  }

  const parsedTools: B2BToolItem[] = [];
  if (Array.isArray(raw.tools)) {
    for (const item of raw.tools) {
      const tool = parseB2BToolItem(item);
      if (tool) parsedTools.push(tool);
    }
  }

  const parsedCodeModules: B2BCodeModule[] = [];
  if (Array.isArray(raw.code_modules)) {
    for (const item of raw.code_modules) {
      const cm = parseB2BCodeModule(item);
      if (cm) parsedCodeModules.push(cm);
    }
  }

  const rawStrategy =
    raw.commercial_strategy ??
    raw.commercialStrategy ??
    raw.strategy ??
    (raw.strategy_title || raw.strategy_summary || raw.strategy_ticket_boost ? raw : null);
  const parsedStrategy = rawStrategy ? parseB2BCommercialStrategy(rawStrategy) : null;

  return {
    slug: fallbackSlug,
    tipo: asString(raw.tipo, d.tipo),
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    headline: asString(raw.headline, d.headline).trim(),
    headline_en: typeof raw.headline_en === 'string' ? raw.headline_en.trim() : d.headline_en,
    subheadline: asString(raw.subheadline, d.subheadline).trim(),
    subheadline_en: typeof raw.subheadline_en === 'string' ? raw.subheadline_en.trim() : d.subheadline_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    suggested_products_copy: asString(raw.suggested_products_copy, d.suggested_products_copy).trim(),
    suggested_products_copy_en:
      typeof raw.suggested_products_copy_en === 'string'
        ? raw.suggested_products_copy_en.trim()
        : d.suggested_products_copy_en,
    cta_text: asString(raw.cta_text, d.cta_text).trim(),
    cta_text_en: typeof raw.cta_text_en === 'string' ? raw.cta_text_en.trim() : d.cta_text_en,
    cta_href: sanitizeStoreHref(raw.cta_href, d.cta_href) ?? d.cta_href,
    value_props: parsedValueProps.length > 0 ? parsedValueProps : d.value_props,
    stats: parsedStats.length > 0 ? parsedStats : d.stats,
    process: parsedProcess.length > 0 ? parsedProcess : d.process,
    faq: parsedFaq.length > 0 ? parsedFaq : d.faq,
    kits: parsedKits.length > 0 ? parsedKits : d.kits,
    tools: parsedTools.length > 0 ? parsedTools : d.tools,
    commercial_strategy: parsedStrategy ?? d.commercial_strategy,
    code_modules: parsedCodeModules.length > 0 ? parsedCodeModules : d.code_modules,
    seo_title: asString(raw.seo_title, d.seo_title ?? '').trim() || d.seo_title,
    seo_title_en: typeof raw.seo_title_en === 'string' ? raw.seo_title_en.trim() : d.seo_title_en,
    seo_description: asString(raw.seo_description, d.seo_description ?? '').trim() || d.seo_description,
    seo_description_en:
      typeof raw.seo_description_en === 'string' ? raw.seo_description_en.trim() : d.seo_description_en,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── Origen & Monografías Botánicas ─────────────────────────────────────────

export type OrigenSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_ORIGEN_SETTINGS: OrigenSettings = {
  kicker: 'Colección',
  kicker_en: 'Collection',
  title: 'Origen & Floraciones',
  title_en: 'Origin & Blooms',
  description:
    'Explora nuestra biblioteca de monografías botánicas. Un estudio profundo y documentado sobre las especies nectaríferas que sostienen la biodiversidad del bosque valdiviano y dan origen a nuestras creaciones.',
  description_en:
    'Explore our botanical monograph library. An in-depth and documented study of nectariferous species that sustain Valdivian rainforest biodiversity and give origin to our creations.',
};

export function parseOrigenSettings(
  raw: Record<string, unknown> | null | undefined,
): OrigenSettings {
  const d = DEFAULT_ORIGEN_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    description: asString(raw.description, d.description).trim(),
    description_en: typeof raw.description_en === 'string' ? raw.description_en.trim() : d.description_en,
    text_align: parseTextAlign(raw.text_align),
  };
}

export type BotanicalMonograph = {
  slug: string;
  common_name: string;
  common_name_en?: string;
  scientific_name: string;
  short_description: string;
  short_description_en?: string;
  full_description: string;
  full_description_en?: string;
  sensory_profile: string;
  sensory_profile_en?: string;
  flowering_period: string;
  flowering_period_en?: string;
  ecology: string;
  ecology_en?: string;
  references?: string;
  image_url?: string;
  faqs?: B2BFaqItem[];
};

export const DEFAULT_ULMO_MONOGRAPH: BotanicalMonograph = {
  slug: 'ulmo',
  common_name: 'Ulmo',
  common_name_en: 'Ulmo',
  scientific_name: 'Eucryphia cordifolia (Cavanilles)',
  short_description:
    'Árbol majestuoso del bosque valdiviano, conocido por sus grandes flores blancas y su néctar de alta concentración de azúcares. Produce una miel de aroma floral intenso y notas de vainilla.',
  short_description_en:
    'Majestic tree of the Valdivian rainforest, renowned for large white flowers and rich sugar nectar. Yields honey with an intense floral bouquet and vanilla notes.',
  full_description:
    'El ulmo es un árbol perennifolio majestuoso del bosque valdiviano, endémico del sur de Chile y áreas contiguas en Argentina. Puede sobrepasar los 40 metros de altura y alcanzar diámetros de tronco de hasta dos metros. Su floración —entre enero y marzo— es un evento fenológico masivo de enorme trascendencia ecológica y apícola.',
  sensory_profile:
    'La miel unifloral de ulmo se distingue por un índice de color claro (ámbar extra blanco a ámbar claro). Presenta marcada actividad antioxidante y propiedades antibacterianas no peróxidas significativas. Aroma intensamente floral, volátil, con trazas evidentes de vainilla, anís y jazmín. Cristalización fina y mantecosa.',
  flowering_period: 'Enero a Marzo (Verano Austral)',
  ecology:
    'Especie pionera tardía de larga vida que requiere suelos profundos con humedad constante. Sostiene la biodiversidad del dosel albergando epífitas y nutriendo avifauna e insectos nativos.',
  references:
    'Donoso, C. (2006). Las especies arbóreas de los bosques templados de Chile y Argentina; Montenegro, G. et al. (2008). Propiedades antibacterianas y antioxidantes de las mieles chilenas.',
  faqs: [
    {
      question: '¿Qué es la miel de ulmo?',
      answer:
        'La miel de ulmo proviene de la floración de Eucryphia cordifolia, un árbol endémico del bosque valdiviano en el sur de Chile. Es una de las mieles más valoradas del mundo por su perfil floral delicado con notas de vainilla y su color claro ámbar dorado.',
    },
    {
      question: '¿Cuándo florece el ulmo?',
      answer:
        'El ulmo florece entre enero y marzo en el bosque valdiviano, coincidiendo con el verano austral. La floración dura aproximadamente 4-6 semanas y es altamente dependiente de las condiciones climáticas del año.',
    },
    {
      question: '¿Qué diferencia la miel de ulmo de la de tiaca?',
      answer:
        'La miel de ulmo (Eucryphia cordifolia) es clara, floral, con notas de vainilla y cuerpo ligero. La miel de tiaca (Calcluvia paniculata) es más ámbar, herbácea, con mayor cuerpo y un perfil más terroso.',
    },
  ],
};

export const DEFAULT_TIACA_MONOGRAPH: BotanicalMonograph = {
  slug: 'tiaca',
  common_name: 'Tiaca',
  common_name_en: 'Tiaca',
  scientific_name: 'Caldcluvia paniculata (Cavanilles)',
  short_description:
    'Complejidad balsámica de las quebradas húmedas y cursos de agua del sur. Su miel es de perfil profundo, acidez noble y retrogusto mineral.',
  short_description_en:
    'Balsamic complexity of wet ravines and southern watercourses. Its honey offers a deep profile, noble acidity, and mineral finish.',
  full_description:
    'La tiaca es una especie endémica de los bosques templados húmedos de Chile y el suroeste de Argentina. Crece vigorosamente en quebradas sombrías, bordes de arroyos y riberas, donde protege cuencas y suelos frágiles. Su floración blanca en panículas densas ocurre entre febrero y abril, ofreciendo una fuente de néctar balsámico insustituible al final de la temporada estival.',
  sensory_profile:
    'Miel ámbar medio con tonalidades doradas profundas. Perfil marcadamente herbáceo y balsámico, con una acidez noble característica y un final mineral terroso prolongado en el paladar. Cristalización media y textura sedosa.',
  flowering_period: 'Febrero a Abril (Cierre de verano y preludio otoñal)',
  ecology:
    'Árbol nodriza ribereño de rápido crecimiento que fija riberas y previene la erosión hídrica en quebradas del archipiélago de Chiloé.',
  references:
    'Donoso, C. (2006). Árboles nativos de Chile; Montenegro, G. (2008). Propiedades palinológicas de mieles del bosque templado.',
};

export const DEFAULT_QUILLAY_MONOGRAPH: BotanicalMonograph = {
  slug: 'quillay',
  common_name: 'Quillay',
  common_name_en: 'Quillay',
  scientific_name: 'Quillaja saponaria (Molina)',
  short_description:
    'El árbol sagrado de la vertiente esclerófila y templada de Chile. Miel ámbar densa, floral intensa con toques tostados y gran riqueza fitoquímica.',
  short_description_en:
    'Sacred tree of central and Mediterranean-temperate Chile. Dense amber honey with intense floral and toasted notes, rich in natural phytochemicals.',
  full_description:
    'El quillay es un árbol endémico de la zona central y centro-sur de Chile, célebre por su corteza rica en saponinas naturales y su gran resiliencia frente a la sequía. Sus flores pentámeras en corimbos terminales florecen en primavera, generando un flujo masivo de néctar que reactiva la vigorosidad de los enjambres.',
  sensory_profile:
    'Miel ámbar dorada de alta densidad y viscosidad. Aroma penetrante, floral intenso con notas tostadas y un amargor noble sutil muy balanceado. Posee gran persistencia retronasal y riqueza fitoquímica natural.',
  flowering_period: 'Octubre a Diciembre (Primavera)',
  ecology:
    'Especie esclerófila estructurante del ecosistema mediterráneo y de transición templada, fundamental para la recuperación de laderas áridas y la nutrición temprana de polinizadores silvestres.',
  references:
    'Rodríguez, R. et al. (2018). Flora arbórea de Chile; Codex Alimentarius CXS 12-1981.',
};

export const DEFAULT_AVELLANO_MONOGRAPH: BotanicalMonograph = {
  slug: 'avellano',
  common_name: 'Avellano Chileno',
  common_name_en: 'Chilean Hazelnut',
  scientific_name: 'Gevuina avellana (Molina)',
  short_description:
    'Inflorescencias en racimo y nutrición densa del bosque siempreverde. Miel amaderada con notas a fruto seco y final suave.',
  short_description_en:
    'Dense clusters and high nutrition from the evergreen forest. Woody honey with nutty undertones and smooth finish.',
  full_description:
    'El avellano chileno es un árbol característico del bosque templado lluvioso perteneciente a la familia Proteaceae. Florece a principios de primavera con largos racimos de flores blancas hermafroditas. Además de aportar néctar, su polen posee una concentración excepcional de proteínas y lípidos esenciales para el desarrollo de la cría.',
  sensory_profile:
    'Miel ámbar clara a media, de textura untuosa y cristalización rápida y fina. Notas amaderadas, toques tostados que recuerdan frutos secos y un final sedoso muy elegante.',
  flowering_period: 'Octubre a Noviembre (Despertar primaveral)',
  ecology:
    'Especie del estrato medio y dosel que prolifera en suelos volcánicos y húmedos, clave para la nidificación y nutrición de aves e insectos polinizadores.',
  references:
    'Donoso, C. (2006). Bosques templados de Chile; Ensayos palinológicos INIA / UACh.',
};

export const DEFAULT_ARRAYAN_TEPA_MONOGRAPH: BotanicalMonograph = {
  slug: 'arrayan_tepa',
  common_name: 'Dosel Siempreverde (Tepa y Arrayán)',
  common_name_en: 'Evergreen Canopy (Tepa & Arrayán)',
  scientific_name: 'Laureliopsis philippiana · Luma apiculata',
  short_description:
    'Resinas balsámicas y arquitectura del bosque profundo austral. Aporta notas alcanforadas, retrogusto fresco y propóleos puros.',
  short_description_en:
    'Balsamic resins and deep austral rainforest structure. Camphoric nuances, fresh finish, and pure protective propolis.',
  full_description:
    'La asociación del dosel y sotobosque húmedo conformada por la tepa (Laureliopsis philippiana, Monimiaceae) y el arrayán (Luma apiculata, Myrtaceae) define el corazón del bosque siempreverde de Chiloé. Sus floraciones y exudados resinosos abastecen a las colmenas de compuestos aromáticos bioactivos que las abejas convierten en propóleos de máxima pureza.',
  sensory_profile:
    'Miel y mielatos de carácter balsámico alcanforado, con matices especiados y un retrogusto fresco muy distintivo. Notas resinosas nobles de bosque húmedo.',
  flowering_period: 'Diciembre a Febrero (Verano templado)',
  ecology:
    'Especies climácicas que retienen humedad atmosférica, regulan el microclima térmico y amortiguan los vientos oceánicos en el archipiélago.',
  references:
    'Villagrán, C. (2002). Historia de los bosques del sur de Chile; Universidad Austral de Chile.',
};

export const DEFAULT_BOTANICAL_MONOGRAPHS: BotanicalMonograph[] = [
  DEFAULT_ULMO_MONOGRAPH,
  DEFAULT_TIACA_MONOGRAPH,
  DEFAULT_QUILLAY_MONOGRAPH,
  DEFAULT_AVELLANO_MONOGRAPH,
  DEFAULT_ARRAYAN_TEPA_MONOGRAPH,
];

export function parseBotanicalMonograph(
  raw: unknown,
  fallbackSlug = 'ulmo',
): BotanicalMonograph {
  const fallback =
    DEFAULT_BOTANICAL_MONOGRAPHS.find((m) => m.slug === fallbackSlug) ??
    DEFAULT_ULMO_MONOGRAPH;

  if (!raw || typeof raw !== 'object') return { ...fallback };
  const r = raw as Record<string, unknown>;
  const slug = asString(r.slug, fallback.slug).trim() || fallback.slug;
  const common_name = asString(r.common_name, fallback.common_name).trim() || fallback.common_name;

  const faqs: B2BFaqItem[] = [];
  if (Array.isArray(r.faqs)) {
    for (const f of r.faqs) {
      const item = parseB2BFaqItem(f);
      if (item) faqs.push(item);
    }
  }

  return {
    slug,
    common_name,
    common_name_en: typeof r.common_name_en === 'string' ? r.common_name_en.trim() : fallback.common_name_en,
    scientific_name: asString(r.scientific_name, fallback.scientific_name).trim(),
    short_description: asString(r.short_description, fallback.short_description).trim(),
    short_description_en: typeof r.short_description_en === 'string' ? r.short_description_en.trim() : fallback.short_description_en,
    full_description: asString(r.full_description, fallback.full_description).trim(),
    full_description_en: typeof r.full_description_en === 'string' ? r.full_description_en.trim() : fallback.full_description_en,
    sensory_profile: asString(r.sensory_profile, fallback.sensory_profile).trim(),
    sensory_profile_en: typeof r.sensory_profile_en === 'string' ? r.sensory_profile_en.trim() : fallback.sensory_profile_en,
    flowering_period: asString(r.flowering_period, fallback.flowering_period).trim(),
    flowering_period_en: typeof r.flowering_period_en === 'string' ? r.flowering_period_en.trim() : fallback.flowering_period_en,
    ecology: asString(r.ecology, fallback.ecology).trim(),
    ecology_en: typeof r.ecology_en === 'string' ? r.ecology_en.trim() : fallback.ecology_en,
    references: typeof r.references === 'string' ? r.references.trim() : fallback.references,
    image_url: typeof r.image_url === 'string' ? r.image_url.trim() : fallback.image_url,
    faqs: faqs.length > 0 ? faqs : fallback.faqs,
  };
}

export function parseBotanicalMonographs(raw: unknown): BotanicalMonograph[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_BOTANICAL_MONOGRAPHS;
  const list: BotanicalMonograph[] = [];
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const itemSlug = typeof (item as Record<string, unknown>).slug === 'string'
        ? String((item as Record<string, unknown>).slug)
        : 'ulmo';
      list.push(parseBotanicalMonograph(item, itemSlug));
    }
  }
  return list.length > 0 ? list : DEFAULT_BOTANICAL_MONOGRAPHS;
}

// ── Experiencias de Origen ──────────────────────────────────────────────────

export type ExperienciasSettings = {
  hero_kicker: string;
  hero_kicker_en?: string;
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_image: string;
  hero_image_opacity?: number;
  hero_cta_label: string;
  hero_cta_label_en?: string;
  hero_cta_href: string;
  hero_secondary_label: string;
  hero_secondary_label_en?: string;
  hero_secondary_href: string;
  flagship_badge: string;
  flagship_badge_en?: string;
  flagship_title: string;
  flagship_title_en?: string;
  flagship_desc: string;
  flagship_desc_en?: string;
  flagship_cta_label: string;
  flagship_cta_label_en?: string;
  flagship_href: string;
  show_flagship_card?: boolean;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_EXPERIENCIAS_SETTINGS: ExperienciasSettings = {
  hero_kicker: 'Latitud 42° 53′ S · Chiloé Insular & Santiago',
  hero_kicker_en: 'Latitude 42° 53′ S · Insular Chiloé & Santiago',
  hero_title: 'Encuentros en el Bosque Austral',
  hero_title_en: 'Encounters in the Austral Forest',
  hero_subtitle:
    'Presencia territorial, silencio y análisis sensorial metódico en el hábitat vivo de la abeja nativa.',
  hero_subtitle_en:
    'Territorial presence, silence and methodical sensory analysis in the native bee living habitat.',
  hero_image: '/assets/editorial/hero-bosque-apertura.jpg',
  hero_image_opacity: 45,
  hero_cta_label: 'Explorar los tres encuentros',
  hero_cta_label_en: 'Explore the three encounters',
  hero_cta_href: '#encuentros',
  hero_secondary_label: 'Solicitar fecha privada',
  hero_secondary_label_en: 'Request private date',
  hero_secondary_href: '#solicitud',
  flagship_badge: 'Insignia',
  flagship_badge_en: 'Flagship',
  flagship_title: 'Degustaciones · Mieles de Chile',
  flagship_title_en: 'Tastings · Honeys of Chile',
  flagship_desc:
    'Cata sensorial metódica de mieles recolectadas a lo largo de Chile, comprendidas bajo nuestra perspectiva. Incluye kit de degustación y rueda sensorial en papel de alta gramaje.',
  flagship_desc_en:
    'Methodical sensory tasting of honeys collected across Chile, understood from our perspective. Includes tasting kit and printed sensory wheel on high-weight paper.',
  flagship_cta_label: 'Ver protocolo de cata',
  flagship_cta_label_en: 'View tasting protocol',
  flagship_href: '/experiencias/degustaciones',
  show_flagship_card: true,
};

export function parseExperienciasSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasSettings {
  const d = DEFAULT_EXPERIENCIAS_SETTINGS;
  if (!raw) return { ...d };
  return {
    hero_kicker: asString(raw.hero_kicker, d.hero_kicker).trim(),
    hero_kicker_en: typeof raw.hero_kicker_en === 'string' ? raw.hero_kicker_en.trim() : d.hero_kicker_en,
    hero_title: asString(raw.hero_title, d.hero_title).trim(),
    hero_title_en: typeof raw.hero_title_en === 'string' ? raw.hero_title_en.trim() : d.hero_title_en,
    hero_subtitle: asString(raw.hero_subtitle, d.hero_subtitle).trim(),
    hero_subtitle_en: typeof raw.hero_subtitle_en === 'string' ? raw.hero_subtitle_en.trim() : d.hero_subtitle_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 45, 0, 100),
    hero_cta_label: asString(raw.hero_cta_label, d.hero_cta_label).trim(),
    hero_cta_label_en: typeof raw.hero_cta_label_en === 'string' ? raw.hero_cta_label_en.trim() : d.hero_cta_label_en,
    hero_cta_href: sanitizeStoreHref(raw.hero_cta_href, d.hero_cta_href) ?? d.hero_cta_href,
    hero_secondary_label: asString(raw.hero_secondary_label, d.hero_secondary_label).trim(),
    hero_secondary_label_en:
      typeof raw.hero_secondary_label_en === 'string' ? raw.hero_secondary_label_en.trim() : d.hero_secondary_label_en,
    hero_secondary_href: sanitizeStoreHref(raw.hero_secondary_href, d.hero_secondary_href) ?? d.hero_secondary_href,
    flagship_badge: asString(raw.flagship_badge, d.flagship_badge).trim(),
    flagship_badge_en: typeof raw.flagship_badge_en === 'string' ? raw.flagship_badge_en.trim() : d.flagship_badge_en,
    flagship_title: asString(raw.flagship_title, d.flagship_title).trim(),
    flagship_title_en: typeof raw.flagship_title_en === 'string' ? raw.flagship_title_en.trim() : d.flagship_title_en,
    flagship_desc: asString(raw.flagship_desc, d.flagship_desc).trim(),
    flagship_desc_en: typeof raw.flagship_desc_en === 'string' ? raw.flagship_desc_en.trim() : d.flagship_desc_en,
    flagship_cta_label: asString(raw.flagship_cta_label, d.flagship_cta_label).trim(),
    flagship_cta_label_en:
      typeof raw.flagship_cta_label_en === 'string' ? raw.flagship_cta_label_en.trim() : d.flagship_cta_label_en,
    flagship_href: sanitizeStoreHref(raw.flagship_href, d.flagship_href) ?? d.flagship_href,
    show_flagship_card: typeof raw.show_flagship_card === 'boolean' ? raw.show_flagship_card : d.show_flagship_card ?? true,
    text_align: parseTextAlign(raw.text_align),
  };
}

export type MovementStepSettings = {
  step: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  elements: string[];
};

export type ExperienceFormatSettings = {
  id: string;
  title: string;
  title_en?: string;
  kicker: string;
  kicker_en?: string;
  capacity: string;
  duration: string;
  context: string;
  summary: string;
  includes: string[];
};

export type FloracionesExperienceSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  edition_note: string;
  edition_note_en?: string;
  hero_image: string;
  hero_image_opacity?: number;
  bio_name: string;
  bio_location: string;
  bio_trajectory_years: number;
  bio_paragraphs: string[];
  bio_metrics: Array<{ value: string; label: string }>;
  movements: MovementStepSettings[];
  formats: ExperienceFormatSettings[];
  protocol_headline: string;
  protocol_description: string;
  protocol_artifact: string;
  faq: B2BFaqItem[];
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS: FloracionesExperienceSettings = {
  kicker: 'Cata Sensorial & Degustación de Autor',
  kicker_en: 'Sensory Tasting & Signature Experience',
  title: 'Cata y Degustación: Floraciones del Bosque Austral',
  title_en: 'Tasting & Sensory Analysis: Austral Forest Blooms',
  subtitle:
    'Análisis sensorial guiado de mieles nativas y relato de origen sobre la supervivencia de la colmena en el archipiélago de Chiloé. Experiencia para empresas y grupos privados conducida por Cristina Miranda.',
  subtitle_en:
    'Guided sensory analysis of native honeys and origin storytelling on colony resilience in the Chiloé archipelago. Experience for companies and private groups conducted by Cristina Miranda.',
  edition_note: 'Edición actual: selección de floraciones nativas de temporada en copas y cucharillas técnicas.',
  hero_image: '/assets/editorial/experiencias.jpg',
  hero_image_opacity: 35,
  bio_name: 'Cristina Miranda',
  bio_location: 'Pureo, Queilén · Archipiélago de Chiloé (km 8560)',
  bio_trajectory_years: 19,
  bio_paragraphs: [
    'Nacida y radicada en la localidad rural de Pureo, comuna de Queilén. Tras años dedicados a la pesca artesanal en los canales chilotes, inició en 2005 la transición hacia la apicultura tras sucesivas crisis en el sector pesquero de la zona.',
    'Sostiene apiarios en un territorio caracterizado por 9 a 10 meses de lluvia al año, humedad constante y vientos del Pacífico sur. Estas condiciones obligan a un manejo apícola riguroso y han favorecido la adaptación de abejas con alta resistencia climática, que pecorean en ventanas acotadas de floración en bosque nativo.',
    'Su trabajo con mieles de ulmo, tiaca, melí y bosque templado lluvioso ha sido parte de muestras del Festival Ñam, Expo Mundo Rural y la red de tiendas Mundo Rural en Santiago. La experiencia no es una demostración teórica: es el relato directo de dos décadas de maestría apícola continua en uno de los puntos más australes del país.',
  ],
  bio_metrics: [
    { value: '19 años', label: 'De trayectoria apícola continua' },
    { value: '9-10 meses', label: 'Lluvia anual en Pureo' },
    { value: 'km 8560', label: 'Ruta W-855, Queilén' },
    { value: '48–72 h', label: 'Despacho de pedidos diferidos' },
  ],
  movements: [
    {
      step: 'I',
      title: 'Cartografía de Floraciones',
      description:
        'Degustación metódica de mieles monoflorales y de bosque nativo. Examen de color en escala visual, comportamiento de fluidez y textura de cristalización.',
      elements: [
        'Copas y cucharillas técnicas de cata',
        'Floraciones nativas de temporada (Ulmo, Tiaca, Melí, Tineo, bosque templado)',
        'Análisis de acidez, aroma y notas botánicas',
      ],
    },
    {
      step: 'II',
      title: 'Invierno Austral en Pureo',
      description:
        'Relato técnico sobre el ciclo biológico de la colmena bajo precipitaciones continuas. Decisiones de reserva de miel, control de humedad y termorregulación en el nido.',
      elements: [
        'Pecoreo en ventanas climáticas reducidas',
        'Adaptación de abejas en el bosque insular',
        'Diferencias entre miel cruda recolectada en origen y miel procesada industrial',
      ],
    },
    {
      step: 'III',
      title: 'Contrapunto Gastronómico',
      description:
        'Maridaje estructurado para contrarrestar la carga de azúcares y evaluar el comportamiento de la miel en presencia de grasas, sal y acidez.',
      elements: [
        'Quesos maduros de guarda de pequeña producción',
        'Pan de masa madre de fermentación prolongada',
        'Chocolate 85% de origen definido',
        'Agua purificada para limpieza sensorial entre muestras',
      ],
    },
    {
      step: 'IV',
      title: 'Registro y Salida Diferida',
      description:
        'Cierre de la sesión mediante registro individual. Cada participante conserva un artefacto físico con el perfil botánico y notas de la sesión.',
      elements: [
        'Tarjeta de registro sensorial en papel de alta gramaje',
        'Código de sesión único para acceso a catálogo de reserva',
        'Despacho diferido en 48–72 horas a domicilio o empresa',
      ],
    },
  ],
  formats: [
    {
      id: 'corporativo',
      title: 'Encuentro Corporativo & Directorios',
      kicker: 'Empresas, retiros de liderazgo y clientes institucionales',
      capacity: '10 a 20 asistentes',
      duration: '90 a 120 minutos',
      context: 'En dependencias del cliente o sala privada seleccionada (Santiago y regiones).',
      summary:
        'Diseñado para directorios, equipos de liderazgo y recepción de clientes. Una sesión rigurosa de apreciación botánica y conversación sobre sistemas vivos y resiliencia territorial.',
      includes: [
        'Conducción completa a cargo de Cristina Miranda y soporte técnico de OYZ',
        'Set completo de copas, cucharillas y vajilla de cata',
        'Floraciones nativas seleccionadas de la edición',
        'Maridaje de contrapunto (quesos de guarda, masa madre, chocolate 85%)',
        'Tarjetas de registro sensorial para cada asistente',
        'Montaje y desmontaje previo y posterior al encuentro',
      ],
    },
    {
      id: 'intimo',
      title: 'Encuentro Íntimo & Residencia',
      kicker: 'Círculos privados y celebraciones de autor',
      capacity: '4 a 8 asistentes',
      duration: '75 a 90 minutos',
      context: 'En residencia particular o locación seleccionada.',
      summary:
        'Formato pausado para grupos reducidos y amantes de la gastronomía de origen. Degustación extendida y diálogo abierto sobre la apicultura austral.',
      includes: [
        'Conducción personal de Cristina Miranda',
        'Muestras técnicas de floraciones de guarda',
        'Maridaje artesanal seleccionado',
        'Bitácora sensorial para cada invitado',
      ],
    },
  ],
  protocol_headline: 'Protocolo de Adquisición Diferida',
  protocol_description:
    'Las creaciones degustadas durante el encuentro no se entregan en el lugar: se despachan directamente desde Chiloé en un plazo de 48 a 72 horas para garantizar la cadena de origen.',
  protocol_artifact: 'Tarjeta de Registro Sensorial y Pasaporte de Origen',
  faq: [
    {
      question: '¿Dónde se realizan las experiencias?',
      answer:
        'Nos desplazamos a las oficinas de tu empresa, residencias privadas o espacios seleccionados tanto en Santiago como en regiones.',
    },
    {
      question: '¿Con cuánta anticipación se debe agendar?',
      answer:
        'Recomendamos al menos 2 semanas de anticipación para coordinar el traslado de Cristina Miranda y el envío de las muestras frescas de la temporada.',
    },
    {
      question: '¿Los participantes pueden adquirir mieles después del encuentro?',
      answer:
        'Sí. Cada asistente recibe una tarjeta con un código privado para ordenar lotes de reserva con entrega a domicilio.',
    },
  ],
};

export function parseFloracionesExperienceSettings(
  raw: Record<string, unknown> | null | undefined,
): FloracionesExperienceSettings {
  const d = DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS;
  if (!raw) return { ...d };

  const parsedMovements: MovementStepSettings[] = [];
  if (Array.isArray(raw.movements)) {
    for (const m of raw.movements) {
      if (m && typeof m === 'object') {
        const mr = m as Record<string, unknown>;
        const title = asString(mr.title, '').trim();
        if (title) {
          parsedMovements.push({
            step: asString(mr.step, 'I').trim(),
            title,
            title_en: typeof mr.title_en === 'string' ? mr.title_en.trim() : undefined,
            description: asString(mr.description, '').trim(),
            description_en: typeof mr.description_en === 'string' ? mr.description_en.trim() : undefined,
            elements: Array.isArray(mr.elements)
              ? mr.elements.map((e) => String(e).trim()).filter(Boolean)
              : [],
          });
        }
      }
    }
  }

  const parsedFormats: ExperienceFormatSettings[] = [];
  if (Array.isArray(raw.formats)) {
    for (const f of raw.formats) {
      if (f && typeof f === 'object') {
        const fr = f as Record<string, unknown>;
        const title = asString(fr.title, '').trim();
        if (title) {
          parsedFormats.push({
            id: asString(fr.id, 'corporativo').trim(),
            title,
            title_en: typeof fr.title_en === 'string' ? fr.title_en.trim() : undefined,
            kicker: asString(fr.kicker, '').trim(),
            kicker_en: typeof fr.kicker_en === 'string' ? fr.kicker_en.trim() : undefined,
            capacity: asString(fr.capacity, '').trim(),
            duration: asString(fr.duration, '').trim(),
            context: asString(fr.context, '').trim(),
            summary: asString(fr.summary, '').trim(),
            includes: Array.isArray(fr.includes)
              ? fr.includes.map((e) => String(e).trim()).filter(Boolean)
              : [],
          });
        }
      }
    }
  }

  const parsedFaq: B2BFaqItem[] = [];
  if (Array.isArray(raw.faq)) {
    for (const f of raw.faq) {
      const item = parseB2BFaqItem(f);
      if (item) parsedFaq.push(item);
    }
  }

  const bioParagraphs: string[] = Array.isArray(raw.bio_paragraphs)
    ? raw.bio_paragraphs.map((p) => String(p).trim()).filter(Boolean)
    : d.bio_paragraphs;

  const bioMetrics: Array<{ value: string; label: string }> = Array.isArray(raw.bio_metrics)
    ? raw.bio_metrics
        .map((bm) => {
          if (bm && typeof bm === 'object') {
            const bmr = bm as Record<string, unknown>;
            return {
              value: asString(bmr.value, '').trim(),
              label: asString(bmr.label, '').trim(),
            };
          }
          return null;
        })
        .filter((bm): bm is { value: string; label: string } => Boolean(bm && bm.value))
    : d.bio_metrics;

  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    edition_note: asString(raw.edition_note, d.edition_note).trim(),
    edition_note_en: typeof raw.edition_note_en === 'string' ? raw.edition_note_en.trim() : d.edition_note_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 35, 0, 100),
    bio_name: asString(raw.bio_name, d.bio_name).trim(),
    bio_location: asString(raw.bio_location, d.bio_location).trim(),
    bio_trajectory_years: asNumber(raw.bio_trajectory_years, d.bio_trajectory_years, 0, 100),
    bio_paragraphs: bioParagraphs.length > 0 ? bioParagraphs : d.bio_paragraphs,
    bio_metrics: bioMetrics.length > 0 ? bioMetrics : d.bio_metrics,
    movements: parsedMovements.length > 0 ? parsedMovements : d.movements,
    formats: parsedFormats.length > 0 ? parsedFormats : d.formats,
    protocol_headline: asString(raw.protocol_headline, d.protocol_headline).trim(),
    protocol_description: asString(raw.protocol_description, d.protocol_description).trim(),
    protocol_artifact: asString(raw.protocol_artifact, d.protocol_artifact).trim(),
    faq: parsedFaq.length > 0 ? parsedFaq : d.faq,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── Trazabilidad QR ────────────────────────────────────────────────────────

export type QrScanSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  search_label: string;
  search_label_en?: string;
  search_placeholder: string;
  search_button_label: string;
  search_button_label_en?: string;
  valid_title: string;
  valid_desc: string;
  invalid_title: string;
  invalid_desc: string;
};

export const DEFAULT_QR_SCAN_SETTINGS: QrScanSettings = {
  title: 'Escáner de Trazabilidad',
  title_en: 'Traceability Scanner',
  subtitle:
    'Escanea el código QR de tu producto para ver su trazabilidad completa desde el apiario hasta tu mesa.',
  subtitle_en:
    'Scan the QR code on your jar to discover its complete traceability from the apiary to your table.',
  search_label: 'Ingresa o escanea el código QR',
  search_label_en: 'Enter or scan QR code',
  search_placeholder: 'Ej: ABC123XYZ',
  search_button_label: 'Escanear',
  search_button_label_en: 'Scan',
  valid_title: 'Trazabilidad de origen íntegra',
  valid_desc: 'Eventos verificados con sello de autenticidad digital certificado.',
  invalid_title: 'Registro de origen alterado',
  invalid_desc: 'El código ingresado no coincide con los registros oficiales verificados del lote.',
};

export function parseQrScanSettings(
  raw: Record<string, unknown> | null | undefined,
): QrScanSettings {
  const d = DEFAULT_QR_SCAN_SETTINGS;
  if (!raw) return { ...d };
  return {
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    search_label: asString(raw.search_label, d.search_label).trim(),
    search_label_en: typeof raw.search_label_en === 'string' ? raw.search_label_en.trim() : d.search_label_en,
    search_placeholder: asString(raw.search_placeholder, d.search_placeholder).trim(),
    search_button_label: asString(raw.search_button_label, d.search_button_label).trim(),
    search_button_label_en:
      typeof raw.search_button_label_en === 'string' ? raw.search_button_label_en.trim() : d.search_button_label_en,
    valid_title: asString(raw.valid_title, d.valid_title).trim(),
    valid_desc: asString(raw.valid_desc, d.valid_desc).trim(),
    invalid_title: asString(raw.invalid_title, d.invalid_title).trim(),
    invalid_desc: asString(raw.invalid_desc, d.invalid_desc).trim(),
  };
}

// ── Experiencias: Predio Pureo (Chiloé) ────────────────────────────────────
export type ExperienciasPureoSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  hero_image: string;
  hero_image_opacity?: number;
  cabana_title: string;
  cabana_title_en?: string;
  cabana_desc: string;
  cabana_desc_en?: string;
  kayak_title: string;
  kayak_title_en?: string;
  kayak_desc: string;
  kayak_desc_en?: string;
  apiturismo_title: string;
  apiturismo_title_en?: string;
  apiturismo_desc: string;
  apiturismo_desc_en?: string;
  logistica_title: string;
  logistica_title_en?: string;
  logistica_text: string;
  logistica_text_en?: string;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_EXPERIENCIAS_PUREO_SETTINGS: ExperienciasPureoSettings = {
  kicker: 'Queilén · Archipiélago de Chiloé · Latitud 42° 53′ S',
  kicker_en: 'Queilén · Chiloé Archipelago · Latitude 42° 53′ S',
  title: 'Inmersión en Predio Pureo',
  title_en: 'Immersion in Pureo Estate',
  subtitle:
    'La experiencia física de habitar el bosque lluvioso templado donde nace nuestra miel cruda: cabaña nativa con fogón a leña, navegación silenciosa en kayak y ronda de colmenas.',
  subtitle_en:
    'The physical experience of inhabiting the temperate rainforest where our raw honey is born: native cabin with wood fire, quiet kayak navigation, and hive inspections.',
  hero_image: '/assets/editorial/experiencias.jpg',
  hero_image_opacity: 30,
  cabana_title: 'Cabaña Nativa',
  cabana_title_en: 'Native Cabin',
  cabana_desc:
    'Construida en maderas nobles recuperadas de Tepa, Coigüe y Ciprés de las Guaitecas. Cuenta con estufa de combustión lenta, ventanales sobre la copa de los árboles y cocina equipada para preparar productos de recolección local.',
  cabana_desc_en:
    'Built from reclaimed native woods of Tepa, Coigüe, and Ciprés de las Guaitecas. Equipped with a wood stove, canopy-view windows, and kitchen for local gatherings.',
  kayak_title: 'Kayak en Esteros',
  kayak_title_en: 'Estuary Kayaking',
  kayak_desc:
    'Acceso directo a los brazos de agua protegidos del estero de Pureo. Navegación en kayak de travesía entre cisnes de cuello negro, huillines y arrayanales inundados. Una perspectiva única del ecotono bosque-mar.',
  kayak_desc_en:
    'Direct access to sheltered waters of the Pureo estuary. Touring kayak navigation among black-necked swans, river otters, and flooded arrayán groves.',
  apiturismo_title: 'Ronda de Colmenas',
  apiturismo_title_en: 'Hive Inspection',
  apiturismo_desc:
    'Acompañamiento a Cristina Miranda en la revisión de apiarios. Equipado con traje de protección integral, descubrirás la arquitectura interior del panal, la danza de pecoreo y degustarás miel virgen tibia recién extraída con espátula.',
  apiturismo_desc_en:
    'Join Cristina Miranda during apiary checks. Wearing a full protective suit, observe comb architecture and taste fresh warm honey straight from unsealed combs.',
  logistica_title: 'Cómo llegar a Pureo',
  logistica_title_en: 'Getting to Pureo',
  logistica_text:
    'Predio Pureo se ubica en la comuna de Queilén, en la costa oriental de la Isla Grande de Chiloé, a 45 minutos al sur de Chonchi y 75 minutos desde el aeródromo de Mocopulli (Castro).',
  logistica_text_en:
    'Predio Pureo is located in Queilén on the eastern coast of Chiloé Island, 45 minutes south of Chonchi and 75 minutes from Mocopulli airport (Castro).',
};

export function parseExperienciasPureoSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasPureoSettings {
  const d = DEFAULT_EXPERIENCIAS_PUREO_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 30, 0, 100),
    cabana_title: asString(raw.cabana_title, d.cabana_title).trim(),
    cabana_title_en: typeof raw.cabana_title_en === 'string' ? raw.cabana_title_en.trim() : d.cabana_title_en,
    cabana_desc: asString(raw.cabana_desc, d.cabana_desc).trim(),
    cabana_desc_en: typeof raw.cabana_desc_en === 'string' ? raw.cabana_desc_en.trim() : d.cabana_desc_en,
    kayak_title: asString(raw.kayak_title, d.kayak_title).trim(),
    kayak_title_en: typeof raw.kayak_title_en === 'string' ? raw.kayak_title_en.trim() : d.kayak_title_en,
    kayak_desc: asString(raw.kayak_desc, d.kayak_desc).trim(),
    kayak_desc_en: typeof raw.kayak_desc_en === 'string' ? raw.kayak_desc_en.trim() : d.kayak_desc_en,
    apiturismo_title: asString(raw.apiturismo_title, d.apiturismo_title).trim(),
    apiturismo_title_en: typeof raw.apiturismo_title_en === 'string' ? raw.apiturismo_title_en.trim() : d.apiturismo_title_en,
    apiturismo_desc: asString(raw.apiturismo_desc, d.apiturismo_desc).trim(),
    apiturismo_desc_en: typeof raw.apiturismo_desc_en === 'string' ? raw.apiturismo_desc_en.trim() : d.apiturismo_desc_en,
    logistica_title: asString(raw.logistica_title, d.logistica_title).trim(),
    logistica_title_en: typeof raw.logistica_title_en === 'string' ? raw.logistica_title_en.trim() : d.logistica_title_en,
    logistica_text: asString(raw.logistica_text, d.logistica_text).trim(),
    logistica_text_en: typeof raw.logistica_text_en === 'string' ? raw.logistica_text_en.trim() : d.logistica_text_en,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── Experiencias: Talleres de Técnica Apícola ──────────────────────────────
export type ExperienciasTalleresSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  hero_image: string;
  hero_image_opacity?: number;
  programa1_title: string;
  programa1_title_en?: string;
  programa1_desc: string;
  programa1_desc_en?: string;
  programa2_title: string;
  programa2_title_en?: string;
  programa2_desc: string;
  programa2_desc_en?: string;
  programa3_title: string;
  programa3_title_en?: string;
  programa3_desc: string;
  programa3_desc_en?: string;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS: ExperienciasTalleresSettings = {
  kicker: 'Técnica & Supervivencia en el Bosque Austral',
  kicker_en: 'Technique & Resilience in the Southern Forest',
  title: 'Talleres de Técnica Apícola',
  title_en: 'Apicultural Technique Workshops',
  subtitle:
    'Encuentros de formación rigurosa en torno al manejo técnico de la colmena, sanidad y adaptación biológica en los ecosistemas templados lluviosos de Chiloé.',
  subtitle_en:
    'Rigorous training sessions exploring colony management, hive health, and biological adaptation in the temperate rainforests of Chiloé.',
  hero_image: '/assets/editorial/experiencias.jpg',
  hero_image_opacity: 25,
  programa1_title: 'Análisis Sensorial de Mieles Crudas',
  programa1_title_en: 'Raw Honey Sensory Evaluation',
  programa1_desc:
    'Calibración de receptores olfativos y gustativos para discernir notas florales, ácidas, minerales y balsámicas en monoflorales de Ulmo, Tiaca, Arrayán y poliflorales de cordillera.',
  programa1_desc_en:
    'Calibration of sensory receptors to identify floral, crisp, mineral, and balsamic notes across Ulmo, Tiaca, Arrayán, and mountain polyfloral honeys.',
  programa2_title: 'Técnica y Manejo Apícola',
  programa2_title_en: 'Apicultural Technique & Colony Management',
  programa2_desc:
    'Fundamentos de la vida en la colmena: castas, comunicación por feromonas, manejo del humo frío, diagnóstico sanitario natural y adaptación a climas hostiles sin jarabes de azúcar.',
  programa2_desc_en:
    'Core hive fundamentals: castes, pheromone communication, cool smoke handling, natural sanitary diagnosis, and climate adaptation without sugar syrups.',
  programa3_title: 'Botánica Melífera & Polen',
  programa3_title_en: 'Melliferous Botany & Pollen',
  programa3_desc:
    'Reconocimiento morfológico de especies nativas (Eucryphia cordifolia, Caldcluvia paniculata, Luma apiculata) y su correlación con los granos de polen observados bajo microscopio óptico.',
  programa3_desc_en:
    'Morphological identification of native forest species and correlation with pollen grains under optical microscopy.',
};

export function parseExperienciasTalleresSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasTalleresSettings {
  const d = DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 25, 0, 100),
    programa1_title: asString(raw.programa1_title, d.programa1_title).trim(),
    programa1_title_en: typeof raw.programa1_title_en === 'string' ? raw.programa1_title_en.trim() : d.programa1_title_en,
    programa1_desc: asString(raw.programa1_desc, d.programa1_desc).trim(),
    programa1_desc_en: typeof raw.programa1_desc_en === 'string' ? raw.programa1_desc_en.trim() : d.programa1_desc_en,
    programa2_title: asString(raw.programa2_title, d.programa2_title).trim(),
    programa2_title_en: typeof raw.programa2_title_en === 'string' ? raw.programa2_title_en.trim() : d.programa2_title_en,
    programa2_desc: asString(raw.programa2_desc, d.programa2_desc).trim(),
    programa2_desc_en: typeof raw.programa2_desc_en === 'string' ? raw.programa2_desc_en.trim() : d.programa2_desc_en,
    programa3_title: asString(raw.programa3_title, d.programa3_title).trim(),
    programa3_title_en: typeof raw.programa3_title_en === 'string' ? raw.programa3_title_en.trim() : d.programa3_title_en,
    programa3_desc: asString(raw.programa3_desc, d.programa3_desc).trim(),
    programa3_desc_en: typeof raw.programa3_desc_en === 'string' ? raw.programa3_desc_en.trim() : d.programa3_desc_en,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── B2B: Hub Matriz (/alianzas) ───────────────────────────────────────────
export type B2BHubSettings = {
  hero_kicker: string;
  hero_kicker_en?: string;
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_image: string;
  hero_image_opacity?: number;
  hero_badge?: string;
  hero_badge_en?: string;
  cta_label: string;
  cta_label_en?: string;
  cta_href: string;
  garantias_kicker: string;
  garantias_kicker_en?: string;
  garantias_title: string;
  garantias_title_en?: string;
  show_garantias?: boolean;
  /** Alineación de los párrafos de la página (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_B2B_HUB_SETTINGS: B2BHubSettings = {
  hero_kicker: 'Canal Mayorista & Colaboraciones',
  hero_kicker_en: 'Wholesale & Commercial Partnerships',
  hero_title: 'El Bosque Austral en tu Espacio',
  hero_title_en: 'The Southern Forest in Your Space',
  hero_subtitle:
    'Miel cruda de bosque nativo de Chiloé, recolectada con trazabilidad verificable por lote y estándar de alta pureza. Formatos diseñados para la hospitalidad, la gastronomía y el comercio consciente.',
  hero_subtitle_en:
    'Raw honey from native Chiloé forests, harvested with verifiable batch traceability and high-purity standards. Formats crafted for hospitality, fine dining, and conscious retail.',
  hero_image: '/images/b2b/hero-cafeterias.jpg',
  hero_image_opacity: 35,
  hero_badge: 'Canal Directo & Formatos de Hospitalidad',
  hero_badge_en: 'Direct Channel & Hospitality Formats',
  cta_label: 'Solicitar catálogo mayorista',
  cta_label_en: 'Request wholesale catalog',
  cta_href: '#solicitud',
  garantias_kicker: 'Garantías del Canal Directo',
  garantias_kicker_en: 'Direct Channel Assurances',
  garantias_title: 'Por qué asociarte con La Obrera y el Zángano',
  garantias_title_en: 'Why Partner with La Obrera y el Zángano',
  show_garantias: true,
};

export function parseB2BHubSettings(
  raw: Record<string, unknown> | null | undefined,
): B2BHubSettings {
  const d = DEFAULT_B2B_HUB_SETTINGS;
  if (!raw) return { ...d };
  return {
    hero_kicker: asString(raw.hero_kicker, d.hero_kicker).trim(),
    hero_kicker_en: typeof raw.hero_kicker_en === 'string' ? raw.hero_kicker_en.trim() : d.hero_kicker_en,
    hero_title: asString(raw.hero_title, d.hero_title).trim(),
    hero_title_en: typeof raw.hero_title_en === 'string' ? raw.hero_title_en.trim() : d.hero_title_en,
    hero_subtitle: asString(raw.hero_subtitle, d.hero_subtitle).trim(),
    hero_subtitle_en: typeof raw.hero_subtitle_en === 'string' ? raw.hero_subtitle_en.trim() : d.hero_subtitle_en,
    hero_image: asString(raw.hero_image, d.hero_image).trim(),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 35, 0, 100),
    hero_badge: asString(raw.hero_badge, d.hero_badge ?? '').trim(),
    hero_badge_en: typeof raw.hero_badge_en === 'string' ? raw.hero_badge_en.trim() : d.hero_badge_en,
    cta_label: asString(raw.cta_label, d.cta_label).trim(),
    cta_label_en: typeof raw.cta_label_en === 'string' ? raw.cta_label_en.trim() : d.cta_label_en,
    cta_href: sanitizeStoreHref(raw.cta_href, d.cta_href) ?? d.cta_href,
    garantias_kicker: asString(raw.garantias_kicker, d.garantias_kicker).trim(),
    garantias_kicker_en: typeof raw.garantias_kicker_en === 'string' ? raw.garantias_kicker_en.trim() : d.garantias_kicker_en,
    garantias_title: asString(raw.garantias_title, d.garantias_title).trim(),
    garantias_title_en: typeof raw.garantias_title_en === 'string' ? raw.garantias_title_en.trim() : d.garantias_title_en,
    show_garantias: typeof raw.show_garantias === 'boolean' ? raw.show_garantias : d.show_garantias ?? true,
    text_align: parseTextAlign(raw.text_align),
  };
}

// ── Bloques Portada: Encuentros & Origen y Alianzas & Negocios ──────────────

export type ExperienciasHomeSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  card1_tag: string;
  card1_tag_en?: string;
  card1_title: string;
  card1_title_en?: string;
  card1_desc: string;
  card1_desc_en?: string;
  card1_cta: string;
  card1_cta_en?: string;
  card1_href: string;
  card2_tag: string;
  card2_tag_en?: string;
  card2_title: string;
  card2_title_en?: string;
  card2_desc: string;
  card2_desc_en?: string;
  card2_cta: string;
  card2_cta_en?: string;
  card2_href: string;
  card3_tag: string;
  card3_tag_en?: string;
  card3_title: string;
  card3_title_en?: string;
  card3_desc: string;
  card3_desc_en?: string;
  card3_cta: string;
  card3_cta_en?: string;
  card3_href: string;
  text_align?: TextAlign;
};

export const DEFAULT_EXPERIENCIAS_HOME_SETTINGS: ExperienciasHomeSettings = {
  kicker: 'Encuentros & Origen',
  kicker_en: 'Forest Encounters',
  title: 'Vive el Bosque en Primera Persona',
  title_en: 'Experience the Native Forest',
  subtitle:
    'Desde estadías y apiturismo vivencial en Predio Pureo (Chiloé) hasta catas sensoriales metódicas en Santiago conducidas por Cristina Miranda.',
  subtitle_en:
    'Stay at our native cabin in Chiloé, navigate quiet fjords by kayak, open hives with our beekeeper, or join an intimate honey tasting in Santiago.',
  card1_tag: 'Chiloé · Origen',
  card1_tag_en: 'Chiloé · Origin',
  card1_title: 'Territorio & Bosque Austral',
  card1_title_en: 'Territory & Austral Forest',
  card1_desc:
    'Cabaña nativa con fogón a leña, navegación en kayak por esteros y ronda técnica de colmenas entre Ulmos centenarios.',
  card1_desc_en:
    'Native timber cabin with wood stove, kayak exploration through quiet fjords, and hive walkthrough among ancient Ulmo trees.',
  card1_cta: 'Conocer estancia',
  card1_cta_en: 'Explore stay',
  card1_href: '/experiencias/territorio',
  card2_tag: 'Santiago & Regiones',
  card2_tag_en: 'Santiago & Regions',
  card2_title: 'Degustaciones · Mieles de Chile',
  card2_title_en: 'Tastings · Honeys of Chile',
  card2_desc:
    'Cata sensorial metódica de mieles recolectadas en Chile, kit de degustación y maridaje de contrapunto para directorios y grupos privados.',
  card2_desc_en:
    'Methodical sensory tasting of honeys collected in Chile, tasting kit, and pairing counterpoint for private circles.',
  card2_cta: 'Ver degustaciones',
  card2_cta_en: 'View tastings',
  card2_href: '/experiencias/degustaciones',
  card3_tag: 'Técnica & Formación',
  card3_tag_en: 'Technique & Training',
  card3_title: 'Talleres de Técnica Apícola',
  card3_title_en: 'Beekeeping Technique Workshops',
  card3_desc:
    'Manejo técnico de la colmena, sanidad y adaptación biológica en el bosque templado lluvioso.',
  card3_desc_en:
    'Technical hive management, bee health, and biological adaptation in the temperate rainforest.',
  card3_cta: 'Ver programas',
  card3_cta_en: 'View workshops',
  card3_href: '/experiencias/talleres',
};

export const EXPERIENCIAS_HOME_SETTINGS_TEMPLATE: ExperienciasHomeSettings = {
  ...DEFAULT_EXPERIENCIAS_HOME_SETTINGS,
};

export function parseExperienciasHomeSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasHomeSettings {
  const d = DEFAULT_EXPERIENCIAS_HOME_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    card1_tag: asString(raw.card1_tag, d.card1_tag).trim(),
    card1_tag_en: typeof raw.card1_tag_en === 'string' ? raw.card1_tag_en.trim() : d.card1_tag_en,
    card1_title: asString(raw.card1_title, d.card1_title).trim(),
    card1_title_en: typeof raw.card1_title_en === 'string' ? raw.card1_title_en.trim() : d.card1_title_en,
    card1_desc: asString(raw.card1_desc, d.card1_desc).trim(),
    card1_desc_en: typeof raw.card1_desc_en === 'string' ? raw.card1_desc_en.trim() : d.card1_desc_en,
    card1_cta: asString(raw.card1_cta, d.card1_cta).trim(),
    card1_cta_en: typeof raw.card1_cta_en === 'string' ? raw.card1_cta_en.trim() : d.card1_cta_en,
    card1_href: sanitizeStoreHref(raw.card1_href, d.card1_href) ?? d.card1_href,
    card2_tag: asString(raw.card2_tag, d.card2_tag).trim(),
    card2_tag_en: typeof raw.card2_tag_en === 'string' ? raw.card2_tag_en.trim() : d.card2_tag_en,
    card2_title: asString(raw.card2_title, d.card2_title).trim(),
    card2_title_en: typeof raw.card2_title_en === 'string' ? raw.card2_title_en.trim() : d.card2_title_en,
    card2_desc: asString(raw.card2_desc, d.card2_desc).trim(),
    card2_desc_en: typeof raw.card2_desc_en === 'string' ? raw.card2_desc_en.trim() : d.card2_desc_en,
    card2_cta: asString(raw.card2_cta, d.card2_cta).trim(),
    card2_cta_en: typeof raw.card2_cta_en === 'string' ? raw.card2_cta_en.trim() : d.card2_cta_en,
    card2_href: sanitizeStoreHref(raw.card2_href, d.card2_href) ?? d.card2_href,
    card3_tag: asString(raw.card3_tag, d.card3_tag).trim(),
    card3_tag_en: typeof raw.card3_tag_en === 'string' ? raw.card3_tag_en.trim() : d.card3_tag_en,
    card3_title: asString(raw.card3_title, d.card3_title).trim(),
    card3_title_en: typeof raw.card3_title_en === 'string' ? raw.card3_title_en.trim() : d.card3_title_en,
    card3_desc: asString(raw.card3_desc, d.card3_desc).trim(),
    card3_desc_en: typeof raw.card3_desc_en === 'string' ? raw.card3_desc_en.trim() : d.card3_desc_en,
    card3_cta: asString(raw.card3_cta, d.card3_cta).trim(),
    card3_cta_en: typeof raw.card3_cta_en === 'string' ? raw.card3_cta_en.trim() : d.card3_cta_en,
    card3_href: sanitizeStoreHref(raw.card3_href, d.card3_href) ?? d.card3_href,
    text_align: parseTextAlign(raw.text_align),
  };
}

export type AlianzasHomeSettings = {
  kicker: string;
  kicker_en?: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  tag1_label: string;
  tag1_label_en?: string;
  tag1_href: string;
  tag2_label: string;
  tag2_label_en?: string;
  tag2_href: string;
  tag3_label: string;
  tag3_label_en?: string;
  tag3_href: string;
  tag4_label: string;
  tag4_label_en?: string;
  tag4_href: string;
  cta_kicker: string;
  cta_kicker_en?: string;
  cta_button_label: string;
  cta_button_label_en?: string;
  cta_button_href: string;
  text_align?: TextAlign;
};

export const DEFAULT_ALIANZAS_HOME_SETTINGS: AlianzasHomeSettings = {
  kicker: 'Alianzas & Negocios',
  kicker_en: 'Wholesale & Partnerships',
  title: 'Lleva la Miel Nativa de Chiloé a tu Espacio',
  title_en: 'Bring Native Chiloé Honey to Your Space',
  subtitle:
    'Formatos para cafeterías de especialidad (sachets monodosis), hoteles (frascos de cortesía 40g), tiendas gourmet y revendedores autorizados. Facturación formal y despacho garantizado a todo Chile.',
  subtitle_en:
    'Formats for specialty coffee shops (single-serve sachets), hotels (40g courtesy jars), gourmet shops, and authorized resellers. Formal invoicing and nationwide delivery across Chile.',
  tag1_label: 'Cafeterías',
  tag1_label_en: 'Coffee Shops',
  tag1_href: '/alianzas/cafeterias',
  tag2_label: 'Hoteles',
  tag2_label_en: 'Hotels',
  tag2_href: '/alianzas/hoteles',
  tag3_label: 'Tiendas Gourmet',
  tag3_label_en: 'Gourmet Shops',
  tag3_href: '/alianzas/tiendas-gourmet',
  tag4_label: 'Revendedores',
  tag4_label_en: 'Resellers',
  tag4_href: '/alianzas/revendedores',
  cta_kicker: 'Catálogo mayorista & condiciones directas',
  cta_kicker_en: 'Wholesale catalog & direct terms',
  cta_button_label: 'Portal Alianzas B2B',
  cta_button_label_en: 'B2B Partnerships Portal',
  cta_button_href: '/alianzas',
};

export const ALIANZAS_HOME_SETTINGS_TEMPLATE: AlianzasHomeSettings = {
  ...DEFAULT_ALIANZAS_HOME_SETTINGS,
};

export function parseAlianzasHomeSettings(
  raw: Record<string, unknown> | null | undefined,
): AlianzasHomeSettings {
  const d = DEFAULT_ALIANZAS_HOME_SETTINGS;
  if (!raw) return { ...d };
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    tag1_label: asString(raw.tag1_label, d.tag1_label).trim(),
    tag1_label_en: typeof raw.tag1_label_en === 'string' ? raw.tag1_label_en.trim() : d.tag1_label_en,
    tag1_href: sanitizeStoreHref(raw.tag1_href, d.tag1_href) ?? d.tag1_href,
    tag2_label: asString(raw.tag2_label, d.tag2_label).trim(),
    tag2_label_en: typeof raw.tag2_label_en === 'string' ? raw.tag2_label_en.trim() : d.tag2_label_en,
    tag2_href: sanitizeStoreHref(raw.tag2_href, d.tag2_href) ?? d.tag2_href,
    tag3_label: asString(raw.tag3_label, d.tag3_label).trim(),
    tag3_label_en: typeof raw.tag3_label_en === 'string' ? raw.tag3_label_en.trim() : d.tag3_label_en,
    tag3_href: sanitizeStoreHref(raw.tag3_href, d.tag3_href) ?? d.tag3_href,
    tag4_label: asString(raw.tag4_label, d.tag4_label).trim(),
    tag4_label_en: typeof raw.tag4_label_en === 'string' ? raw.tag4_label_en.trim() : d.tag4_label_en,
    tag4_href: sanitizeStoreHref(raw.tag4_href, d.tag4_href) ?? d.tag4_href,
    cta_kicker: asString(raw.cta_kicker, d.cta_kicker).trim(),
    cta_kicker_en: typeof raw.cta_kicker_en === 'string' ? raw.cta_kicker_en.trim() : d.cta_kicker_en,
    cta_button_label: asString(raw.cta_button_label, d.cta_button_label).trim(),
    cta_button_label_en:
      typeof raw.cta_button_label_en === 'string' ? raw.cta_button_label_en.trim() : d.cta_button_label_en,
    cta_button_href: sanitizeStoreHref(raw.cta_button_href, d.cta_button_href) ?? d.cta_button_href,
    text_align: parseTextAlign(raw.text_align),
  };
}

export const B2B_CAFETERIAS_TEMPLATE = { ...DEFAULT_B2B_CAFETERIAS };
export const B2B_HOTELES_TEMPLATE = { ...DEFAULT_B2B_HOTELES };
export const B2B_TIENDAS_GOURMET_TEMPLATE = { ...DEFAULT_B2B_TIENDAS_GOURMET };
export const B2B_FERIAS_TEMPLATE = { ...DEFAULT_B2B_FERIAS };
export const B2B_REVENDEDORES_TEMPLATE = { ...DEFAULT_B2B_REVENDEDORES };
export const B2B_HUB_SETTINGS_TEMPLATE = { ...DEFAULT_B2B_HUB_SETTINGS };
export const ORIGEN_SETTINGS_TEMPLATE = { ...DEFAULT_ORIGEN_SETTINGS };
export const BOTANICAL_MONOGRAPH_TEMPLATE = { ...DEFAULT_ULMO_MONOGRAPH };
export const EXPERIENCIAS_SETTINGS_TEMPLATE = { ...DEFAULT_EXPERIENCIAS_SETTINGS };
export const EXPERIENCIAS_PUREO_SETTINGS_TEMPLATE = { ...DEFAULT_EXPERIENCIAS_PUREO_SETTINGS };
export const EXPERIENCIAS_TALLERES_SETTINGS_TEMPLATE = { ...DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS };
export const FLORACIONES_EXPERIENCE_TEMPLATE = { ...DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS };
export const QR_SCAN_SETTINGS_TEMPLATE = { ...DEFAULT_QR_SCAN_SETTINGS };


// ── Bundle completo (Ola 1 + Ola 2) ────────────────────────────────────────

export type StoreChromeConfig = StoreChromeConfigOla1 & {
  landing: LandingLayoutSettings;
  catalog: CatalogSettings;
  pdp: PdpSettings;
  seo: SeoDefaults;
  contact: ContactSettings;
  checkout: CheckoutSettings;
  cart: CartSettings;
  campaignBanners: CampaignBanner[];
  typography: TypographySettings;
  seasonal: SeasonalSettings;
  collections: CollectionsSettings;
  galeria: GaleriaSettings;
  nosotros: NosotrosSettings;
  mediaSettings: MediaSettings;
  ciencia: CienciaSettings;
  auth: AuthSettings;
  reservaAnual: ReservaAnualSettings;
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
  checkout: { ...DEFAULT_CHECKOUT_SETTINGS },
  cart: { ...DEFAULT_CART_SETTINGS },
  campaignBanners: [],
  typography: { ...DEFAULT_TYPOGRAPHY_SETTINGS },
  seasonal: {
    primavera: { ...DEFAULT_SEASONAL_SETTINGS.primavera },
    verano: { ...DEFAULT_SEASONAL_SETTINGS.verano },
    otono: { ...DEFAULT_SEASONAL_SETTINGS.otono },
    invierno: { ...DEFAULT_SEASONAL_SETTINGS.invierno },
  },
  collections: { ...DEFAULT_COLLECTIONS_SETTINGS },
  galeria: { ...DEFAULT_GALERIA_SETTINGS },
  nosotros: { ...DEFAULT_NOSOTROS_SETTINGS },
  mediaSettings: { ...DEFAULT_MEDIA_SETTINGS },
  ciencia: { ...DEFAULT_CIENCIA_SETTINGS },
  auth: { ...DEFAULT_AUTH_SETTINGS },
  reservaAnual: { ...DEFAULT_RESERVA_ANUAL_SETTINGS },
};
