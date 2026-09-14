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
  default_theme: 'system',
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
    'Recibe alertas de nuevas floraciones, asignaciones de recolección y novedades de custodia del Predio Pureo.',
  newsletter_desc_en: 'Receive alerts for new blooms, harvest allocations and custody updates from Predio Pureo.',
  newsletter_placeholder: 'Ingresa tu correo para recibir asignaciones',
  newsletter_placeholder_en: 'Enter your email for harvest allocations',
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
  return {
    logo_url: logoUrl,
    logo_footer_url: typeof raw.logo_footer_url === 'string' ? raw.logo_footer_url : d.logo_footer_url,
    favicon_url: asString(raw.favicon_url, d.favicon_url) || d.favicon_url,
    og_image_url: typeof raw.og_image_url === 'string' ? raw.og_image_url : d.og_image_url,
    logo_height_px: asNumber(raw.logo_height_px, d.logo_height_px, 16, 256),
    logo_max_width_px: asNumber(raw.logo_max_width_px, d.logo_max_width_px, 0, 800),
    logo_footer_height_px: asNumber(raw.logo_footer_height_px, d.logo_footer_height_px, 16, 256),
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
  return {
    enabled: asBool(raw.enabled, d.enabled),
    interval_ms: asNumber(raw.interval_ms, d.interval_ms, 2000, 20000),
    height_mobile_px: asNumber(raw.height_mobile_px, d.height_mobile_px, 44, 72),
    height_desktop_px: asNumber(raw.height_desktop_px, d.height_desktop_px, 44, 80),
    dismissible: asBool(raw.dismissible, d.dismissible),
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
  | 'map';

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
    desc: 'Dosis individuales de 15 g de crema pura de bosque nativo para llevar o acompañar preparaciones.',
    href: '/catalogo?q=Sachet',
  },
  {
    kicker: 'Frascos Medios',
    title: 'Tesoros del Colmenar',
    desc: 'Formato de mesa para uso cotidiano. Miel cruda de floración viva extraída en frío.',
    href: '/catalogo?q=Frasco',
  },
  {
    kicker: 'Frascos Grandes',
    title: 'Generosidad de la Selva',
    desc: 'Formato de reserva para quienes integran la miel de origen como sustituto noble del azúcar industrial.',
    href: '/catalogo?q=Frasco',
  },
  {
    kicker: 'Miel Virgen',
    title: 'Panal de Bosque',
    desc: 'Miel virgen en panal, libre de intervenciones. Néctar crudo sellado por las abejas directamente en la colmena.',
    href: '/catalogo?q=Miel',
  },
  {
    kicker: 'Cajas de Sachets',
    title: 'Cofres del Enjambre',
    desc: 'Estuche de 20 sachets de 15 g. Crema pura para degustación, viajes y mesa.',
    href: '/catalogo?q=Sachet',
  },
  {
    kicker: 'Suscripciones',
    title: 'Legado del Bosque',
    desc: 'Programa de custodia y asignación de recolecciones estacionales para miembros acreditados.',
    href: '/catalogo?q=Suscripcion',
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
  identidad: 'Identidad',
  conservation: 'Impacto',
  collections: 'Grid colecciones',
  media: 'Media',
  products: 'Creaciones',
  video: 'Video',
  club_legado: 'Club Legado',
  map: 'Mapa',
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
  stat3_label: 'Colmenas custodiadas',
  stat3_label_en: 'Hives custodated',
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
};

export const DEFAULT_CLUB_LEGADO_SETTINGS: ClubLegadoSettings = {
  kicker: 'Club Legado del Bosque',
  kicker_en: 'Forest Legacy Club',
  title: 'Custodia y recolecciones de temporada',
  title_en: 'Seasonal custody and harvests',
  subtitle:
    'Como miembro acreditado, accede a las floraciones limitadas del Predio Pureo: ulmo, tiaca y quillay con trazabilidad de colmena y cata de origen.',
  subtitle_en:
    'As an accredited member, access limited blooms from Predio Pureo: ulmo, tiaca and quillay with hive traceability and origin tasting.',
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
  };
}

// ── Club Page Settings (/club-legado-del-bosque) ───────────────────────────

export type ClubPageSettings = {
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
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
};

export const DEFAULT_CLUB_PAGE_SETTINGS: ClubPageSettings = {
  hero_title: 'Club Legado del Bosque',
  hero_title_en: 'Forest Legacy Club',
  hero_subtitle:
    'Al registrarte en la tienda formas parte del Club Legado del Bosque. Desde aquí accedes a suscripciones de reposición recurrente y reservas anticipadas de las próximas recolecciones de miel nativa.',
  hero_subtitle_en:
    'By registering in the store you become part of the Forest Legacy Club. From here you can access replenishment subscriptions and advance reservations for upcoming native honey harvests.',
  how_it_works_title: 'Cómo funciona',
  how_it_works_title_en: 'How it works',
  step1_text:
    'Al registrarte en la tienda formas parte activa del Club Legado del Bosque como guardián acreditado.',
  step1_text_en:
    'By registering in the store you actively join the Forest Legacy Club as an accredited guardian.',
  step2_text:
    'Eliges tu suscripción de reposición recurrente o reservas tu cupo para las próximas recolecciones de temporada (Ulmo, Tiaca, Quillay o selección trimestral).',
  step2_text_en:
    'Choose your recurring replenishment subscription or reserve your spot for the next seasonal harvests (Ulmo, Tiaca, Quillay or quarterly selection).',
  step3_text:
    'En la ventana de recolección preparamos tu entrega con el lote directo del Predio Pureo, acompañado de pasaporte de origen y trazabilidad de colmena.',
  step3_text_en:
    'During the harvest window we prepare your delivery with a batch directly from Predio Pureo, accompanied by origin passport and hive traceability.',
  step4_text:
    'Puedes pagar como reserva única o activar tu suscripción recurrente para despreocuparte.',
  step4_text_en:
    'You can pay as a single reservation or activate your recurring subscription for peace of mind.',
  custodia_badge: 'Custodia Territorial Activa',
  custodia_badge_en: 'Active Territorial Custody',
  custodia_title: 'Cada membresía financia el bosque que nos sobrevivirá',
  custodia_title_en: 'Every membership funds the forest that will outlive us',
  custodia_text:
    'Al suscribirte a una recolección del Club, tu aporte financia directamente la siembra, cuidado y censo de árboles nativos en los predios apícolas de Chiloé. La apicultura no extrae: devuelve vida al bosque valdiviano.',
  custodia_text_en:
    'By subscribing to a Club harvest, your contribution directly finances planting, tending, and census of native trees in Chiloé apiary sectors. Beekeeping does not extract: it restores life to the Valdivian rainforest.',
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
  return {
    hero_title: es('hero_title', d.hero_title),
    hero_title_en: en('hero_title_en', d.hero_title_en),
    hero_subtitle: es('hero_subtitle', d.hero_subtitle),
    hero_subtitle_en: en('hero_subtitle_en', d.hero_subtitle_en),
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
  seo_title?: string;
  seo_title_en?: string;
  seo_description?: string;
  seo_description_en?: string;
};

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
    { value: '100%', label: 'Origen y trazabilidad oficial' },
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
      question: 'Mix recomendado',
      answer:
        'Una barra no necesita más productos, necesita mejores gestos. Definimos contigo el mix, la frecuencia de abastecimiento y, para locales seleccionados, una edición de casa o trazabilidad QR.',
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
      title: 'Conservación en marcha',
      description:
        'Tu compra apoya un proyecto real en desarrollo. Sostenemos la trazabilidad forestal y el censo de árboles nativos, para pronto poder entregarte reportes exactos de tu impacto.',
    },
  ],
  stats: [
    { value: '25 g', label: 'Amenity de origen' },
    { value: '100%', label: 'Recolección trazable SAG' },
    { value: '4 variedades', label: 'Floraciones de Chiloé' },
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
      title: 'Conservación conjunta',
      desc: 'Despachos recurrentes. Tu hotel se convierte en un actor clave financiando nuestro proyecto de trazabilidad forestal en desarrollo.',
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
      question: '¿Tienen reportes de impacto ambiental o huella de carbono?',
      answer:
        'Toda nuestra trazabilidad forestal está activa. Realizamos conteo y censo de árboles nativos paso a paso para respaldar la biodiversidad del bosque.',
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
  value_props: [
    {
      icon: 'Shield',
      title: 'Trazabilidad completa',
      description:
        'Cada frasco lleva número de lote y origen. Tu cliente sabe exactamente qué está comprando y apoya el comercio justo.',
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
    { value: '100%', label: 'Pura sin aditivos' },
    { value: 'SAG', label: 'Certificación sanitaria oficial' },
    { value: '5 km', label: 'Radio de exclusividad territorial' },
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
    { value: '1 display', label: 'Kit de exhibición de mesón' },
    { value: '1 QR', label: 'Acceso a pasaporte digital' },
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
      question: '¿Qué recomiendan para una feria?',
      answer:
        'Sin duda los mini frascos de 25g con tapa dorada. Llaman la atención inmediatamente, tienen un precio accesible para la compra por impulso y permiten a la gente probar y regalar la marca.',
    },
    {
      question: '¿Cómo uso el sistema QR en una feria?',
      answer:
        'Colocas el QR de tu local en el stand. Quienes prueban la miel lo escanean para registrar su opinión y conocer el origen.',
    },
  ],
  seo_title: 'Miel para Ferias y Eventos · La Obrera y el Zángano',
  seo_description:
    'Venta directa de miel cruda en ferias. Mini frascos de 25g ideales para impulso, catas digitales en stand y bonificaciones de stock.',
};

export const DEFAULT_B2B_REVENDEDORES: B2BSegmentContentSettings = {
  slug: 'revendedores',
  tipo: 'otro',
  kicker: 'Programa Revendedores',
  kicker_en: 'Reseller Program',
  headline: 'Tu micro-negocio de miel del bosque',
  headline_en: 'Your native forest honey micro-business',
  subheadline:
    'Distribuye miel cruda de Chiloé con catálogo directo y trazabilidad de origen. Sin barreras de entrada obligatorias, con reposición preferente y respaldo de marca en cada entrega.',
  subheadline_en:
    'Distribute raw honey from Chiloé with direct catalog and origin traceability. Zero mandatory barriers, with preferred replenishment and brand backing.',
  hero_image: '/images/b2b/hero-revendedores.jpg',
  suggested_products_copy:
    'Nuestros revendedores suelen tener gran éxito armando packs de regalo con los mini frascos de 25g, además de abastecer hogares con los frascos de 500g.',
  cta_text: 'Comenzar ahora',
  cta_text_en: 'Start now',
  cta_href: '#registro',
  value_props: [
    {
      icon: 'TrendingUp',
      title: 'Bonus de Recompra Rápida',
      description:
        'Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de 30 días, desbloqueas rebajas automáticas y producto bonificado.',
    },
    {
      icon: 'Users',
      title: 'Fidelización de TUS clientes',
      description:
        'Tus clientes escanean tu código personal, ganan sellos y se fidelizan a ti. Nosotros proveemos el software de recompensas sin costo para ti.',
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
    { value: '100%', label: 'Margen comercial directo' },
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
      desc: 'Ofrece los frascos (25g, 150g, 500g) y haz que tus clientes escaneen tu QR para sumar puntos contigo.',
    },
    {
      step: '03',
      title: 'Acelera',
      desc: 'Haz pedidos de reposición rápidos para cobrar el "Bonus de Recompra Rápida" y multiplicar tu margen.',
    },
  ],
  faq: [
    {
      question: '¿Cómo funciona el Bonus de Recompra Rápida?',
      answer:
        'El sistema mide el tiempo entre tus pedidos. Si rotas el inventario rápidamente y vuelves a pedir dentro del umbral establecido, el algoritmo automáticamente te asigna un rebate o producto de cortesía.',
    },
    {
      question: '¿Cómo mis clientes acumulan puntos conmigo?',
      answer:
        'Te damos un código único de Revendedor. Cuando le entregas un frasco a un cliente, ellos lo escanean con su teléfono, evalúan la miel y ganan sellos.',
    },
    {
      question: '¿Qué incluye el Pack Digital?',
      answer:
        'Al registrarte, descargas un paquete con fotografías profesionales de los frascos, textos de venta probados y gráficos para redes sociales.',
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
    seo_title: asString(raw.seo_title, d.seo_title ?? '').trim() || d.seo_title,
    seo_title_en: typeof raw.seo_title_en === 'string' ? raw.seo_title_en.trim() : d.seo_title_en,
    seo_description: asString(raw.seo_description, d.seo_description ?? '').trim() || d.seo_description,
    seo_description_en:
      typeof raw.seo_description_en === 'string' ? raw.seo_description_en.trim() : d.seo_description_en,
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

export const DEFAULT_BOTANICAL_MONOGRAPHS: BotanicalMonograph[] = [DEFAULT_ULMO_MONOGRAPH];

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

// ── Experiencias Bioculturales ─────────────────────────────────────────────

export type ExperienciasSettings = {
  hero_kicker: string;
  hero_kicker_en?: string;
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_image: string;
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
};

export const DEFAULT_EXPERIENCIAS_SETTINGS: ExperienciasSettings = {
  hero_kicker: 'Programa de Experiencias',
  hero_kicker_en: 'Experience Program',
  hero_title: 'Encuentros en torno al origen apícola',
  hero_title_en: 'Gatherings around beekeeping origin',
  hero_subtitle:
    'Sesiones a puerta cerrada diseñadas para directorios, círculos privados y gastronomía de autor. Conducidas personalmente por apicultores de Pureo, Chiloé.',
  hero_subtitle_en:
    'Private sessions designed for boards, private circles and culinary creators. Personally led by beekeepers from Pureo, Chiloé.',
  hero_image: '/assets/editorial/experiencias.jpg',
  hero_cta_label: 'Ver sesión insignia: Floraciones',
  hero_cta_label_en: 'Explore flagship session: Blooms',
  hero_cta_href: '/experiencias/floraciones',
  hero_secondary_label: 'Solicitar propuesta privada',
  hero_secondary_label_en: 'Request private proposal',
  hero_secondary_href: '#solicitud',
  flagship_badge: 'Sesión Insignia',
  flagship_badge_en: 'Flagship Session',
  flagship_title: 'Cata y Degustación: Floraciones del Bosque Austral',
  flagship_title_en: 'Tasting & Origin Analysis: Austral Forest Blooms',
  flagship_desc:
    'Análisis sensorial guiado de mieles nativas y relato biocultural sobre la supervivencia de la colmena en el archipiélago de Chiloé. Conducido por Cristina Miranda.',
  flagship_desc_en:
    'Guided sensory analysis of native honeys and biocultural narrative on colony resilience in the Chiloé archipelago. Conducted by Cristina Miranda.',
  flagship_cta_label: 'Ver experiencia completa',
  flagship_cta_label_en: 'View complete experience',
  flagship_href: '/experiencias/floraciones',
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
};

export const DEFAULT_FLORACIONES_EXPERIENCE_SETTINGS: FloracionesExperienceSettings = {
  kicker: 'Cata Sensorial & Degustación de Autor',
  kicker_en: 'Sensory Tasting & Signature Experience',
  title: 'Cata y Degustación: Floraciones del Bosque Austral',
  title_en: 'Tasting & Sensory Analysis: Austral Forest Blooms',
  subtitle:
    'Análisis sensorial guiado de mieles nativas y relato biocultural sobre la supervivencia de la colmena en el archipiélago de Chiloé. Experiencia para empresas y grupos privados conducida por Cristina Miranda.',
  subtitle_en:
    'Guided sensory analysis of native honeys and biocultural storytelling on colony resilience in the Chiloé archipelago. Experience for companies and private groups conducted by Cristina Miranda.',
  edition_note: 'Edición actual: selección de floraciones nativas de temporada en copas y cucharillas técnicas.',
  hero_image: '/assets/editorial/experiencias.jpg',
  bio_name: 'Cristina Miranda',
  bio_location: 'Pureo, Queilén · Archipiélago de Chiloé (km 8560)',
  bio_trajectory_years: 19,
  bio_paragraphs: [
    'Nacida y radicada en la localidad rural de Pureo, comuna de Queilén. Tras años dedicados a la pesca artesanal en los canales chilotes, inició en 2005 la transición hacia la apicultura tras sucesivas crisis en el sector pesquero de la zona.',
    'Sostiene apiarios en un territorio caracterizado por 9 a 10 meses de lluvia al año, humedad constante y vientos del Pacífico sur. Estas condiciones obligan a un manejo apícola riguroso y han favorecido la adaptación de abejas con alta resistencia climática, que pecorean en ventanas acotadas de floración en bosque nativo.',
    'Su trabajo con mieles de ulmo, tiaca, melí y bosque templado lluvioso ha sido parte de muestras del Festival Ñam, Expo Mundo Rural y la red de tiendas Mundo Rural en Santiago. La experiencia no es una demostración teórica: es el relato directo de dos décadas de oficio apícola continuo en uno de los puntos más australes del país.',
  ],
  bio_metrics: [
    { value: '19 años', label: 'De oficio apícola continuo' },
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
  valid_title: 'Cadena de custodia íntegra',
  valid_desc: 'Eventos verificados con sello de autenticidad digital certificado.',
  invalid_title: 'Cadena de custodia alterada',
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

export const B2B_CAFETERIAS_TEMPLATE = { ...DEFAULT_B2B_CAFETERIAS };
export const B2B_HOTELES_TEMPLATE = { ...DEFAULT_B2B_HOTELES };
export const B2B_TIENDAS_GOURMET_TEMPLATE = { ...DEFAULT_B2B_TIENDAS_GOURMET };
export const B2B_FERIAS_TEMPLATE = { ...DEFAULT_B2B_FERIAS };
export const B2B_REVENDEDORES_TEMPLATE = { ...DEFAULT_B2B_REVENDEDORES };
export const ORIGEN_SETTINGS_TEMPLATE = { ...DEFAULT_ORIGEN_SETTINGS };
export const BOTANICAL_MONOGRAPH_TEMPLATE = { ...DEFAULT_ULMO_MONOGRAPH };
export const EXPERIENCIAS_SETTINGS_TEMPLATE = { ...DEFAULT_EXPERIENCIAS_SETTINGS };
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
