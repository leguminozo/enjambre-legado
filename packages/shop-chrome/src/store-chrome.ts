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
  grain_intensity: 0.6,
  border_radius: 'sm',
  force_dark_public: true,
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
  { text: 'Hecho con lentitud. Ritmo de la materia.', text_en: "Handmade. Nature's pace" },
  { text: 'Cada gota regenera bosque nativo', text_en: 'Every drop regenerates native forest' },
  { text: 'Nuestra miel no es producto, es legado', text_en: 'Our honey is not a product — it is legacy' },
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
  /** Logotipo dedicado para el shell de perfil / Mi Legado / cliente (compatibilidad legacy). Si está vacío, hereda logo_url de cabecera. */
  logo_perfil_url?: string;
  /** Logotipo dedicado para el perfil en modo oscuro. Si está vacío, hereda logo_perfil_url o logo_url de cabecera. */
  logo_perfil_dark_url?: string;
  /** Logotipo dedicado para el perfil en modo claro. Si está vacío, hereda logo_perfil_dark_url o logo_url de cabecera. */
  logo_perfil_light_url?: string;
  /** Altura del logo de perfil en píxeles (px). Default 96. */
  logo_perfil_height_px?: number;
  /** Display height in footer (px) — legacy/fallback. */
  logo_footer_height_px: number;
  /** Display height in footer on mobile screens (px). Default 36. */
  logo_footer_height_mobile_px?: number;
  /** Display height in footer on desktop screens (px). Default 48. */
  logo_footer_height_desktop_px?: number;
  /** Max width in footer (px); 0 o ausente = 280. */
  logo_footer_max_width_px?: number;
};

export const DEFAULT_BRAND_ASSETS: BrandAssets = {
  brand_name: 'Enjambre Legado',
  brand_tagline: 'Bosque Nativo de Chiloé',
  brand_name_size_px: 16,
  brand_name_size_mobile_px: 11,
  brand_name_size_desktop_px: 16,
  brand_tagline_show_mobile: false,
  brand_tagline_show_desktop: true,
  brand_tagline_size_px: 10,
  brand_tagline_size_mobile_px: 6,
  brand_tagline_size_desktop_px: 10,
  show_logo_header: true,
  logo_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/c7fddd33-3601-4093-b9cd-957ee28f7f98.png',
  logo_perfil_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/0afbcc2a-23f4-43eb-b234-31c98fcf6164.png',
  logo_perfil_dark_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/0afbcc2a-23f4-43eb-b234-31c98fcf6164.png',
  logo_perfil_light_url: '',
  logo_perfil_height_px: 96,
  logo_footer_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/e3cac2a1-9cb1-4317-bd39-2c86d3e21026.png',
  favicon_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/7dd304c2-2ce6-4c35-a97f-8da72174a25e.png',
  og_image_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/brand_assets/f6a65468-d059-4d26-96c3-e5094ce3bd94.webp',
  logo_height_px: 135,
  logo_height_mobile_px: 110,
  logo_height_desktop_px: 135,
  logo_max_width_px: 0,
  logo_footer_height_px: 190,
  logo_footer_height_mobile_px: 160,
  logo_footer_height_desktop_px: 190,
  logo_footer_max_width_px: 0,
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
    logo_perfil_url:
      typeof raw.logo_perfil_dark_url === 'string'
        ? raw.logo_perfil_dark_url
        : typeof raw.logo_perfil_url === 'string'
          ? raw.logo_perfil_url
          : (d.logo_perfil_dark_url ?? d.logo_perfil_url ?? ''),
    logo_perfil_dark_url:
      typeof raw.logo_perfil_dark_url === 'string'
        ? raw.logo_perfil_dark_url
        : typeof raw.logo_perfil_url === 'string'
          ? raw.logo_perfil_url
          : (d.logo_perfil_dark_url ?? d.logo_perfil_url ?? ''),
    logo_perfil_light_url:
      typeof raw.logo_perfil_light_url === 'string' ? raw.logo_perfil_light_url : (d.logo_perfil_light_url ?? ''),
    logo_perfil_height_px: asNumber(raw.logo_perfil_height_px, d.logo_perfil_height_px ?? 96, 16, 120),
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
    logo_footer_max_width_px: asNumber(raw.logo_footer_max_width_px, d.logo_footer_max_width_px ?? 280, 0, 800),
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
  /** Escala específica para el título del hero (0.85 a 1.6, default 1.0) */
  hero_title_scale?: number;
  /** Escala específica para el subtítulo del hero (0.85 a 1.4, default 1.0) */
  hero_subtitle_scale?: number;
  /** Escala específica para la fórmula del hero (0.85 a 1.3, default 1.0) */
  hero_formula_scale?: number;
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
  show_grain: true,
  show_custom_cursor: false,
  show_bee_canvas: true,
  atmosphere_rev: 2,
  hero_cta_label: 'Explorar creaciones',
  hero_cta_label_en: 'Explore creations',
  hero_cta_href: '/catalogo',
  show_hero_cta: true,
  hero_eyebrow: '',
  hero_title_line1: '',
  hero_title_line2: '',
  hero_subtitle: '',
  hero_formula: '',
  hero_title_scale: 1.4,
  hero_subtitle_scale: 0.9,
  hero_formula_scale: 1.0,
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
  hero_image?: string;
  image_aspect_ratio: ImageAspectRatio;
  image_fit: ImageFitMode;
  hero_image_opacity?: number;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
  cta_kicker?: string;
  cta_kicker_en?: string;
  cta_title?: string;
  cta_title_en?: string;
  cta_label?: string;
  cta_label_en?: string;
  cta_href?: string;
};

export const DEFAULT_NOSOTROS_SETTINGS: NosotrosSettings = {
  kicker: 'Nuestra Historia',
  kicker_en: 'Our Story',
  title: 'Trayectoria y Vínculo',
  title_en: 'Journey and Legacy',
  subtitle: 'Nuestra presencia en el bosque nativo de Chiloé y el compromiso con la abeja virgen.',
  subtitle_en: 'Our presence in the native rainforest of Chiloé and dedication to the wild bee.',
  hero_image: '/assets/editorial/nosotros-hero.jpg',
  image_aspect_ratio: '16/9',
  image_fit: 'cover',
  hero_image_opacity: 100,
  cta_label: 'Explorar Catálogo',
  cta_label_en: 'Explore Catalog',
  cta_href: '/catalogo',
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

  // Eje 01 · Triangulación botánica
  triangulacion_kicker?: string;
  triangulacion_kicker_en?: string;
  triangulacion_title?: string;
  triangulacion_title_en?: string;
  triangulacion_desc?: string;
  triangulacion_desc_en?: string;

  // Eje 02 · Bioquímica de origen
  bioquimica_kicker?: string;
  bioquimica_kicker_en?: string;
  bioquimica_title?: string;
  bioquimica_title_en?: string;
  bioquimica_desc?: string;
  bioquimica_desc_en?: string;
  protocolo_title?: string;
  protocolo_title_en?: string;
  protocolo_desc?: string;
  protocolo_desc_en?: string;

  // Eje 03 · Botánica melífera & Estación de origen
  biblioteca_kicker?: string;
  biblioteca_kicker_en?: string;
  biblioteca_title?: string;
  biblioteca_title_en?: string;
  biblioteca_desc?: string;
  biblioteca_desc_en?: string;
  estacion_kicker?: string;
  estacion_kicker_en?: string;
  estacion_title?: string;
  estacion_title_en?: string;
  estacion_desc?: string;
  estacion_desc_en?: string;
  estacion_cta_label?: string;
  estacion_cta_label_en?: string;
  estacion_cta_href?: string;

  // Eje 04 · Contabilidad biofísica & Pecoreo
  metodologia_kicker?: string;
  metodologia_kicker_en?: string;
  metodologia_title?: string;
  metodologia_title_en?: string;
  metodologia_desc?: string;
  metodologia_desc_en?: string;
  pecoreo_kicker?: string;
  pecoreo_kicker_en?: string;
  pecoreo_title?: string;
  pecoreo_title_en?: string;
  pecoreo_desc?: string;
  pecoreo_desc_en?: string;
  horizonte_title?: string;
  horizonte_title_en?: string;
  horizonte_text?: string;
  horizonte_text_en?: string;

  // Eje 05 · Respaldo y límites
  respaldo_title?: string;
  respaldo_title_en?: string;
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

  triangulacion_kicker: 'Eje 01 · Triangulación Botánica',
  triangulacion_kicker_en: 'Axis 01 · Botanical Triangulation',
  triangulacion_title: 'Refugio Austral: Bosque Nativo sin Pesticidas',
  triangulacion_title_en: 'Austral Sanctuary: Native Forest Free of Pesticides',
  triangulacion_desc:
    'El archipiélago de Chiloé y la vertiente occidental de la Cordillera de la Costa constituyen un santuario biogeográfico aislado. La ausencia de monocultivos agroindustriales extensivos, combinada con una densa pluviometría templada lluviosa, protege los apiarios de la deriva de agroquímicos sintéticos.',
  triangulacion_desc_en:
    'The Chiloé archipelago and the western slopes of the Coastal Range form an isolated biogeographical sanctuary. The absence of extensive agro-industrial monocultures, combined with dense temperate rainforest precipitation, shields our apiaries from synthetic agrochemical drift.',

  bioquimica_kicker: 'Eje 02 · Bioquímica de Origen',
  bioquimica_kicker_en: 'Axis 02 · Origin Biochemistry',
  bioquimica_title: 'Composición de la Miel Cruda Viva',
  bioquimica_title_en: 'Composition of Living Raw Honey',
  bioquimica_desc:
    'La miel no es un producto fabricado: es energía solar transformada en biomolécula por una cadena causal directa. La abeja concentra el néctar con enzimas y lo estabiliza por deshidratación. Frente al azúcar refinada —molienda, clarificación, centrifugación, decoloración—, la miel cruda es un alimento sin etapas industriales.',
  bioquimica_desc_en:
    'Honey is not a manufactured product: it is solar energy transformed into a biomolecule through a direct causal chain. Bees concentrate nectar with active enzymes and stabilize it via dehydration. In contrast to refined industrial sugar, raw honey undergoes zero industrial processing.',
  protocolo_title: 'Protocolo de Laboratorio y Análisis por Lote',
  protocolo_title_en: 'Laboratory Protocol & Batch Analysis',
  protocolo_desc:
    'Cada partida envasada cuenta con respaldo analítico documentado antes de su distribución. Los estándares físico-químicos y botánicos respaldan la pureza entregada a hogares, cafeterías, hoteles y tiendas de autor:',
  protocolo_desc_en:
    'Every packaged batch has documented analytical backing prior to distribution. Physico-chemical and botanical standards uphold the raw purity delivered to homes, culinary studios, and boutique establishments:',

  biblioteca_kicker: 'Eje 03 · Botánica Melífera',
  biblioteca_kicker_en: 'Axis 03 · Melliferous Botany',
  biblioteca_title: 'Biblioteca de Floraciones del Bosque Nativo',
  biblioteca_title_en: 'Native Forest Bloom Library',
  biblioteca_desc:
    'El bosque nativo de Chile no florece todo a la vez: sigue una cadencia estacional estricta. Cada miel es la huella digital de una floración en el tiempo. La regeneración territorial protege esta sucesión para que las abejas jamás sufran vacíos nutricionales ni dependan de jarabes artificiales.',
  biblioteca_desc_en:
    'Chilean native forests do not bloom simultaneously: they follow a strict seasonal cadence. Each honey represents the fingerprint of a single bloom in time. Territorial stewardship protects this floral succession so bees never suffer nutritional voids or depend on artificial syrups.',
  estacion_kicker: 'Presencia en eventos externos · Módulos territoriales',
  estacion_kicker_en: 'Presence at External Events · Territorial Modules',
  estacion_title: 'Estación de Origen: Curaduría de Contraste Máximo',
  estacion_title_en: 'Origin Station: Maximum Sensory Contrast Curatorship',
  estacion_desc:
    'Las 5 a 8 floraciones nativas de la temporada operan como contrapunto sensorial en wine clubs, cenas de autor y retiros. Una experiencia de flujo continuo (8 a 12 minutos por persona) conducida por el equipo con dominio territorial de La Obrera y el Zángano.',
  estacion_desc_en:
    'The 5 to 8 seasonal native blooms operate as a territorial sensory counterpoint in wine clubs, signature dinners, and private retreats. An open flow experience (8 to 12 minutes per person) conducted by the territorial team of La Obrera y el Zángano.',
  estacion_cta_label: 'Estación de Origen',
  estacion_cta_label_en: 'Origin Station',
  estacion_cta_href: '/experiencias/degustaciones#estacion-origen',

  metodologia_kicker: 'Eje 04 · Contabilidad Biofísica',
  metodologia_kicker_en: 'Axis 04 · Biophysical Accounting',
  metodologia_title: 'Cálculo Referencial de CO₂ y Regeneración',
  metodologia_title_en: 'Referential CO₂ & Regeneration Calculation',
  metodologia_desc:
    'El impacto ecológico no debe ser una promesa abstracta ni un certificado comercial opaco. Modelamos la relación entre cada gramaje de miel recolectada, el CO₂ evitado respecto al azúcar industrial y la protección activa de árboles nativos en el archipiélago de Chiloé.',
  metodologia_desc_en:
    'Ecological impact must never be an abstract promise or an opaque marketing stamp. We model the direct correlation between each gram of harvested raw honey, avoided CO₂ emissions relative to industrial sugar, and the active protection of native trees in the Chiloé archipelago.',
  pecoreo_kicker: 'Modelación Biofísica de Pecoreo & Polinización Nativa',
  pecoreo_kicker_en: 'Biophysical Foraging & Native Pollination Modeling',
  pecoreo_title: 'Transformación Néctar-Miel y Capacidad de Carga del Bosque',
  pecoreo_title_en: 'Nectar-to-Honey Conversion & Forest Carrying Capacity',
  pecoreo_desc:
    'En nuestra modelación analítica de biofísica territorial y capacidad de carga, hemos calculado la estequiometría de pecoreo de Apis mellifera en el dosel nativo de Chiloé:',
  pecoreo_desc_en:
    'In our analytical modeling of territorial biophysics and carrying capacity, we calculate the foraging stoichiometry of Apis mellifera across the native Chiloé canopy:',
  horizonte_title: 'Horizonte Metodológico 2026–2027 · Medición y Calibración en Terreno',
  horizonte_title_en: 'Methodological Horizon 2026–2027 · Field Measurement & Calibration',
  horizonte_text:
    'Principio de honestidad radical: Aunque esta modelación matemática biofísica está estructurada en nuestros sistemas de cálculo territorial, no se encuentra activa como sello comercial cerrado ni promesa certificada en frascos individuales. Durante las temporadas 2026 y 2027 estamos llevando a cabo la medición empírica exhaustiva, el conteo de floraciones y la trazabilidad georreferenciada de árboles y apiarios en el Predio Pureo y predios asociados de Chiloé. Solo publicaremos estas equivalencias unitarias al consumidor una vez concluida la validación empírica en terreno.',
  horizonte_text_en:
    'Radical transparency principle: Although this biophysical mathematical model is structured within our territorial accounting systems, it is not used as a closed commercial stamp on individual retail jars. Throughout the 2026 and 2027 seasons, we conduct exhaustive empirical field measurements, bloom censuses, and georeferenced tracking across the Pureo Sanctuary. Unit equivalencies will only be published once empirical field validation concludes.',

  respaldo_title: 'Límites y Responsabilidad Científica',
  respaldo_title_en: 'Scientific Limits, Accountability & Legal Disclaimer',
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
  show_tagline_badge: boolean;
  back_button_label: string;
  back_button_label_en: string;
  login_card_title: string;
  login_card_title_en: string;
  login_card_subtitle: string;
  login_card_subtitle_en: string;
  login_button_label: string;
  login_button_label_en: string;
  register_card_title: string;
  register_card_title_en: string;
  register_card_subtitle: string;
  register_card_subtitle_en: string;
  register_button_label: string;
  register_button_label_en: string;
  show_birth_date: boolean;
  birth_date_required: boolean;
  birth_date_label: string;
  birth_date_label_en: string;
  birth_date_incentive: string;
  birth_date_incentive_en: string;
  background_style: AuthBackgroundStyle;
  background_image_url?: string;
  particle_effect: AuthParticleEffect;
  blur_orb_color?: string;
  terms_checkbox_label?: string;
  terms_checkbox_label_en?: string;
  marketing_checkbox_label?: string;
  marketing_checkbox_label_en?: string;
};

export const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  hero_title: 'Enjambre Legado',
  hero_title_en: 'Enjambre Legado',
  hero_subtitle: 'La Obrera y el Zángano',
  hero_subtitle_en: 'The Worker & The Drone',
  tagline_phrase: 'Miel del Bosque Nativo · Chiloé',
  tagline_phrase_en: 'Native Forest Honey · Chiloé',
  show_tagline_badge: true,
  back_button_label: 'Volver a la tienda',
  back_button_label_en: 'Back to the store',
  login_card_title: 'Acceso al Club Legado',
  login_card_title_en: 'Legado Club access',
  login_card_subtitle: 'Ingresa tus credenciales para ver tus pedidos y membresía',
  login_card_subtitle_en: 'Sign in to see your orders and membership',
  login_button_label: 'Iniciar Sesión',
  login_button_label_en: 'Sign in',
  register_card_title: 'Crear Cuenta en el Club Legado',
  register_card_title_en: 'Create your Legado Club account',
  register_card_subtitle: 'Únete para acumular puntos, recibir recolecciones exclusivas y proteger el bosque',
  register_card_subtitle_en: 'Join to earn points, receive exclusive releases and protect the forest',
  register_button_label: 'Crear Cuenta',
  register_button_label_en: 'Create account',
  show_birth_date: false,
  birth_date_required: false,
  birth_date_label: 'Fecha de cumpleaños',
  birth_date_label_en: 'Birthday',
  birth_date_incentive: 'Te enviaremos un detalle especial en el día de tu cumpleaños.',
  birth_date_incentive_en: 'We will send you a special gift on your birthday.',
  background_style: 'cosmic',
  background_image_url: '',
  particle_effect: 'cosmic_stars',
  blur_orb_color: '#D4A017',
  terms_checkbox_label: 'Declaro ser mayor de 18 años y acepto la política de privacidad y los términos del servicio (Ley N° 21.719).',
  terms_checkbox_label_en: 'I declare that I am 18 years of age or older and accept the Privacy Policy and Terms of Service (Law No. 21,719).',
  marketing_checkbox_label: 'Deseo recibir alertas de floración, lanzamientos de recolecciones exclusivas y novedades del Club Legado por correo electrónico.',
  marketing_checkbox_label_en: 'I wish to receive bloom alerts, exclusive seasonal releases, and Legado Club news via email.',
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
  legal_warranty_text?: string;
  legal_warranty_text_en?: string;
  legal_retracto_text?: string;
  legal_retracto_text_en?: string;
  food_disclaimer_title?: string;
  food_disclaimer_title_en?: string;
  food_disclaimer_text?: string;
  food_disclaimer_text_en?: string;
  food_disclaimer_link_text?: string;
  food_disclaimer_link_text_en?: string;
  food_disclaimer_link_href?: string;
  infant_warning_text?: string;
  infant_warning_text_en?: string;
  // Perfil Sensorial (Constelación de Cata)
  sensory_kicker?: string;
  sensory_kicker_en?: string;
  sensory_title?: string;
  sensory_title_en?: string;
  sensory_intro_template?: string;
  sensory_intro_template_en?: string;
  sensory_radar_layer1?: string;
  sensory_radar_layer1_en?: string;
  sensory_radar_layer2?: string;
  sensory_radar_layer2_en?: string;
  sensory_radar_layer3?: string;
  sensory_radar_layer3_en?: string;
  sensory_sources_title?: string;
  sensory_sources_title_en?: string;
  sensory_sources_subtitle?: string;
  sensory_sources_subtitle_en?: string;
  sensory_layer1_label?: string;
  sensory_layer1_label_en?: string;
  sensory_layer1_pending?: string;
  sensory_layer1_pending_en?: string;
  sensory_layer2_label?: string;
  sensory_layer2_label_en?: string;
  sensory_layer2_pending?: string;
  sensory_layer2_pending_en?: string;
  sensory_layer3_label?: string;
  sensory_layer3_label_en?: string;
  sensory_layer3_empty?: string;
  sensory_layer3_empty_en?: string;
  sensory_cta_button?: string;
  sensory_cta_button_en?: string;
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
  legal_warranty_text: 'Garantía Legal de 6 meses (Ley 19.496 / 21.398)',
  legal_warranty_text_en: '6-month legal warranty (Consumer Law 19.496 / 21.398)',
  legal_retracto_text: 'Derecho a retracto de 10 días (con precinto intacto)',
  legal_retracto_text_en: '10-day right of withdrawal (with intact tamper seal)',
  food_disclaimer_title: 'Alimento natural del bosque nativo',
  food_disclaimer_title_en: 'Natural food from the native rainforest',
  food_disclaimer_text: 'No constituye consejo médico ni diagnóstico de salud (Reglamento Sanitario de los Alimentos).',
  food_disclaimer_text_en: 'Does not constitute medical advice or health diagnosis (Food Sanitary Regulations).',
  food_disclaimer_link_text: 'evidencia botánica y organoléptica',
  food_disclaimer_link_text_en: 'botanical and sensory evidence',
  food_disclaimer_link_href: '/ciencia',
  infant_warning_text: 'Por norma sanitaria (DTO 977/96 MINSAL), no administrar a menores de 1 año de edad.',
  infant_warning_text_en: 'Pursuant to sanitary health regulations (DTO 977/96), do not feed to infants under 1 year of age.',
  sensory_kicker: 'Expresión Botánica de Origen',
  sensory_kicker_en: 'Botanical Expression of Origin',
  sensory_title: 'Constelación Sensorial de Cata',
  sensory_title_en: 'Sensory Constellation of Tasting',
  sensory_intro_template: 'Perfil sensorial de origen para {product}. Síntesis contrastada entre botánica de bosque nativo, calibración curatorial y evaluaciones reales de la comunidad.',
  sensory_intro_template_en: 'Sensory origin profile for {product}. Contrast synthesis between native rainforest botany, curatorial calibration, and real community evaluations.',
  sensory_radar_layer1: 'Referencia Botánica',
  sensory_radar_layer1_en: 'Botanical Reference',
  sensory_radar_layer2: 'Curaduría Canónica',
  sensory_radar_layer2_en: 'Canonical Curation',
  sensory_radar_layer3: 'Comunidad',
  sensory_radar_layer3_en: 'Community',
  sensory_sources_title: 'Fuentes de Verificación Sensorial',
  sensory_sources_title_en: 'Sensory Verification Sources',
  sensory_sources_subtitle: 'Datos contrastados entre botánica del bosque, cata canónica y comunidad.',
  sensory_sources_subtitle_en: 'Contrasted data between rainforest botany, canonical tasting, and real community records.',
  sensory_layer1_label: 'Referencia Botánica & Lote',
  sensory_layer1_label_en: 'Botanical Reference & Batch',
  sensory_layer1_pending: 'Catalogación botánica en curso para esta floración.',
  sensory_layer1_pending_en: 'Botanical cataloging in progress for this bloom.',
  sensory_layer2_label: 'Calibración Curatorial de Origen',
  sensory_layer2_label_en: 'Curatorial Calibration of Origin',
  sensory_layer2_pending: 'Calibración curatorial no asignada aún para esta creación.',
  sensory_layer2_pending_en: 'Curatorial calibration not yet assigned for this creation.',
  sensory_layer3_label: 'Evaluación Sensorial Comunitaria',
  sensory_layer3_label_en: 'Community Sensory Evaluation',
  sensory_layer3_empty: 'Aún no hay registros de cata comunitaria para esta creación. Cada evaluación enriquece este mapa sensorial.',
  sensory_layer3_empty_en: 'No community tasting records yet for this creation. Each evaluation enriches this sensory map.',
  sensory_cta_button: 'Aportar mi evaluación sensorial',
  sensory_cta_button_en: 'Contribute my sensory evaluation',
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
    hero_title_scale: asNumber(raw.hero_title_scale, d.hero_title_scale ?? 1.0, 0.85, 1.6),
    hero_subtitle_scale: asNumber(raw.hero_subtitle_scale, d.hero_subtitle_scale ?? 1.0, 0.85, 1.4),
    hero_formula_scale: asNumber(raw.hero_formula_scale, d.hero_formula_scale ?? 1.0, 0.85, 1.3),
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
    legal_warranty_text: asString(raw.legal_warranty_text, d.legal_warranty_text ?? '').trim() || d.legal_warranty_text,
    legal_warranty_text_en:
      typeof raw.legal_warranty_text_en === 'string' ? raw.legal_warranty_text_en.trim() : d.legal_warranty_text_en,
    legal_retracto_text: asString(raw.legal_retracto_text, d.legal_retracto_text ?? '').trim() || d.legal_retracto_text,
    legal_retracto_text_en:
      typeof raw.legal_retracto_text_en === 'string' ? raw.legal_retracto_text_en.trim() : d.legal_retracto_text_en,
    food_disclaimer_title: asString(raw.food_disclaimer_title, d.food_disclaimer_title ?? '').trim() || d.food_disclaimer_title,
    food_disclaimer_title_en:
      typeof raw.food_disclaimer_title_en === 'string' ? raw.food_disclaimer_title_en.trim() : d.food_disclaimer_title_en,
    food_disclaimer_text: asString(raw.food_disclaimer_text, d.food_disclaimer_text ?? '').trim() || d.food_disclaimer_text,
    food_disclaimer_text_en:
      typeof raw.food_disclaimer_text_en === 'string' ? raw.food_disclaimer_text_en.trim() : d.food_disclaimer_text_en,
    food_disclaimer_link_text: asString(raw.food_disclaimer_link_text, d.food_disclaimer_link_text ?? '').trim() || d.food_disclaimer_link_text,
    food_disclaimer_link_text_en:
      typeof raw.food_disclaimer_link_text_en === 'string' ? raw.food_disclaimer_link_text_en.trim() : d.food_disclaimer_link_text_en,
    food_disclaimer_link_href: asString(raw.food_disclaimer_link_href, d.food_disclaimer_link_href ?? '').trim() || d.food_disclaimer_link_href,
    infant_warning_text: asString(raw.infant_warning_text, d.infant_warning_text ?? '').trim() || d.infant_warning_text,
    infant_warning_text_en:
      typeof raw.infant_warning_text_en === 'string' ? raw.infant_warning_text_en.trim() : d.infant_warning_text_en,
    sensory_kicker: asString(raw.sensory_kicker, d.sensory_kicker ?? '').trim() || d.sensory_kicker,
    sensory_kicker_en:
      typeof raw.sensory_kicker_en === 'string' ? raw.sensory_kicker_en.trim() : d.sensory_kicker_en,
    sensory_title: asString(raw.sensory_title, d.sensory_title ?? '').trim() || d.sensory_title,
    sensory_title_en:
      typeof raw.sensory_title_en === 'string' ? raw.sensory_title_en.trim() : d.sensory_title_en,
    sensory_intro_template:
      asString(raw.sensory_intro_template, d.sensory_intro_template ?? '').trim() || d.sensory_intro_template,
    sensory_intro_template_en:
      typeof raw.sensory_intro_template_en === 'string'
        ? raw.sensory_intro_template_en.trim()
        : d.sensory_intro_template_en,
    sensory_radar_layer1:
      asString(raw.sensory_radar_layer1, d.sensory_radar_layer1 ?? '').trim() || d.sensory_radar_layer1,
    sensory_radar_layer1_en:
      typeof raw.sensory_radar_layer1_en === 'string'
        ? raw.sensory_radar_layer1_en.trim()
        : d.sensory_radar_layer1_en,
    sensory_radar_layer2:
      asString(raw.sensory_radar_layer2, d.sensory_radar_layer2 ?? '').trim() || d.sensory_radar_layer2,
    sensory_radar_layer2_en:
      typeof raw.sensory_radar_layer2_en === 'string'
        ? raw.sensory_radar_layer2_en.trim()
        : d.sensory_radar_layer2_en,
    sensory_radar_layer3:
      asString(raw.sensory_radar_layer3, d.sensory_radar_layer3 ?? '').trim() || d.sensory_radar_layer3,
    sensory_radar_layer3_en:
      typeof raw.sensory_radar_layer3_en === 'string'
        ? raw.sensory_radar_layer3_en.trim()
        : d.sensory_radar_layer3_en,
    sensory_sources_title:
      asString(raw.sensory_sources_title, d.sensory_sources_title ?? '').trim() || d.sensory_sources_title,
    sensory_sources_title_en:
      typeof raw.sensory_sources_title_en === 'string'
        ? raw.sensory_sources_title_en.trim()
        : d.sensory_sources_title_en,
    sensory_sources_subtitle:
      asString(raw.sensory_sources_subtitle, d.sensory_sources_subtitle ?? '').trim() || d.sensory_sources_subtitle,
    sensory_sources_subtitle_en:
      typeof raw.sensory_sources_subtitle_en === 'string'
        ? raw.sensory_sources_subtitle_en.trim()
        : d.sensory_sources_subtitle_en,
    sensory_layer1_label:
      asString(raw.sensory_layer1_label, d.sensory_layer1_label ?? '').trim() || d.sensory_layer1_label,
    sensory_layer1_label_en:
      typeof raw.sensory_layer1_label_en === 'string'
        ? raw.sensory_layer1_label_en.trim()
        : d.sensory_layer1_label_en,
    sensory_layer1_pending:
      asString(raw.sensory_layer1_pending, d.sensory_layer1_pending ?? '').trim() || d.sensory_layer1_pending,
    sensory_layer1_pending_en:
      typeof raw.sensory_layer1_pending_en === 'string'
        ? raw.sensory_layer1_pending_en.trim()
        : d.sensory_layer1_pending_en,
    sensory_layer2_label:
      asString(raw.sensory_layer2_label, d.sensory_layer2_label ?? '').trim() || d.sensory_layer2_label,
    sensory_layer2_label_en:
      typeof raw.sensory_layer2_label_en === 'string'
        ? raw.sensory_layer2_label_en.trim()
        : d.sensory_layer2_label_en,
    sensory_layer2_pending:
      asString(raw.sensory_layer2_pending, d.sensory_layer2_pending ?? '').trim() || d.sensory_layer2_pending,
    sensory_layer2_pending_en:
      typeof raw.sensory_layer2_pending_en === 'string'
        ? raw.sensory_layer2_pending_en.trim()
        : d.sensory_layer2_pending_en,
    sensory_layer3_label:
      asString(raw.sensory_layer3_label, d.sensory_layer3_label ?? '').trim() || d.sensory_layer3_label,
    sensory_layer3_label_en:
      typeof raw.sensory_layer3_label_en === 'string'
        ? raw.sensory_layer3_label_en.trim()
        : d.sensory_layer3_label_en,
    sensory_layer3_empty:
      asString(raw.sensory_layer3_empty, d.sensory_layer3_empty ?? '').trim() || d.sensory_layer3_empty,
    sensory_layer3_empty_en:
      typeof raw.sensory_layer3_empty_en === 'string'
        ? raw.sensory_layer3_empty_en.trim()
        : d.sensory_layer3_empty_en,
    sensory_cta_button:
      asString(raw.sensory_cta_button, d.sensory_cta_button ?? '').trim() || d.sensory_cta_button,
    sensory_cta_button_en:
      typeof raw.sensory_cta_button_en === 'string'
        ? raw.sensory_cta_button_en.trim()
        : d.sensory_cta_button_en,
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
  default_title: 'La Obrera y el Zángano · Tienda Web',
  title_template: '%s · La Obrera y el Zángano',
  default_description: 'El Legado del Bosque en Chiloé.',
  default_description_en: 'Raw honey from the native forests of Chiloé.',
  og_image_url:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/seo_defaults/cb672ac4-72f3-4696-a526-8c1a4a41e39e.webp',
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
  /** Enclave territorial & Mapa panorámico en /contacto */
  show_map: boolean;
  map_eyebrow: string;
  map_eyebrow_en?: string;
  map_title: string;
  map_title_en?: string;
  map_description: string;
  map_description_en?: string;
  map_badge_label: string;
  map_badge_coords: string;
  map_lat: number;
  map_lng: number;
  map_zoom: number;
  map_popup_tag: string;
  map_popup_title: string;
  map_popup_subtitle: string;
  directions_url: string;
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
  payment_methods_note: string;
  protection_title: string;
  protection_desc: string;
  guarantee_title: string;
  guarantee_desc: string;
  circular_title: string;
  circular_desc: string;
  circular_question: string;
  circular_instructions: string;
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
  protection_badge_title: string;
  protection_badge_desc: string;
  legal_warranty_title: string;
  legal_warranty_desc: string;
  retract_title: string;
  retract_desc: string;
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
  email: 'contacto@obrerayzangano.cl',
  phone_display: '+56 9 4083 1358',
  address: 'Pureo rural km 8560, Queilén, Chiloé, Chile',
  address_en: 'Pureo rural km 8560, Queilén, Chiloé, Chile',
  hours: 'Lun–Vie 10:00–18:00 (CL)',
  hours_en: 'Mon–Fri 10:00–18:00 (CL)',
  text_align: 'left',
  show_map: true,
  map_eyebrow: 'Presencia en el Territorio',
  map_eyebrow_en: 'Presence in the Territory',
  map_title: 'Nuestro enclave en el bosque de Chiloé',
  map_title_en: 'Our enclave in the forest of Chiloé',
  map_description: 'Pureo rural km 8560, Queilén. Encuentro entre el bosque nativo y el canal de Queilén.',
  map_description_en: 'Pureo rural km 8560, Queilén. Where native forest meets the Queilén channel.',
  map_badge_label: 'Pureo rural km 8560 · Queilén',
  map_badge_coords: '42°51\'18"S 73°40\'41"W',
  map_lat: -42.854935,
  map_lng: -73.67796,
  map_zoom: 14,
  map_popup_tag: 'Apiario Central',
  map_popup_title: 'La Obrera & el Zángano',
  map_popup_subtitle: 'Pureo rural km 8560 · Queilén, Chiloé',
  directions_url: '',
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
  title: 'Pago Seguro',
  subtitle:
    'Tu pedido será procesado de forma segura. Despacho directo desde nuestro enclave en Pureo, Chiloé.',
  buyer_private_label: 'Compra privada',
  buyer_private_desc: 'Entrega puntual sin cuenta. Tus datos no quedan en tu perfil.',
  buyer_legacy_label: 'Continuar mi legado',
  buyer_legacy_desc: 'Acumula saldo en tu Billetera, accede a certificados de origen y despacha con direcciones guardadas.',
  shipping_title: 'Despacho en Chile',
  courier_label: 'Método de despacho',
  shipping_note:
    'Despachamos desde Pureo rural (Chiloé) con BlueExpress y seguimiento integrado. Si necesitas otro operador o retiro, selecciónalo aquí.',
  postal_label: 'Código postal',
  secure_payment_text: 'Pago encriptado',
  secure_transaction_text: 'Transacción segura',
  payment_methods_note: 'Webpay / Flow · Débito Redcompra, Crédito y Prepago',
  protection_title: 'Protección anti-quiebre con papel burbuja',
  protection_desc:
    'Frascos de vidrio grueso sellados y envueltos individualmente en papel burbuja de alta densidad para resistir el tránsito desde Chiloé a cualquier comuna de Chile.',
  guarantee_title: 'Garantía de reposición inmediata',
  guarantee_desc:
    'Si tu pedido sufre cualquier percance durante el transporte, lo reponemos de inmediato sin costo.',
  circular_title: 'Economía Circular Austral',
  circular_desc: 'Devuelve tus envases de vidrio limpios al repartidor y acumula saldo en tu Billetera',
  circular_question: '¿Tienes envases de vidrio vacíos de Enjambre Legado?',
  circular_instructions:
    'Entrégalos limpios y con tapa original al repartidor al recibir tu pedido. Se acreditarán Puntos Legado en tu Billetera digital tras la recepción física conforme en taller.',
  terms_prefix: 'Al completar tu compra, aceptas nuestros',
  secure_note: 'Tu pago está protegido con encriptación de grado bancario.',
};

export const DEFAULT_CART_SETTINGS: CartSettings = {
  empty_title: 'Tu carrito está vacío',
  empty_desc: 'Agrega productos para comenzar',
  empty_cta: 'Seguir comprando',
  subtotal_label: 'Subtotal',
  shipping_note: 'Despacho desde Pureo rural, Chiloé · Seguimiento incluido',
  cta_label: 'Finalizar compra',
  free_shipping_enabled: true,
  free_shipping_threshold_clp: 45000,
  free_shipping_progress_text: 'Te faltan {amount} para despacho gratis',
  free_shipping_unlocked_text: '✨ ¡Tienes despacho gratis incluido!',
  protection_badge_title: 'Empaque anti-quiebre con papel burbuja',
  protection_badge_desc:
    'Frascos de vidrio protegidos con amortiguación de burbuja y reposición inmediata sin costo ante cualquier percance en ruta.',
  legal_warranty_title: 'Garantía Legal de 6 meses',
  legal_warranty_desc:
    'Protección irrenunciable (Ley 19.496 / Ley 21.398). Opción de reparación, reemplazo o devolución ante cualquier defecto.',
  retract_title: 'Derecho a retracto de 10 días',
  retract_desc:
    'En compras web con precinto de seguridad intacto (Art. 3 bis Ley 19.496 y DS 6/2021).',
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
    show_map: asBool(raw.show_map, d.show_map),
    map_eyebrow: asString(raw.map_eyebrow, d.map_eyebrow),
    map_eyebrow_en: typeof raw.map_eyebrow_en === 'string' ? raw.map_eyebrow_en : d.map_eyebrow_en,
    map_title: asString(raw.map_title, d.map_title),
    map_title_en: typeof raw.map_title_en === 'string' ? raw.map_title_en : d.map_title_en,
    map_description: asString(raw.map_description, d.map_description),
    map_description_en:
      typeof raw.map_description_en === 'string' ? raw.map_description_en : d.map_description_en,
    map_badge_label: asString(raw.map_badge_label, d.map_badge_label),
    map_badge_coords: asString(raw.map_badge_coords, d.map_badge_coords),
    map_lat: asNumber(raw.map_lat, d.map_lat, -90, 90),
    map_lng: asNumber(raw.map_lng, d.map_lng, -180, 180),
    map_zoom: asNumber(raw.map_zoom, d.map_zoom, 3, 20),
    map_popup_tag: asString(raw.map_popup_tag, d.map_popup_tag),
    map_popup_title: asString(raw.map_popup_title, d.map_popup_title),
    map_popup_subtitle: asString(raw.map_popup_subtitle, d.map_popup_subtitle),
    directions_url: asString(raw.directions_url, d.directions_url),
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
    payment_methods_note: asString(raw.payment_methods_note, d.payment_methods_note),
    protection_title: asString(raw.protection_title, d.protection_title),
    protection_desc: asString(raw.protection_desc, d.protection_desc),
    guarantee_title: asString(raw.guarantee_title, d.guarantee_title),
    guarantee_desc: asString(raw.guarantee_desc, d.guarantee_desc),
    circular_title: asString(raw.circular_title, d.circular_title),
    circular_desc: asString(raw.circular_desc, d.circular_desc),
    circular_question: asString(raw.circular_question, d.circular_question),
    circular_instructions: asString(raw.circular_instructions, d.circular_instructions),
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
    protection_badge_title: asString(raw.protection_badge_title, d.protection_badge_title),
    protection_badge_desc: asString(raw.protection_badge_desc, d.protection_badge_desc),
    legal_warranty_title: asString(raw.legal_warranty_title, d.legal_warranty_title),
    legal_warranty_desc: asString(raw.legal_warranty_desc, d.legal_warranty_desc),
    retract_title: asString(raw.retract_title, d.retract_title),
    retract_desc: asString(raw.retract_desc, d.retract_desc),
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
  /** Cabecera editorial del bloque (vacío = no se muestra). */
  kicker?: string;
  kicker_en?: string;
  title?: string;
  title_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  /** Ficha flotante sobre el mapa (vacío = no se muestra). */
  card_label?: string;
  card_label_en?: string;
  /** Cita de cierre + CTA (vacío = no se muestra). */
  quote?: string;
  quote_en?: string;
  cta_label?: string;
  cta_label_en?: string;
  cta_href?: string;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
  /** Imagen personalizada del planisferio / mapa del mundo (URL subida desde el CMS). */
  planisferio_image?: string;
  /** Silueta personalizada de la Isla Grande de Chiloé (URL subida desde el CMS). */
  chiloe_image?: string;
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
  image_alt?: string;
  image_alt_en?: string;
  /** Alineación de los párrafos del bloque (control del editor). */
  text_align?: TextAlign;
};

export const DEFAULT_IDENTIDAD_SETTINGS: IdentidadSettings = {
  kicker: '',
  kicker_en: '',
  title: 'Pureo, Queilen, Chiloé',
  title_en: '',
  desc: 'Hace veintidós años llegamos a un terreno marcado por la huella de un incendio: baja densidad boscosa, erosión y silencio. Desde entonces, hemos reforestado y preservado con especies nativas —avellanos, ulmo, tepa, tepú, tiaca, tineo.... — hasta tejer un ecosistema que hoy respira como pulmón vivo para nuestras colmenas y demás seres que habitan el entorno.',
  desc_en:
    'Our real island beekeeping: La Obrera y el Zángano, over twenty years with native forest in Pureo and Queilén. What the forest teaches us arrives at your table exactly as it is born: raw, unfiltered and traced from the apiary.',
  body: 'Las abejas en su existencia, recolectan néctar de flores; sobrellevando junto al apicultor la húmeda lluvia cargada de fría luz austral. Transforman la esencia del bosque en miel de color ámbar extra claro. Nuestra apicultura restaura y preserva bosque, confiando en que cada proceso puede regenerar hacia algo más profundo, capaz de crear un legado que excede la propia biografía humana.\nEsto es un gran sistema: desde el cosmos solar al bosque del sur, abeja  y apicultor, y las personas que disfrutan y comparten miel; un equilibrio que permite continuidad al ecosistema.\n\nLa miel que emerge porta la densidad de bosque nativo regenerado y preservado: espectro floral,  polifenoles, y enzimas propias del sur frio del planeta.',
  body_en:
    'What the forest shares with us, directly from the sun, is not improved: it is honored. May the honey of Chiloé be enjoyed in Chile and the planet, and may each jar continue to sow the forest that will outlive us.',
  image: '/assets/editorial/experiencias.jpg',
  image_alt: 'Apicultura en el bosque nativo de Chiloé',
  image_alt_en: 'Beekeeping in the native forest of Chiloé',
  text_align: 'justify',
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
  kicker: 'Ubicación',
  kicker_en: 'Location',
  title: 'Nuestro lugar en el mundo',
  title_en: 'Our place in the world',
  subtitle: 'Pureo Rural km 8560 — Queilén — Chiloé',
  subtitle_en: 'Pureo Rural km 8560 — Queilén — Chiloé',
  card_label: 'Pureo rural km 8560 · Queilén',
  card_label_en: 'Pureo rural km 8560 · Queilén',
  quote: 'En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado de nuestra existencia.',
  quote_en: 'In the silence of the forest, native trees regenerate and become the legacy of our existence.',
  cta_label: 'Nuestra Historia',
  cta_label_en: 'Our Story',
  cta_href: '/nosotros',
  planisferio_image: '',
  chiloe_image: '',
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
  /** Sello de confianza bajo la bajada (vacío = no se muestra). */
  trust_label?: string;
  trust_label_en?: string;
  /** Muestra u oculta la tarjeta lateral completa. */
  show_card?: boolean;
  /** Fotografía de la tarjeta (uploader CMS; vacío = imagen editorial por defecto). */
  card_image?: string;
  card_image_alt?: string;
  card_image_alt_en?: string;
  card_kicker?: string;
  card_kicker_en?: string;
  card_badge?: string;
  card_badge_en?: string;
  card_image_label?: string;
  card_image_label_en?: string;
  card_image_sublabel?: string;
  card_image_sublabel_en?: string;
  card_benefit_1?: string;
  card_benefit_1_en?: string;
  card_benefit_2?: string;
  card_benefit_2_en?: string;
  card_benefit_3?: string;
  card_benefit_3_en?: string;
  card_benefit_4?: string;
  card_benefit_4_en?: string;
  card_title?: string;
  card_title_en?: string;
  card_subtitle?: string;
  card_subtitle_en?: string;
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
  trust_label: 'Pasaporte de lote verificado en cada entrega',
  trust_label_en: 'Verified batch passport with every delivery',
  show_card: true,
  card_image: '/assets/editorial/experiencias.jpg',
  card_image_alt: 'Experiencias y privilegios del Club Legado',
  card_image_alt_en: 'Legacy Club experiences and privileges',
  card_kicker: 'Club Legado',
  card_kicker_en: 'Legacy Club',
  card_badge: 'Membresía de Cliente',
  card_badge_en: 'Client Membership',
  card_image_label: 'Acceso Exclusivo',
  card_image_label_en: 'Exclusive Access',
  card_image_sublabel: 'Sin costo anual',
  card_image_sublabel_en: 'No annual fee',
  card_benefit_1: 'Reposición programada a tu medida',
  card_benefit_1_en: 'Scheduled replenishment tailored to you',
  card_benefit_2: 'Reserva prioritaria de microlotes escasos',
  card_benefit_2_en: 'Priority reservations for scarce microlots',
  card_benefit_3: 'Retorno de envases con saldo a favor',
  card_benefit_3_en: 'Jar returns with store credit',
  card_benefit_4: 'Invitaciones a catas privadas de autor',
  card_benefit_4_en: 'Invitations to private author tastings',
  card_title: 'Tu espacio personal en el enjambre',
  card_title_en: 'Your personal place in the swarm',
  card_subtitle: 'Activo automáticamente con tu cuenta de cliente',
  card_subtitle_en: 'Automatically active with your client account',
};

export const CLUB_LEGADO_SETTINGS_TEMPLATE: ClubLegadoSettings = {
  ...DEFAULT_CLUB_LEGADO_SETTINGS,
};

export function parseClubLegadoSettings(
  raw: Record<string, unknown> | null | undefined,
): ClubLegadoSettings {
  const d = DEFAULT_CLUB_LEGADO_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;
  const bool = (key: string, fallback: boolean) => {
    const v = raw[key];
    return typeof v === 'boolean' ? v : typeof v === 'string' ? v === 'true' : fallback;
  };
  return {
    kicker: es('kicker', d.kicker),
    kicker_en: en('kicker_en', d.kicker_en),
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    button_text: es('button_text', d.button_text),
    button_text_en: en('button_text_en', d.button_text_en),
    button_href: sanitizeStoreHref(raw.button_href, d.button_href) ?? d.button_href,
    trust_label: es('trust_label', d.trust_label ?? ''),
    trust_label_en: en('trust_label_en', d.trust_label_en),
    show_card: bool('show_card', d.show_card ?? true),
    card_image: es('card_image', d.card_image ?? ''),
    card_image_alt: es('card_image_alt', d.card_image_alt ?? ''),
    card_image_alt_en: en('card_image_alt_en', d.card_image_alt_en),
    card_kicker: es('card_kicker', d.card_kicker ?? ''),
    card_kicker_en: en('card_kicker_en', d.card_kicker_en),
    card_badge: es('card_badge', d.card_badge ?? ''),
    card_badge_en: en('card_badge_en', d.card_badge_en),
    card_image_label: es('card_image_label', d.card_image_label ?? ''),
    card_image_label_en: en('card_image_label_en', d.card_image_label_en),
    card_image_sublabel: es('card_image_sublabel', d.card_image_sublabel ?? ''),
    card_image_sublabel_en: en('card_image_sublabel_en', d.card_image_sublabel_en),
    card_benefit_1: es('card_benefit_1', d.card_benefit_1 ?? ''),
    card_benefit_1_en: en('card_benefit_1_en', d.card_benefit_1_en),
    card_benefit_2: es('card_benefit_2', d.card_benefit_2 ?? ''),
    card_benefit_2_en: en('card_benefit_2_en', d.card_benefit_2_en),
    card_benefit_3: es('card_benefit_3', d.card_benefit_3 ?? ''),
    card_benefit_3_en: en('card_benefit_3_en', d.card_benefit_3_en),
    card_benefit_4: es('card_benefit_4', d.card_benefit_4 ?? ''),
    card_benefit_4_en: en('card_benefit_4_en', d.card_benefit_4_en),
    card_title: es('card_title', d.card_title ?? ''),
    card_title_en: en('card_title_en', d.card_title_en),
    card_subtitle: es('card_subtitle', d.card_subtitle ?? ''),
    card_subtitle_en: en('card_subtitle_en', d.card_subtitle_en),
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
  /** 6 tarjetas de privilegios (vacío = la tarjeta no se muestra). */
  beneficio_1_tag?: string;
  beneficio_1_tag_en?: string;
  beneficio_1_title?: string;
  beneficio_1_title_en?: string;
  beneficio_1_desc?: string;
  beneficio_1_desc_en?: string;
  beneficio_2_tag?: string;
  beneficio_2_tag_en?: string;
  beneficio_2_title?: string;
  beneficio_2_title_en?: string;
  beneficio_2_desc?: string;
  beneficio_2_desc_en?: string;
  beneficio_3_tag?: string;
  beneficio_3_tag_en?: string;
  beneficio_3_title?: string;
  beneficio_3_title_en?: string;
  beneficio_3_desc?: string;
  beneficio_3_desc_en?: string;
  beneficio_4_tag?: string;
  beneficio_4_tag_en?: string;
  beneficio_4_title?: string;
  beneficio_4_title_en?: string;
  beneficio_4_desc?: string;
  beneficio_4_desc_en?: string;
  beneficio_5_tag?: string;
  beneficio_5_tag_en?: string;
  beneficio_5_title?: string;
  beneficio_5_title_en?: string;
  beneficio_5_desc?: string;
  beneficio_5_desc_en?: string;
  beneficio_6_tag?: string;
  beneficio_6_tag_en?: string;
  beneficio_6_title?: string;
  beneficio_6_title_en?: string;
  beneficio_6_desc?: string;
  beneficio_6_desc_en?: string;
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
  tiers_kicker?: string;
  tiers_kicker_en?: string;
  tiers_title?: string;
  tiers_title_en?: string;
  tiers_subtitle?: string;
  tiers_subtitle_en?: string;
  /** 4 ciclos de permanencia (vacío = la tarjeta no se muestra). */
  tier_1_badge?: string;
  tier_1_badge_en?: string;
  tier_1_label?: string;
  tier_1_label_en?: string;
  tier_1_title?: string;
  tier_1_title_en?: string;
  tier_1_desc?: string;
  tier_1_desc_en?: string;
  tier_1_foot?: string;
  tier_1_foot_en?: string;
  tier_2_badge?: string;
  tier_2_badge_en?: string;
  tier_2_label?: string;
  tier_2_label_en?: string;
  tier_2_title?: string;
  tier_2_title_en?: string;
  tier_2_desc?: string;
  tier_2_desc_en?: string;
  tier_2_foot?: string;
  tier_2_foot_en?: string;
  tier_3_badge?: string;
  tier_3_badge_en?: string;
  tier_3_label?: string;
  tier_3_label_en?: string;
  tier_3_title?: string;
  tier_3_title_en?: string;
  tier_3_desc?: string;
  tier_3_desc_en?: string;
  tier_3_foot?: string;
  tier_3_foot_en?: string;
  tier_4_badge?: string;
  tier_4_badge_en?: string;
  tier_4_label?: string;
  tier_4_label_en?: string;
  tier_4_title?: string;
  tier_4_title_en?: string;
  tier_4_desc?: string;
  tier_4_desc_en?: string;
  tier_4_foot?: string;
  tier_4_foot_en?: string;
  wallet_kicker?: string;
  wallet_kicker_en?: string;
  wallet_title?: string;
  wallet_title_en?: string;
  wallet_text?: string;
  wallet_text_en?: string;
  retorno_kicker?: string;
  retorno_kicker_en?: string;
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
  seasons_note?: string;
  seasons_note_en?: string;
  /** 4 tarjetas de floración (nombre vacío = la tarjeta no se muestra). */
  flor_1_nombre?: string;
  flor_1_nombre_en?: string;
  flor_1_cientifico?: string;
  flor_1_tagline?: string;
  flor_1_tagline_en?: string;
  flor_1_cata?: string;
  flor_1_cata_en?: string;
  flor_1_maridaje?: string;
  flor_1_maridaje_en?: string;
  flor_1_origen?: string;
  flor_2_nombre?: string;
  flor_2_nombre_en?: string;
  flor_2_cientifico?: string;
  flor_2_tagline?: string;
  flor_2_tagline_en?: string;
  flor_2_cata?: string;
  flor_2_cata_en?: string;
  flor_2_maridaje?: string;
  flor_2_maridaje_en?: string;
  flor_2_origen?: string;
  flor_3_nombre?: string;
  flor_3_nombre_en?: string;
  flor_3_cientifico?: string;
  flor_3_tagline?: string;
  flor_3_tagline_en?: string;
  flor_3_cata?: string;
  flor_3_cata_en?: string;
  flor_3_maridaje?: string;
  flor_3_maridaje_en?: string;
  flor_3_origen?: string;
  flor_4_nombre?: string;
  flor_4_nombre_en?: string;
  flor_4_cientifico?: string;
  flor_4_tagline?: string;
  flor_4_tagline_en?: string;
  flor_4_cata?: string;
  flor_4_cata_en?: string;
  flor_4_maridaje?: string;
  flor_4_maridaje_en?: string;
  flor_4_origen?: string;
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
  beneficio_1_tag: '01 · Reposición a Medida',
  beneficio_1_tag_en: '01 · Tailored Replenishment',
  beneficio_1_title: 'Entregas a tu propio ritmo',
  beneficio_1_title_en: 'Deliveries at your own pace',
  beneficio_1_desc:
    'Configura suscripciones de reposición periódica (mensual, bimestral o trimestral) para no quedarte sin miel. Modifica o pausa cuando lo desees sin trámites.',
  beneficio_1_desc_en:
    'Set up periodic replenishment subscriptions (monthly, bimonthly or quarterly) so you never run out of honey. Modify or pause whenever you wish with no paperwork.',
  beneficio_2_tag: '02 · Reservas Exclusivas',
  beneficio_2_tag_en: '02 · Exclusive Reservations',
  beneficio_2_title: 'Acceso prioritario a microlotes',
  beneficio_2_title_en: 'Priority access to microlots',
  beneficio_2_desc:
    'Cupo preferente en recolecciones escasas de temporada (Ulmo puro de altura, Tiaca silvestre) antes de cualquier apertura pública en el catálogo general.',
  beneficio_2_desc_en:
    'Preferred spots in scarce seasonal harvests (high-altitude pure Ulmo, wild Tiaca) before any public opening in the general catalog.',
  beneficio_3_tag: '03 · Trazabilidad de Origen',
  beneficio_3_tag_en: '03 · Origin Traceability',
  beneficio_3_title: 'Pasaporte oficial en cada lote',
  beneficio_3_title_en: 'Official passport with every batch',
  beneficio_3_desc:
    'Cada entrega incluye su pasaporte digital con análisis botánico, porcentaje polínico, apiario exacto de origen y firma de procedencia verificada.',
  beneficio_3_desc_en:
    'Every delivery includes its digital passport with botanical analysis, pollen percentage, exact apiary of origin and verified provenance signature.',
  beneficio_4_tag: '04 · Retorno Circular',
  beneficio_4_tag_en: '04 · Circular Return',
  beneficio_4_title: 'Saldo a favor por envase',
  beneficio_4_title_en: 'Store credit per jar',
  beneficio_4_desc:
    'Recibe $500 CLP de abono directo en tu saldo por cada frasco de vidrio retornado en puntos asociados o ferias, fomentando la recirculación limpia.',
  beneficio_4_desc_en:
    'Receive $500 CLP credited directly to your balance for each glass jar returned at partner points or fairs, encouraging clean recirculation.',
  beneficio_5_tag: '05 · Experiencias de Autor',
  beneficio_5_tag_en: '05 · Author Experiences',
  beneficio_5_title: 'Invitaciones a catas privadas',
  beneficio_5_title_en: 'Invitations to private tastings',
  beneficio_5_desc:
    'Acceso preferente a catas guiadas conducidas por Cristina Miranda, talleres botánicos y encuentros privados en apiarios de Chiloé.',
  beneficio_5_desc_en:
    'Preferred access to guided tastings led by Cristina Miranda, botanical workshops and private gatherings at Chiloé apiaries.',
  beneficio_6_tag: '06 · Credencial y Ciclos',
  beneficio_6_tag_en: '06 · Credential and Cycles',
  beneficio_6_title: 'Tu perfil como credencial viva',
  beneficio_6_title_en: 'Your profile as a living credential',
  beneficio_6_desc:
    'Tu cuenta registrada es tu credencial: QR personal para ferias, ciclos de permanencia que se acumulan con cada entrega y privilegios superiores que se desbloquean progresivamente.',
  beneficio_6_desc_en:
    'Your registered account is your credential: personal QR for fairs, permanence cycles that accumulate with each delivery, and higher privileges that unlock progressively.',
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
    'Nuestras mieles provienen de apiarios emplazados en el bosque nativo de Chiloé. Ser miembro del Club te conecta directamente con este territorio: sin intermediarios, con trazabilidad botánica de lote y apego riguroso a los ciclos de floración.',
  custodia_text_en:
    'Our honeys originate from apiaries situated in the native rainforest of Chiloé. Joining the Club connects you directly with this territory: no middlemen, batch botanical traceability, and strict adherence to seasonal flowering cycles.',
  tiers_kicker: 'Comunidad de Clientes',
  tiers_kicker_en: 'Client Community',
  tiers_title: 'Cuatro ciclos de permanencia y reciprocidad',
  tiers_title_en: 'Four cycles of permanence and reciprocity',
  tiers_subtitle:
    'En el bosque austral la lealtad es un círculo vivo. Cada entrega recibida, cada frasco retornado y cada año de permanencia suma ciclos que profundizan tu vínculo con los apiarios.',
  tiers_subtitle_en:
    'In the southern forest loyalty is a living circle. Each delivery, returned jar, and year of permanence adds cycles that deepen your bond with our apiaries.',
  tier_1_badge: 'Ciclo I',
  tier_1_badge_en: 'Cycle I',
  tier_1_label: '0+ ciclos',
  tier_1_label_en: '0+ cycles',
  tier_1_title: 'Guardián Obrera',
  tier_1_title_en: 'Worker Guardian',
  tier_1_desc:
    'Punto de entrada al enjambre. Acceso a tu espacio de cliente, trazabilidad pública de cada lote recibido, pasaporte digital de autenticidad y acumulación de ciclos desde tu primer pedido.',
  tier_1_desc_en:
    'Entry point to the swarm. Access to your client space, public traceability of each batch received, digital passport of authenticity and cycle accumulation from your first order.',
  tier_1_foot: 'Pasaporte de lote y bienvenida al enjambre',
  tier_1_foot_en: 'Batch passport and welcome to the swarm',
  tier_2_badge: 'Ciclo II',
  tier_2_badge_en: 'Cycle II',
  tier_2_label: '500+ ciclos',
  tier_2_label_en: '500+ cycles',
  tier_2_title: 'Guardián Zángano',
  tier_2_title_en: 'Drone Guardian',
  tier_2_desc:
    'Presencia recurrente en el territorio. Acceso preferente y anticipado a floraciones escasas de temporada (Ulmo puro de altura y Tiaca silvestre) antes de cualquier apertura general.',
  tier_2_desc_en:
    'Recurring presence in the territory. Preferred early access to scarce seasonal blooms (high-altitude pure Ulmo and wild Tiaca) before any general opening.',
  tier_2_foot: 'Reserva prioritaria en recolecciones de baja producción',
  tier_2_foot_en: 'Priority reservations in low-yield harvests',
  tier_3_badge: 'Ciclo III',
  tier_3_badge_en: 'Cycle III',
  tier_3_label: '2.000+ ciclos',
  tier_3_label_en: '2,000+ cycles',
  tier_3_title: 'Guardián Reina',
  tier_3_title_en: 'Queen Guardian',
  tier_3_desc:
    'Vínculo distinguido con el bosque austral. Aporte directo de 5 ejemplares nativos al fondo de enriquecimiento en Predio Pureo e invitaciones prioritarias a catas privadas de autor conducidas por Cristina Miranda.',
  tier_3_desc_en:
    'Distinguished bond with the southern forest. Direct contribution of 5 native specimens to the forest enrichment fund at Predio Pureo and priority invitations to private author tastings led by Cristina Miranda.',
  tier_3_foot: '5 árboles nativos en Pureo y acceso a catas privadas',
  tier_3_foot_en: '5 native trees at Pureo and private tasting access',
  tier_4_badge: 'Ciclo Mayor',
  tier_4_badge_en: 'Greater Cycle',
  tier_4_label: '5.000+ ciclos',
  tier_4_label_en: '5,000+ cycles',
  tier_4_title: 'Guardián Colmena',
  tier_4_title_en: 'Hive Guardian',
  tier_4_desc:
    'El más alto compromiso con el ecosistema. Aporte directo de 10 ejemplares nativos al fondo de enriquecimiento en Predio Pureo, asignación de microlotes exclusivos y prioridad en estadías territoriales.',
  tier_4_desc_en:
    'The highest commitment to the ecosystem. Direct contribution of 10 native specimens to the forest enrichment fund at Predio Pureo, exclusive microlot allocations, and priority on territorial stays.',
  tier_4_foot: 'Microlotes de autor y prioridad en estadías Pureo',
  tier_4_foot_en: 'Author microlots and priority on Pureo stays',
  wallet_kicker: 'Credencial Digital',
  wallet_kicker_en: 'Digital Credential',
  wallet_title: 'Credencial de Guardián',
  wallet_title_en: 'Guardian Credential',
  wallet_text:
    'Tu cuenta genera un código QR personal en tu perfil para acreditar ciclos y compras en ferias. La credencial descargable para Apple Wallet y Google Wallet se encuentra en integración técnica.',
  wallet_text_en:
    'Your account generates a personal QR code in your profile for fairs and markets. Downloadable Apple and Google Wallet passes are currently in technical integration.',
  retorno_kicker: 'Economía Circular',
  retorno_kicker_en: 'Circular Economy',
  retorno_title: 'Retorno de Frascos de Vidrio',
  retorno_title_en: 'Glass Jar Circular Return',
  retorno_text:
    'Programa piloto de recirculación en ferias y eventos: por cada frasco de vidrio limpio entregado se abonan $500 CLP de saldo en tu cuenta web para futuras compras.',
  retorno_text_en:
    'Pilot recirculation program at fairs and events: receive $500 CLP store credit for each clean glass jar returned.',
  seasons_kicker: 'Catálogo Estacional',
  seasons_kicker_en: 'Seasonal Catalog',
  seasons_title: 'Floraciones y Recolecciones de Temporada',
  seasons_title_en: 'Seasonal Blooms and Harvests',
  seasons_subtitle:
    'Como miembro registrado, accedes a reservas anticipadas y suscripciones de reposición para las floraciones nativas a medida que maduran en las colmenas.',
  seasons_subtitle_en:
    'As a registered member, you access early reservations and replenishment subscriptions for native blooms as they mature in the hives.',
  seasons_note:
    '* Si el plan de floración aún no está en catálogo de suscripciones, usamos el plan trimestral o mensual activo.',
  seasons_note_en:
    '* If the bloom plan is not yet in the subscription catalog, we use the active quarterly or monthly plan.',
  flor_1_nombre: 'Ulmo',
  flor_1_nombre_en: 'Ulmo',
  flor_1_cientifico: 'Eucryphia cordifolia',
  flor_1_tagline: 'La flor del bosque valdiviano — ámbar claro, vainilla y cuerpo ligero.',
  flor_1_tagline_en: 'The Valdivian forest bloom — light amber, vanilla and a light body.',
  flor_1_cata: 'Floral delicado\nNotas de vainilla\nFinal limpio\nCuerpo ligero',
  flor_1_cata_en: 'Delicate floral\nVanilla notes\nClean finish\nLight body',
  flor_1_maridaje: 'Quesos blandos (brie, camembert), té blanco, postres de leche.',
  flor_1_maridaje_en: 'Soft cheeses (brie, camembert), white tea, milk desserts.',
  flor_1_origen: '/origen/ulmo',
  flor_2_nombre: 'Tiaca',
  flor_2_nombre_en: 'Tiaca',
  flor_2_cientifico: 'Caldcluvia paniculata',
  flor_2_tagline: 'Cierra el verano: más ámbar, herbácea, con cuerpo y persistencia.',
  flor_2_tagline_en: 'Closing the summer: deeper amber, herbaceous, with body and persistence.',
  flor_2_cata: 'Herbáceo\nÁmbar medio\nCuerpo medio-alto\nFinal terroso',
  flor_2_cata_en: 'Herbaceous\nMedium amber\nMedium-full body\nEarthy finish',
  flor_2_maridaje: 'Yogur natural, panes de masa madre, queso de cabra.',
  flor_2_maridaje_en: 'Plain yogurt, sourdough breads, goat cheese.',
  flor_2_origen: '',
  flor_3_nombre: 'Quillay',
  flor_3_nombre_en: 'Quillay',
  flor_3_cientifico: 'Quillaja saponaria',
  flor_3_tagline: 'Primavera del centro-sur: floral intenso, ideal para quien descubre el club.',
  flor_3_tagline_en: 'South-central spring: intense floral, ideal for those discovering the club.',
  flor_3_cata: 'Floral intenso\nLigero amargor noble\nAroma jabonoso sutil\nFresco',
  flor_3_cata_en: 'Intense floral\nLight noble bitterness\nSubtle soapy aroma\nFresh',
  flor_3_maridaje: 'Fruta fresca, yogurt griego, infusiones de hierbas.',
  flor_3_maridaje_en: 'Fresh fruit, Greek yogurt, herbal infusions.',
  flor_3_origen: '',
  flor_4_nombre: 'Multifloral del bosque',
  flor_4_nombre_en: 'Forest multifloral',
  flor_4_cientifico: '',
  flor_4_tagline: 'Selección curada de la estación — el plan trimestral del territorio.',
  flor_4_tagline_en: 'Curated selection of the season — the territorial quarterly plan.',
  flor_4_cata: 'Perfil variable\nRefleja la temporada\nIdeal para descubrir',
  flor_4_cata_en: 'Variable profile\nReflects the season\nIdeal for discovering',
  flor_4_maridaje: 'Tabla mixta: el sommelier eres tú cada trimestre.',
  flor_4_maridaje_en: 'Mixed board: you are the sommelier each quarter.',
  flor_4_origen: '',
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
    beneficio_1_tag: es('beneficio_1_tag', d.beneficio_1_tag ?? ''),
    beneficio_1_tag_en: en('beneficio_1_tag_en', d.beneficio_1_tag_en),
    beneficio_1_title: es('beneficio_1_title', d.beneficio_1_title ?? ''),
    beneficio_1_title_en: en('beneficio_1_title_en', d.beneficio_1_title_en),
    beneficio_1_desc: es('beneficio_1_desc', d.beneficio_1_desc ?? ''),
    beneficio_1_desc_en: en('beneficio_1_desc_en', d.beneficio_1_desc_en),
    beneficio_2_tag: es('beneficio_2_tag', d.beneficio_2_tag ?? ''),
    beneficio_2_tag_en: en('beneficio_2_tag_en', d.beneficio_2_tag_en),
    beneficio_2_title: es('beneficio_2_title', d.beneficio_2_title ?? ''),
    beneficio_2_title_en: en('beneficio_2_title_en', d.beneficio_2_title_en),
    beneficio_2_desc: es('beneficio_2_desc', d.beneficio_2_desc ?? ''),
    beneficio_2_desc_en: en('beneficio_2_desc_en', d.beneficio_2_desc_en),
    beneficio_3_tag: es('beneficio_3_tag', d.beneficio_3_tag ?? ''),
    beneficio_3_tag_en: en('beneficio_3_tag_en', d.beneficio_3_tag_en),
    beneficio_3_title: es('beneficio_3_title', d.beneficio_3_title ?? ''),
    beneficio_3_title_en: en('beneficio_3_title_en', d.beneficio_3_title_en),
    beneficio_3_desc: es('beneficio_3_desc', d.beneficio_3_desc ?? ''),
    beneficio_3_desc_en: en('beneficio_3_desc_en', d.beneficio_3_desc_en),
    beneficio_4_tag: es('beneficio_4_tag', d.beneficio_4_tag ?? ''),
    beneficio_4_tag_en: en('beneficio_4_tag_en', d.beneficio_4_tag_en),
    beneficio_4_title: es('beneficio_4_title', d.beneficio_4_title ?? ''),
    beneficio_4_title_en: en('beneficio_4_title_en', d.beneficio_4_title_en),
    beneficio_4_desc: es('beneficio_4_desc', d.beneficio_4_desc ?? ''),
    beneficio_4_desc_en: en('beneficio_4_desc_en', d.beneficio_4_desc_en),
    beneficio_5_tag: es('beneficio_5_tag', d.beneficio_5_tag ?? ''),
    beneficio_5_tag_en: en('beneficio_5_tag_en', d.beneficio_5_tag_en),
    beneficio_5_title: es('beneficio_5_title', d.beneficio_5_title ?? ''),
    beneficio_5_title_en: en('beneficio_5_title_en', d.beneficio_5_title_en),
    beneficio_5_desc: es('beneficio_5_desc', d.beneficio_5_desc ?? ''),
    beneficio_5_desc_en: en('beneficio_5_desc_en', d.beneficio_5_desc_en),
    beneficio_6_tag: es('beneficio_6_tag', d.beneficio_6_tag ?? ''),
    beneficio_6_tag_en: en('beneficio_6_tag_en', d.beneficio_6_tag_en),
    beneficio_6_title: es('beneficio_6_title', d.beneficio_6_title ?? ''),
    beneficio_6_title_en: en('beneficio_6_title_en', d.beneficio_6_title_en),
    beneficio_6_desc: es('beneficio_6_desc', d.beneficio_6_desc ?? ''),
    beneficio_6_desc_en: en('beneficio_6_desc_en', d.beneficio_6_desc_en),
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
    tiers_kicker: es('tiers_kicker', d.tiers_kicker ?? ''),
    tiers_kicker_en: en('tiers_kicker_en', d.tiers_kicker_en),
    tiers_title: es('tiers_title', d.tiers_title ?? ''),
    tiers_title_en: en('tiers_title_en', d.tiers_title_en),
    tiers_subtitle: es('tiers_subtitle', d.tiers_subtitle ?? ''),
    tiers_subtitle_en: en('tiers_subtitle_en', d.tiers_subtitle_en),
    tier_1_badge: es('tier_1_badge', d.tier_1_badge ?? ''),
    tier_1_badge_en: en('tier_1_badge_en', d.tier_1_badge_en),
    tier_1_label: es('tier_1_label', d.tier_1_label ?? ''),
    tier_1_label_en: en('tier_1_label_en', d.tier_1_label_en),
    tier_1_title: es('tier_1_title', d.tier_1_title ?? ''),
    tier_1_title_en: en('tier_1_title_en', d.tier_1_title_en),
    tier_1_desc: es('tier_1_desc', d.tier_1_desc ?? ''),
    tier_1_desc_en: en('tier_1_desc_en', d.tier_1_desc_en),
    tier_1_foot: es('tier_1_foot', d.tier_1_foot ?? ''),
    tier_1_foot_en: en('tier_1_foot_en', d.tier_1_foot_en),
    tier_2_badge: es('tier_2_badge', d.tier_2_badge ?? ''),
    tier_2_badge_en: en('tier_2_badge_en', d.tier_2_badge_en),
    tier_2_label: es('tier_2_label', d.tier_2_label ?? ''),
    tier_2_label_en: en('tier_2_label_en', d.tier_2_label_en),
    tier_2_title: es('tier_2_title', d.tier_2_title ?? ''),
    tier_2_title_en: en('tier_2_title_en', d.tier_2_title_en),
    tier_2_desc: es('tier_2_desc', d.tier_2_desc ?? ''),
    tier_2_desc_en: en('tier_2_desc_en', d.tier_2_desc_en),
    tier_2_foot: es('tier_2_foot', d.tier_2_foot ?? ''),
    tier_2_foot_en: en('tier_2_foot_en', d.tier_2_foot_en),
    tier_3_badge: es('tier_3_badge', d.tier_3_badge ?? ''),
    tier_3_badge_en: en('tier_3_badge_en', d.tier_3_badge_en),
    tier_3_label: es('tier_3_label', d.tier_3_label ?? ''),
    tier_3_label_en: en('tier_3_label_en', d.tier_3_label_en),
    tier_3_title: es('tier_3_title', d.tier_3_title ?? ''),
    tier_3_title_en: en('tier_3_title_en', d.tier_3_title_en),
    tier_3_desc: es('tier_3_desc', d.tier_3_desc ?? ''),
    tier_3_desc_en: en('tier_3_desc_en', d.tier_3_desc_en),
    tier_3_foot: es('tier_3_foot', d.tier_3_foot ?? ''),
    tier_3_foot_en: en('tier_3_foot_en', d.tier_3_foot_en),
    tier_4_badge: es('tier_4_badge', d.tier_4_badge ?? ''),
    tier_4_badge_en: en('tier_4_badge_en', d.tier_4_badge_en),
    tier_4_label: es('tier_4_label', d.tier_4_label ?? ''),
    tier_4_label_en: en('tier_4_label_en', d.tier_4_label_en),
    tier_4_title: es('tier_4_title', d.tier_4_title ?? ''),
    tier_4_title_en: en('tier_4_title_en', d.tier_4_title_en),
    tier_4_desc: es('tier_4_desc', d.tier_4_desc ?? ''),
    tier_4_desc_en: en('tier_4_desc_en', d.tier_4_desc_en),
    tier_4_foot: es('tier_4_foot', d.tier_4_foot ?? ''),
    tier_4_foot_en: en('tier_4_foot_en', d.tier_4_foot_en),
    wallet_kicker: es('wallet_kicker', d.wallet_kicker ?? ''),
    wallet_kicker_en: en('wallet_kicker_en', d.wallet_kicker_en),
    wallet_title: es('wallet_title', d.wallet_title ?? ''),
    wallet_title_en: en('wallet_title_en', d.wallet_title_en),
    wallet_text: es('wallet_text', d.wallet_text ?? ''),
    wallet_text_en: en('wallet_text_en', d.wallet_text_en),
    retorno_kicker: es('retorno_kicker', d.retorno_kicker ?? ''),
    retorno_kicker_en: en('retorno_kicker_en', d.retorno_kicker_en),
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
    seasons_note: es('seasons_note', d.seasons_note ?? ''),
    seasons_note_en: en('seasons_note_en', d.seasons_note_en),
    flor_1_nombre: es('flor_1_nombre', d.flor_1_nombre ?? ''),
    flor_1_nombre_en: en('flor_1_nombre_en', d.flor_1_nombre_en),
    flor_1_cientifico: es('flor_1_cientifico', d.flor_1_cientifico ?? ''),
    flor_1_tagline: es('flor_1_tagline', d.flor_1_tagline ?? ''),
    flor_1_tagline_en: en('flor_1_tagline_en', d.flor_1_tagline_en),
    flor_1_cata: es('flor_1_cata', d.flor_1_cata ?? ''),
    flor_1_cata_en: en('flor_1_cata_en', d.flor_1_cata_en),
    flor_1_maridaje: es('flor_1_maridaje', d.flor_1_maridaje ?? ''),
    flor_1_maridaje_en: en('flor_1_maridaje_en', d.flor_1_maridaje_en),
    flor_1_origen: es('flor_1_origen', d.flor_1_origen ?? ''),
    flor_2_nombre: es('flor_2_nombre', d.flor_2_nombre ?? ''),
    flor_2_nombre_en: en('flor_2_nombre_en', d.flor_2_nombre_en),
    flor_2_cientifico: es('flor_2_cientifico', d.flor_2_cientifico ?? ''),
    flor_2_tagline: es('flor_2_tagline', d.flor_2_tagline ?? ''),
    flor_2_tagline_en: en('flor_2_tagline_en', d.flor_2_tagline_en),
    flor_2_cata: es('flor_2_cata', d.flor_2_cata ?? ''),
    flor_2_cata_en: en('flor_2_cata_en', d.flor_2_cata_en),
    flor_2_maridaje: es('flor_2_maridaje', d.flor_2_maridaje ?? ''),
    flor_2_maridaje_en: en('flor_2_maridaje_en', d.flor_2_maridaje_en),
    flor_2_origen: es('flor_2_origen', d.flor_2_origen ?? ''),
    flor_3_nombre: es('flor_3_nombre', d.flor_3_nombre ?? ''),
    flor_3_nombre_en: en('flor_3_nombre_en', d.flor_3_nombre_en),
    flor_3_cientifico: es('flor_3_cientifico', d.flor_3_cientifico ?? ''),
    flor_3_tagline: es('flor_3_tagline', d.flor_3_tagline ?? ''),
    flor_3_tagline_en: en('flor_3_tagline_en', d.flor_3_tagline_en),
    flor_3_cata: es('flor_3_cata', d.flor_3_cata ?? ''),
    flor_3_cata_en: en('flor_3_cata_en', d.flor_3_cata_en),
    flor_3_maridaje: es('flor_3_maridaje', d.flor_3_maridaje ?? ''),
    flor_3_maridaje_en: en('flor_3_maridaje_en', d.flor_3_maridaje_en),
    flor_3_origen: es('flor_3_origen', d.flor_3_origen ?? ''),
    flor_4_nombre: es('flor_4_nombre', d.flor_4_nombre ?? ''),
    flor_4_nombre_en: en('flor_4_nombre_en', d.flor_4_nombre_en),
    flor_4_cientifico: es('flor_4_cientifico', d.flor_4_cientifico ?? ''),
    flor_4_tagline: es('flor_4_tagline', d.flor_4_tagline ?? ''),
    flor_4_tagline_en: en('flor_4_tagline_en', d.flor_4_tagline_en),
    flor_4_cata: es('flor_4_cata', d.flor_4_cata ?? ''),
    flor_4_cata_en: en('flor_4_cata_en', d.flor_4_cata_en),
    flor_4_maridaje: es('flor_4_maridaje', d.flor_4_maridaje ?? ''),
    flor_4_maridaje_en: en('flor_4_maridaje_en', d.flor_4_maridaje_en),
    flor_4_origen: es('flor_4_origen', d.flor_4_origen ?? ''),
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
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;
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
    image_alt: es('image_alt', d.image_alt ?? ''),
    image_alt_en: en('image_alt_en', d.image_alt_en),
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
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback: string | undefined) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;
  return {
    lat: asNumber(raw.lat, d.lat, -90, 90),
    lng: asNumber(raw.lng, d.lng, -180, 180),
    popup_title: es('popup_title', d.popup_title),
    popup_body: es('popup_body', d.popup_body),
    kicker: es('kicker', d.kicker ?? ''),
    kicker_en: en('kicker_en', d.kicker_en),
    title: es('title', d.title ?? ''),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle ?? ''),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    card_label: es('card_label', d.card_label ?? ''),
    card_label_en: en('card_label_en', d.card_label_en),
    quote: es('quote', d.quote ?? ''),
    quote_en: en('quote_en', d.quote_en),
    cta_label: es('cta_label', d.cta_label ?? ''),
    cta_label_en: en('cta_label_en', d.cta_label_en),
    cta_href: es('cta_href', d.cta_href ?? '/nosotros'),
    text_align: parseTextAlign(raw.text_align),
    planisferio_image: typeof raw.planisferio_image === 'string' ? raw.planisferio_image.trim() : '',
    chiloe_image: typeof raw.chiloe_image === 'string' ? raw.chiloe_image.trim() : '',
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
    subtitle: asString(raw.subtitle, d.subtitle).replace(/\.d\s+sss$/i, '.'),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en : d.subtitle_en,
    hero_image: typeof raw.hero_image === 'string' && raw.hero_image ? raw.hero_image : d.hero_image,
    image_aspect_ratio: pickEnum(raw.image_aspect_ratio, ASPECT_RATIOS, d.image_aspect_ratio),
    image_fit: pickEnum(raw.image_fit, FIT_MODES, d.image_fit),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 100, 0, 100),
    text_align: parseTextAlign(raw.text_align),
    cta_kicker: typeof raw.cta_kicker === 'string' ? raw.cta_kicker : undefined,
    cta_kicker_en: typeof raw.cta_kicker_en === 'string' ? raw.cta_kicker_en : undefined,
    cta_title: typeof raw.cta_title === 'string' ? raw.cta_title : undefined,
    cta_title_en: typeof raw.cta_title_en === 'string' ? raw.cta_title_en : undefined,
    cta_label: typeof raw.cta_label === 'string' ? raw.cta_label : d.cta_label,
    cta_label_en: typeof raw.cta_label_en === 'string' ? raw.cta_label_en : d.cta_label_en,
    cta_href: typeof raw.cta_href === 'string' ? raw.cta_href : d.cta_href,
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

    // Eje 01 · Triangulación botánica
    triangulacion_kicker: asString(raw.triangulacion_kicker, d.triangulacion_kicker ?? ''),
    triangulacion_kicker_en: typeof raw.triangulacion_kicker_en === 'string' ? raw.triangulacion_kicker_en : d.triangulacion_kicker_en,
    triangulacion_title: asString(raw.triangulacion_title, d.triangulacion_title ?? ''),
    triangulacion_title_en: typeof raw.triangulacion_title_en === 'string' ? raw.triangulacion_title_en : d.triangulacion_title_en,
    triangulacion_desc: asString(raw.triangulacion_desc, d.triangulacion_desc ?? ''),
    triangulacion_desc_en: typeof raw.triangulacion_desc_en === 'string' ? raw.triangulacion_desc_en : d.triangulacion_desc_en,

    // Eje 02 · Bioquímica de origen
    bioquimica_kicker: asString(raw.bioquimica_kicker, d.bioquimica_kicker ?? ''),
    bioquimica_kicker_en: typeof raw.bioquimica_kicker_en === 'string' ? raw.bioquimica_kicker_en : d.bioquimica_kicker_en,
    bioquimica_title: asString(raw.bioquimica_title, d.bioquimica_title ?? ''),
    bioquimica_title_en: typeof raw.bioquimica_title_en === 'string' ? raw.bioquimica_title_en : d.bioquimica_title_en,
    bioquimica_desc: asString(raw.bioquimica_desc, d.bioquimica_desc ?? ''),
    bioquimica_desc_en: typeof raw.bioquimica_desc_en === 'string' ? raw.bioquimica_desc_en : d.bioquimica_desc_en,
    protocolo_title: asString(raw.protocolo_title, d.protocolo_title ?? ''),
    protocolo_title_en: typeof raw.protocolo_title_en === 'string' ? raw.protocolo_title_en : d.protocolo_title_en,
    protocolo_desc: asString(raw.protocolo_desc, d.protocolo_desc ?? ''),
    protocolo_desc_en: typeof raw.protocolo_desc_en === 'string' ? raw.protocolo_desc_en : d.protocolo_desc_en,

    // Eje 03 · Botánica melífera & Estación de origen
    biblioteca_kicker: asString(raw.biblioteca_kicker, d.biblioteca_kicker ?? ''),
    biblioteca_kicker_en: typeof raw.biblioteca_kicker_en === 'string' ? raw.biblioteca_kicker_en : d.biblioteca_kicker_en,
    biblioteca_title: asString(raw.biblioteca_title, d.biblioteca_title ?? ''),
    biblioteca_title_en: typeof raw.biblioteca_title_en === 'string' ? raw.biblioteca_title_en : d.biblioteca_title_en,
    biblioteca_desc: asString(raw.biblioteca_desc, d.biblioteca_desc ?? ''),
    biblioteca_desc_en: typeof raw.biblioteca_desc_en === 'string' ? raw.biblioteca_desc_en : d.biblioteca_desc_en,
    estacion_kicker: asString(raw.estacion_kicker, d.estacion_kicker ?? ''),
    estacion_kicker_en: typeof raw.estacion_kicker_en === 'string' ? raw.estacion_kicker_en : d.estacion_kicker_en,
    estacion_title: asString(raw.estacion_title, d.estacion_title ?? ''),
    estacion_title_en: typeof raw.estacion_title_en === 'string' ? raw.estacion_title_en : d.estacion_title_en,
    estacion_desc: asString(raw.estacion_desc, d.estacion_desc ?? ''),
    estacion_desc_en: typeof raw.estacion_desc_en === 'string' ? raw.estacion_desc_en : d.estacion_desc_en,
    estacion_cta_label: asString(raw.estacion_cta_label, d.estacion_cta_label ?? ''),
    estacion_cta_label_en: typeof raw.estacion_cta_label_en === 'string' ? raw.estacion_cta_label_en : d.estacion_cta_label_en,
    estacion_cta_href: asString(raw.estacion_cta_href, d.estacion_cta_href ?? ''),

    // Eje 04 · Contabilidad biofísica & Pecoreo
    metodologia_kicker: asString(raw.metodologia_kicker, d.metodologia_kicker ?? ''),
    metodologia_kicker_en: typeof raw.metodologia_kicker_en === 'string' ? raw.metodologia_kicker_en : d.metodologia_kicker_en,
    metodologia_title: asString(raw.metodologia_title, d.metodologia_title ?? ''),
    metodologia_title_en: typeof raw.metodologia_title_en === 'string' ? raw.metodologia_title_en : d.metodologia_title_en,
    metodologia_desc: asString(raw.metodologia_desc, d.metodologia_desc ?? ''),
    metodologia_desc_en: typeof raw.metodologia_desc_en === 'string' ? raw.metodologia_desc_en : d.metodologia_desc_en,
    pecoreo_kicker: asString(raw.pecoreo_kicker, d.pecoreo_kicker ?? ''),
    pecoreo_kicker_en: typeof raw.pecoreo_kicker_en === 'string' ? raw.pecoreo_kicker_en : d.pecoreo_kicker_en,
    pecoreo_title: asString(raw.pecoreo_title, d.pecoreo_title ?? ''),
    pecoreo_title_en: typeof raw.pecoreo_title_en === 'string' ? raw.pecoreo_title_en : d.pecoreo_title_en,
    pecoreo_desc: asString(raw.pecoreo_desc, d.pecoreo_desc ?? ''),
    pecoreo_desc_en: typeof raw.pecoreo_desc_en === 'string' ? raw.pecoreo_desc_en : d.pecoreo_desc_en,
    horizonte_title: asString(raw.horizonte_title, d.horizonte_title ?? ''),
    horizonte_title_en: typeof raw.horizonte_title_en === 'string' ? raw.horizonte_title_en : d.horizonte_title_en,
    horizonte_text: asString(raw.horizonte_text, d.horizonte_text ?? ''),
    horizonte_text_en: typeof raw.horizonte_text_en === 'string' ? raw.horizonte_text_en : d.horizonte_text_en,

    // Eje 05 · Respaldo y límites
    respaldo_title: asString(raw.respaldo_title, d.respaldo_title ?? ''),
    respaldo_title_en: typeof raw.respaldo_title_en === 'string' ? raw.respaldo_title_en : d.respaldo_title_en,
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
    show_tagline_badge: typeof raw.show_tagline_badge === 'boolean' ? raw.show_tagline_badge : d.show_tagline_badge,
    back_button_label: asString(raw.back_button_label, d.back_button_label),
    back_button_label_en: typeof raw.back_button_label_en === 'string' ? raw.back_button_label_en : d.back_button_label_en,
    login_card_title: asString(raw.login_card_title, d.login_card_title),
    login_card_title_en: typeof raw.login_card_title_en === 'string' ? raw.login_card_title_en : d.login_card_title_en,
    login_card_subtitle: asString(raw.login_card_subtitle, d.login_card_subtitle),
    login_card_subtitle_en: typeof raw.login_card_subtitle_en === 'string' ? raw.login_card_subtitle_en : d.login_card_subtitle_en,
    login_button_label: asString(raw.login_button_label, d.login_button_label),
    login_button_label_en: typeof raw.login_button_label_en === 'string' ? raw.login_button_label_en : d.login_button_label_en,
    register_card_title: asString(raw.register_card_title, d.register_card_title),
    register_card_title_en: typeof raw.register_card_title_en === 'string' ? raw.register_card_title_en : d.register_card_title_en,
    register_card_subtitle: asString(raw.register_card_subtitle, d.register_card_subtitle),
    register_card_subtitle_en: typeof raw.register_card_subtitle_en === 'string' ? raw.register_card_subtitle_en : d.register_card_subtitle_en,
    register_button_label: asString(raw.register_button_label, d.register_button_label),
    register_button_label_en: typeof raw.register_button_label_en === 'string' ? raw.register_button_label_en : d.register_button_label_en,
    show_birth_date: typeof raw.show_birth_date === 'boolean' ? raw.show_birth_date : d.show_birth_date,
    birth_date_required: typeof raw.birth_date_required === 'boolean' ? raw.birth_date_required : d.birth_date_required,
    birth_date_label: asString(raw.birth_date_label, d.birth_date_label),
    birth_date_label_en: typeof raw.birth_date_label_en === 'string' ? raw.birth_date_label_en : d.birth_date_label_en,
    birth_date_incentive: asString(raw.birth_date_incentive, d.birth_date_incentive),
    birth_date_incentive_en: typeof raw.birth_date_incentive_en === 'string' ? raw.birth_date_incentive_en : d.birth_date_incentive_en,
    background_style: pickEnum(raw.background_style, AUTH_BACKGROUND_STYLES, d.background_style),
    background_image_url: typeof raw.background_image_url === 'string' ? raw.background_image_url : d.background_image_url,
    particle_effect: pickEnum(raw.particle_effect, AUTH_PARTICLE_EFFECTS, d.particle_effect),
    blur_orb_color: typeof raw.blur_orb_color === 'string' ? raw.blur_orb_color : d.blur_orb_color,
    terms_checkbox_label: asString(raw.terms_checkbox_label, d.terms_checkbox_label ?? '').trim() || d.terms_checkbox_label,
    terms_checkbox_label_en:
      typeof raw.terms_checkbox_label_en === 'string' ? raw.terms_checkbox_label_en.trim() : d.terms_checkbox_label_en,
    marketing_checkbox_label: asString(raw.marketing_checkbox_label, d.marketing_checkbox_label ?? '').trim() || d.marketing_checkbox_label,
    marketing_checkbox_label_en:
      typeof raw.marketing_checkbox_label_en === 'string' ? raw.marketing_checkbox_label_en.trim() : d.marketing_checkbox_label_en,
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
  titulo_en?: string;
  descripcion: string;
  descripcion_en?: string;
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
  herramientas_servicio?: string[];
  materiales_exhibicion?: string[];
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

export type B2BMolecularPairingItem = {
  id: string;
  nombre: string;
  subtitulo?: string;
  formato: string;
  perfil_sensorial: string;
  perfil_bioquimico: string;
  par_en_barra: string;
  neurogastronomia: string;
  badge?: string;
  badge_bioquimico?: string;
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
  hero_image_opacity?: number;
  suggested_products_copy?: string;
  suggested_products_copy_en?: string;
  cta_text: string;
  cta_text_en?: string;
  cta_href: string;
  value_props: B2BValueProp[];
  stats: B2BStat[];
  process?: B2BProcessStep[];
  faq: B2BFaqItem[];
  kits?: B2BKitItem[];
  tools?: B2BToolItem[];
  commercial_strategy?: B2BCommercialStrategy;
  code_modules?: B2BCodeModule[];
  molecular_pairings?: B2BMolecularPairingItem[];
  material_badge?: string;
  material_badge_en?: string;
  material_title?: string;
  material_title_en?: string;
  material_description?: string;
  material_description_en?: string;
  tabletop_title?: string;
  tabletop_title_en?: string;
  tabletop_subtitle?: string;
  tabletop_subtitle_en?: string;
  staff_title?: string;
  staff_title_en?: string;
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
    ...(herramientas_servicio.length > 0 ? { herramientas_servicio } : {}),
    ...(materiales_exhibicion.length > 0 ? { materiales_exhibicion } : {}),
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

const B2B_SLOP_REGEX =
  /tixotr[oó]pic|TAS2R|T1R1|mouthfeel|piraz[ií]nic|alcaloide pur|granulometr[ií]a calibrada|lipoxigenasa|aw 0,45|reolog[ií]a|bactericida natural/i;

function cleanB2BSlop(val: string, fallback: string): string {
  if (!val) return fallback;
  if (B2B_SLOP_REGEX.test(val)) return fallback;
  return val;
}

export function parseB2BMolecularPairingItem(raw: unknown): B2BMolecularPairingItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nombre = asString(r.nombre ?? r.name, '').trim();
  if (!nombre) return null;
  const id = asString(r.id, '').trim() || nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id,
    nombre,
    subtitulo: typeof r.subtitulo === 'string' ? r.subtitulo.trim() : undefined,
    formato: asString(r.formato, '25 g (Pieza de Mesa / Sidecar) · 150 g (Reserva de Vitrina)').trim(),
    perfil_sensorial: asString(r.perfil_sensorial ?? r.perfilSensorial, '').trim(),
    perfil_bioquimico: asString(r.perfil_bioquimico ?? r.perfilBioquimico, '').trim(),
    par_en_barra: asString(r.par_en_barra ?? r.parEnBarra, '').trim(),
    neurogastronomia: asString(r.neurogastronomia, '').trim(),
    badge: typeof r.badge === 'string' ? r.badge.trim() : undefined,
    badge_bioquimico: typeof r.badge_bioquimico === 'string' ? r.badge_bioquimico.trim() : undefined,
  };
}

export const B2B_STORAGE_IMAGES = {
  cafeterias:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp',
  hoteles:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp',
  'tiendas-gourmet':
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp',
  ferias:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/1441c92d-0e75-44fe-aef7-476ccb2aaf74.webp',
  revendedores:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/020189d4-756b-4ea3-995e-b3413ffef179.webp',
} as const;

export const DEFAULT_B2B_CAFETERIAS: B2BSegmentContentSettings = {
  slug: 'cafeterias',
  tipo: 'cafeteria',
  kicker: 'ALIANZAS B2B · CAFETERÍAS DE ESPECIALIDAD & TOSTADURÍAS',
  kicker_en: 'B2B ALLIANCES · SPECIALTY COFFEE SHOPS & ROASTERIES',
  headline: 'El café de especialidad no se endulza en taza. Se acompaña en mesa.',
  headline_en: 'Specialty coffee is not sweetened in the cup. It is paired at the table.',
  subheadline:
    'Cuatro cremas de miel cruda batida en frío recolectadas en el bosque nativo de Chiloé (42°S), presentadas en piezas individuales de 25 g para servicio en mesa y frascos de 150 g para venta en mostrador. Respaldo analítico de origen y margen comercial del 41% al 48% para tu barra.',
  subheadline_en:
    'Four cold-churned raw honey creams harvested in the native forest of Chiloé (42°S), presented in 25 g individual table-service pieces and 150 g retail display jars. Analytical origin certification and 41% to 48% net margin for your coffee bar.',
  hero_image: B2B_STORAGE_IMAGES.cafeterias,
  hero_image_opacity: 35,
  suggested_products_copy:
    'Disponibles en Pieza de Mesa (25 g) y Reserva de Vitrina (150 g). Cuatro expresiones botánicas diseñadas para armonizar con el método de extracción y perfil de tueste de tu barra.',
  suggested_products_copy_en:
    'Available in Table Tasting Pieces (25 g) and Display Reserve (150 g). Four botanical expressions crafted to harmonize with your brew method and roast profile.',
  cta_text: 'Activar Kit Piloto ($78.400 neto)',
  cta_text_en: 'Activate Pilot Kit ($78,400 net)',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Dinámica de Mesa & Venta en Vitrina',
    titulo_en: 'Table Experience and Retail Display Dynamics',
    bajada:
      'El frasco de 25 g acompaña la cata en bandeja junto a la taza, activando por impulso la venta del frasco de 150 g en el mostrador.',
    bajada_en:
      'The 25 g jar accompanies the tray tasting alongside the cup, driving impulse purchases of the 150 g jar at the register.',
    aumento_ticket: 'Upsell de $2.500–$2.900 en mesa & $9.500 PVP en vitrina',
    aumento_ticket_en: 'Table upsell of $2,500–$2,900 & $9,500 retail at checkout',
    mecanica_ventas: [
      'Paso 1: Servicio en bandeja con pieza de 25 g y microespátula junto a la taza, preservando acidez y aromas florales.',
      'Paso 2: Cata en paladar antes o entre sorbos de espresso o filtrado, disfrutando el contrapunto botánico.',
      'Paso 3: Degustaciones ágiles en mesón de pago con frascos Tester de 150 g bonificados.',
      'Paso 4: Venta de frascos de 150 g en vitrina con precio equivalente a una bolsa de café de 250 g.',
    ],
    herramienta_clave: 'Código QR de Lote, Tarjeta A6 & Frascos Tester Bonificados',
    herramienta_clave_en: 'Batch QR Code, A6 Table Card & Free Tester Jars',
  },
  molecular_pairings: [
    {
      id: 'miel-virgen-cruda-ulmo',
      nombre: 'Miel Virgen Cruda de Ulmo',
      subtitulo: 'Floración de Eucryphia cordifolia · Chiloé 42°S',
      formato: '25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)',
      perfil_sensorial:
        'Miel monofloral de Ulmo batida en frío. Textura aterciopelada, notas de jazmín, anís estrella, sutil fondo mentolado y frescor balsámico.',
      perfil_bioquimico:
        'Servicio en bandeja con microespátula fuera de la taza. Acompañamiento limpio que resalta los aromas florales sin alterar la acidez ni la temperatura de extracción.',
      par_en_barra:
        'Cafés lavados de alta altitud y acidez limpia (Etiopía Yirgacheffe, Kenia Nyeri, Colombia Huila).',
      neurogastronomia:
        'La microdosis en espátula aporta frescor balsámico y notas florales que limpian el paladar entre sorbos de café de alta acidez.',
      badge: 'Formulación 01 · Floral & Cítrico',
      badge_bioquimico: 'Ulmo Monofloral',
    },
    {
      id: 'avellana-chilena-gevuina',
      nombre: 'Crema Batida con Avellana Chilena Tostada',
      subtitulo: 'Gevuina avellana silvestre tostada en frío',
      formato: '25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)',
      perfil_sensorial:
        'Miel cruda emulsionada con harina fina de avellana chilena silvestre tostada a baja temperatura. Notas cálidas de madera tostada, praliné profundo y toque terroso.',
      perfil_bioquimico:
        'Textura untable y cremosa que no se separa a temperatura ambiente. Ideal para acompañar bebidas lácteas sin romper la microespuma.',
      par_en_barra:
        'Bebidas con leche texturizada (Flat White, Cappuccino, Cortado) y espressos de tueste medio (proceso natural / honey).',
      neurogastronomia:
        'Armonía cálida de avellana tostada y notas de praliné que complementa la dulzura natural de la leche emulsionada.',
      badge: 'Formulación 02 · Lácteo & Tostado',
      badge_bioquimico: 'Avellana Silvestre',
    },
    {
      id: 'nibs-cacao-crudo-santander',
      nombre: 'Crema Batida con Nibs de Cacao Crudo',
      subtitulo: 'Cacao criollo molido en frío · Astringencia Noble',
      formato: '25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)',
      perfil_sensorial:
        'Miel cruda combinada con nibs de cacao criollo molidos en frío. Contrapunto amargo noble, notas de frutos rojos secos y mora silvestre.',
      perfil_bioquimico:
        'Molienda fina integrada en frío que preserva los flavonoides naturales del cacao y aporta textura crujiente sutil.',
      par_en_barra:
        'Espressos dobles intensos, Cold Brew de extracción lenta y cafés de proceso anaeróbico o fermentación prolongada.',
      neurogastronomia:
        'El contrapunto amargo noble del cacao limpia el dulzor y prepara el paladar para apreciar los matices achocolatados y vinosos del espresso.',
      badge: 'Formulación 03 · Amargo & Vinoso',
      badge_bioquimico: 'Cacao Criollo',
    },
    {
      id: 'polen-floral-nativo',
      nombre: 'Crema Batida con Polen Floral Nativo de Chiloé',
      subtitulo: 'Polen apícola de bosque templado lluvioso',
      formato: '25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)',
      perfil_sensorial:
        'Miel cruda con microgránulos de polen floral de bosque templado lluvioso. Notas minerales, cereal tostado, umami dulce y textura crujiente suave.',
      perfil_bioquimico:
        'Suspensión natural de polen floral nativo rico en aminoácidos y minerales, integrado mecánicamente sin calor.',
      par_en_barra:
        'Variedades botánicas delicadas en pour over (Geisha, Pacamara, Sidra) y bebidas de especialidad (Matcha Ceremonial, Hojicha).',
      neurogastronomia:
        'Textura crujiente suave y notas de cereal tostado que rompen la monotonía líquida y prolongan el retrogusto del filtrado.',
      badge: 'Formulación 04 · Exótico & Pour Over',
      badge_bioquimico: 'Polen Nativo',
    },
  ],
  tools: [],
  kits: [
    {
      id: 'piloto-validacion',
      nombre: 'KIT 01: Piloto de Validación (15 Días)',
      nombre_en: 'KIT 01: Validation Pilot (15 Days)',
      badge: 'Iniciación · Sin Riesgo',
      tier: 'entrada',
      tagline: 'Validar rotación en mesa y vitrina con riesgo financiero mínimo',
      tagline_en: 'Validate table and retail rotation with minimal financial risk',
      descripcion:
        'Una selección ágil y sin fricción de las 4 formulaciones botánicas en 25 g y 150 g para comprobar la aceptación en mesa y vitrina con soporte técnico y exhibidor de mostrador.',
      descripcion_en:
        'A frictionless selection of all 4 botanical formulations in 25 g and 150 g to validate table and retail adoption with counter display and A6 technical cards.',
      precio_neto_clp: 78400,
      pvp_estimado_clp: 159200,
      margen_estimado_pct: 41,
      moq_summary: '32 piezas 25g + 8 frascos 150g + exhibidor',
      sales_strategy:
        'Inversión: $78.400 neto (~$93.296 IVA inc.). Venta total: $159.200 PVP ($133.782 venta neta). Utilidad neta limpia: +$55.382 netos (41,4% margen real, +70,6% ROI).',
      sales_strategy_en:
        'Net investment: $78,400 CLP. Total sales: $159,200 CLP ($133,782 net). Clean net profit: +$55,382 CLP (41.4% real margin, +70.6% ROI).',
      componentes_fisicos: [
        {
          cantidad: '32 un.',
          item: 'Piezas de Mesa 25g',
          detalle: '8 Virgen Ulmo, 8 Avellana Chilena, 8 Cacao Santander, 8 Polen Floral',
        },
        {
          cantidad: '8 un.',
          item: 'Reserva de Vitrina 150g',
          detalle: '2 Virgen Ulmo, 2 Avellana Chilena, 2 Cacao Santander, 2 Polen Floral',
        },
        {
          cantidad: '1 un.',
          item: 'Exhibidor Minimalista',
          detalle: 'Display de mostrador compacto para mesón de pago',
        },
        {
          cantidad: '12 un.',
          item: 'Tarjetas de Mesa A6',
          detalle: 'Fichas de mesa con protocolo de cata y QR de lote',
        },
      ],
      materiales_exhibicion: [
        'Exhibidor minimalista de mostrador',
        '12 tarjetas de mesa A6 con QR de lote y protocolo de maridaje',
      ],
      integraciones_digitales: [
        {
          titulo: 'Trazabilidad Analítica QR por Lote',
          titulo_en: 'Batch Analytical QR Traceability',
          descripcion:
            'Acceso directo a análisis de laboratorio (humedad <18%, HMF 2,76 mg/kg, diastasa 23,1 Schade)',
          descripcion_en:
            'Direct access to laboratory certificates (moisture <18%, HMF 2.76 mg/kg, diastase 23.1 Schade)',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Protocolo Barista Botanical Sidecar',
          titulo_en: 'Botanical Sidecar Barista Protocol',
          descripcion:
            'Guía técnica para servir la crema en frío (<40°C) sin alterar el pH del café',
          descripcion_en:
            'Technical protocol for sequential tasting under 40°C preserving cup extraction',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Barras de especialidad y tostadurías independientes que inician validación en mesa y vitrina',
      recomendado_para_en:
        'Specialty coffee bars and independent roasteries initiating table and retail validation',
    },
    {
      id: 'traccion-barista',
      nombre: 'KIT 02: Tracción Barista (Mensual · Recomendado)',
      nombre_en: 'KIT 02: Barista Traction (Monthly · Recommended)',
      badge: 'Más Elegido · Recomendado',
      tier: 'medio',
      tagline: 'Abastecimiento mensual estándar para 1 local con impulso activo de baristas',
      tagline_en: 'Standard monthly supply for 1 location with active barista advocacy',
      descripcion:
        'El equilibrio perfecto entre rotación de salón y venta retail. Incluye 4 frascos Tester bonificados de 150 g para ofrecer microcatas gratuitas de 5 segundos en caja.',
      descripcion_en:
        'The ideal balance between salon rotation and retail sales. Includes 4 complimentary 150 g Tester jars for 5-second counter tastings.',
      precio_neto_clp: 204000,
      pvp_estimado_clp: 436000,
      margen_estimado_pct: 44,
      moq_summary: '80 piezas 25g + 24 frascos 150g + 4 Testers bonificados',
      sales_strategy:
        'Inversión: $204.000 neto (~$242.760 IVA inc.). Venta total: $436.000 PVP ($366.387 venta neta). Utilidad neta limpia: +$162.387 netos (44,3% margen real, +79,6% ROI).',
      sales_strategy_en:
        'Net investment: $204,000 CLP. Total sales: $436,000 CLP ($366,387 net). Clean net profit: +$162,387 CLP (44.3% real margin, +79.6% ROI).',
      componentes_fisicos: [
        {
          cantidad: '80 un.',
          item: 'Piezas de Mesa 25g',
          detalle: '20 Virgen Ulmo, 20 Avellana Chilena, 20 Cacao Santander, 20 Polen Floral',
        },
        {
          cantidad: '24 un.',
          item: 'Reserva de Vitrina 150g',
          detalle: '6 Virgen Ulmo, 6 Avellana Chilena, 6 Cacao Santander, 6 Polen Floral',
        },
        {
          cantidad: '4 un.',
          item: 'Frascos 150g Tester de Barra',
          detalle: 'Bonificados sin costo (1 por variedad) para microdegustaciones al ordenar',
        },
        {
          cantidad: '1 un.',
          item: 'Exhibidor de Mostrador + Accesorios',
          detalle: '25 tarjetas A6 plastificadas + 20 microespátulas de cata',
        },
      ],
      materiales_exhibicion: [
        'Exhibidor de mostrador de madera noble',
        '25 tarjetas de mesa A6 plastificadas',
        '20 microespátulas de cata para barra',
      ],
      integraciones_digitales: [
        {
          titulo: 'Módulo QR Interactivo para Carta Digital',
          titulo_en: 'Interactive QR Module for Digital Menu',
          descripcion:
            'Pasaporte botánico interactivo enlazable a la carta digital de tu cafetería',
          descripcion_en:
            'Interactive botanical passport linked to your digital menu',
          tag: 'marketing',
        },
        {
          titulo: 'Activación en Directorio de Cafeterías Aliadas',
          titulo_en: 'Specialty Coffee Shop Directory Listing',
          descripcion:
            'Visibilidad oficial para comensales en el mapa público de aliados de Enjambre Legado',
          descripcion_en:
            'Official listing on Enjambre Legado public partner map',
          tag: 'resenas',
        },
      ],
      recomendado_para:
        'Cafeterías de especialidad de flujo regular con prescripción activa del equipo de barra',
      recomendado_para_en:
        'Specialty coffee shops with steady foot traffic and active barista advocacy',
    },
    {
      id: 'ecosistema-tostaduria',
      nombre: 'KIT 03: Ecosistema Tostaduría (Alta Rotación)',
      nombre_en: 'KIT 03: Roastery Ecosystem (High Rotation)',
      badge: 'Escala & Tostadurías',
      tier: 'avanzado',
      tagline: 'Suministro integral para tostadurías, flagships o locales de alto flujo con co-branding',
      tagline_en: 'Comprehensive supply for roasteries, flagships, or high-volume stores with co-branding',
      descripcion:
        'La solución total de máxima escala y rentabilidad. Incluye 8 frascos Tester bonificados, doble exhibidor y personalización de marca (co-branding en tarjetas A6) calibrado con tus cafés de la casa.',
      descripcion_en:
        'The comprehensive volume and profitability package. Includes 8 free Tester jars, dual display, and co-branding on A6 cards calibrated to your house beans.',
      precio_neto_clp: 377600,
      pvp_estimado_clp: 872000,
      margen_estimado_pct: 49,
      moq_summary: '160 piezas 25g + 48 frascos 150g + 8 Testers bonificados',
      sales_strategy:
        'Inversión: $377.600 neto (~$449.344 IVA inc.). Venta total: $872.000 PVP ($732.773 venta neta). Utilidad neta limpia: +$355.173 netos (48,5% margen real, +94,1% ROI).',
      sales_strategy_en:
        'Net investment: $377,600 CLP. Total sales: $872,000 CLP ($732,773 net). Clean net profit: +$355,173 CLP (48.5% real margin, +94.1% ROI).',
      componentes_fisicos: [
        {
          cantidad: '160 un.',
          item: 'Piezas de Mesa 25g',
          detalle: '40 Virgen Ulmo, 40 Avellana Chilena, 40 Cacao Santander, 40 Polen Floral',
        },
        {
          cantidad: '48 un.',
          item: 'Reserva de Vitrina 150g',
          detalle: '12 Virgen Ulmo, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral',
        },
        {
          cantidad: '8 un.',
          item: 'Frascos 150g Tester de Barra',
          detalle: 'Bonificados sin costo (2 por variedad) para cata activa en barra y sala',
        },
        {
          cantidad: '1 pack',
          item: 'Doble Exhibidor + Co-Branding A6',
          detalle: '50 tarjetas A6 con el logo de tu cafetería y calibración sensorial de tueste',
        },
      ],
      materiales_exhibicion: [
        'Doble exhibidor de mostrador y vitrina',
        '50 tarjetas de mesa A6 con co-branding (logo de la cafetería)',
      ],
      integraciones_digitales: [
        {
          titulo: 'Calibración Sensorial de Tueste con Granos de la Casa',
          titulo_en: 'Roast Profile Calibration with House Beans',
          descripcion:
            'Estudio de resonancia fitoquímica entre tus lotes de café y nuestras 4 matrices botánicas',
          descripcion_en:
            'Phytochemical resonance mapping between your coffee beans and our 4 botanical matrices',
          tag: 'marketing',
        },
        {
          titulo: 'Acceso Preferente a Tramos Mayoristas',
          titulo_en: 'Priority Wholesale Tier Access',
          descripcion:
            'Reposición continua prioritaria directo desde Chiloé con condiciones comerciales de escala',
          descripcion_en:
            'Priority continuous restocking directly from Chiloé under volume terms',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Tostadurías, cafeterías con múltiples barras o locales insignia de alto volumen',
      recomendado_para_en:
        'Roasteries, multi-bar coffee shops, or high-volume flagship venues',
    },
  ],
  value_props: [
    {
      icon: 'Droplets',
      title: '01. Servicio al Lado de la Taza (< 40 °C)',
      description:
        'Servido en pieza cilíndrica de vidrio de 25 g junto a la taza. El comensal degusta la crema batida en frío en paladar antes o entre sorbos de café, preservando los aromas botánicos y la extracción calibrada del barista.',
    },
    {
      icon: 'Layers',
      title: '02. Textura Cremada Sin Goteo',
      description:
        'Microcristalización mecánica en frío a menos de 20 °C (< 18% de humedad controlada). Textura sedosa que mantiene en suspensión homogénea la avellana chilena, el cacao y el polen nativo, sin goteos ni mermas en barra.',
    },
    {
      icon: 'QrCode',
      title: '03. Trazabilidad Analítica QR por Lote',
      description:
        'Cada frasco de 25 g y 150 g integra acceso digital al apiario de origen en Pureo (Queilén, Chiloé), porcentaje de polen nativo, fecha de recolección y notas de cata para tu equipo.',
    },
  ],
  stats: [
    { value: '< 18%', label: 'Humedad Certificada' },
    { value: '0% Calor', label: 'Cruda y sin pasteurizar' },
    { value: '25g / 150g', label: 'Mesa y Vitrina' },
    { value: '41–48%', label: 'Margen neto real' },
  ],
  material_badge: 'Material Físico & Soporte de Sala Incluido',
  material_badge_en: 'Physical Assets & Table Support Included',
  material_title: 'Herramientas Tangibles para tu Barra',
  material_title_en: 'Tangible Tools for Your Coffee Bar',
  material_description:
    'Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: tarjetas de mesa en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.',
  material_description_en:
    'Upon activating your commercial alliance, you receive all physical materials ready to operate from day one: heavy-weight cotton table cards with batch origin QR, bamboo micro-spatulas, and service guides for your staff.',
  tabletop_title: 'Tarjeta de Mesa: Protocolo de Maridaje',
  tabletop_title_en: 'Table Card: Pairing Protocol',
  tabletop_subtitle: 'Guía de cata en 3 tiempos para disfrutar tu café de especialidad con miel cruda.',
  tabletop_subtitle_en: '3-step tasting guide to enjoy your specialty coffee with raw honey.',
  staff_title: 'Guía Rápida para Baristas & Personal de Barra',
  staff_title_en: 'Quick Guide for Baristas & Coffee Bar Staff',
  faq: [
    {
      question: '¿Por qué servir el formato de 25 g junto a la taza (Sidecar) y no disuelto adentro?',
      answer:
        'Porque las altas temperaturas evaporan los aromas florales más sutiles de la miel cruda y alteran el equilibrio de acidez de una extracción calibrada. La degustación secuencial con microespátula respeta al 100% el trabajo del barista y permite disfrutar ambos perfiles en contrapunto.',
    },
    {
      question: '¿Se endurece o separa la miel en la barra?',
      answer:
        'No. Nuestro proceso de cremado mecánico en frío a menos de 20 °C genera cristales microscópicos homogéneos, manteniendo una textura suave y untable que no se separa ni endurece a temperatura ambiente.',
    },
    {
      question: '¿Cómo se capacita al equipo de baristas para asegurar la rotación?',
      answer:
        'Cada kit incluye fichas técnicas de cata A6 y, a partir del Kit Tracción Barista, incorporamos frascos Tester de 150 g sin costo para que tu equipo ofrezca microcatas en barra en 5 segundos, disparando la venta en mesa y vitrina.',
    },
  ],
  seo_title: 'Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano',
  seo_description:
    'Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen.',
};

export const DEFAULT_B2B_HOTELES: B2BSegmentContentSettings = {
  slug: 'hoteles',
  tipo: 'hotel',
  kicker: 'ALIANZAS B2B · HOSPITALIDAD DE AUTOR & LODGES',
  kicker_en: 'B2B ALLIANCES · BOUTIQUE HOSPITALITY & LODGES',
  headline: 'Miel Cruda de Bosque Nativo de Chiloé (42°S) para Hotelería de Autor',
  headline_en: 'Native Rainforest Raw Honey from Chiloé (42°S) for Signature Hospitality',
  subheadline:
    'Formatos en 25 g para amenidad de bienvenida y cata en mesa de desayuno, y frascos de 150 g para vitrina de recepción y boutique. Miel cruda certificada de bosque nativo que transforma la cortesía en un recuerdo de viaje.',
  subheadline_en:
    'Modular formats in 25 g for welcome amenities and breakfast tastings, and 150 g jars for front-desk retail and hotel boutique. Certified raw native honey turning courtesy into a travel memory.',
  hero_image: B2B_STORAGE_IMAGES.hoteles,
  hero_image_opacity: 35,
  suggested_products_copy:
    'Disponibles en Formato 25 g (Amenidad & Desayuno) y Frasco 150 g (Boutique de Recepción). Cuatro variedades botánicas de Chiloé diseñadas para bienvenida en suite, mesa de desayuno y boutique.',
  suggested_products_copy_en:
    'Available in 25 g (Amenity & Breakfast Tasting) and 150 g (Front Desk Boutique). Four botanical varieties from Chiloé designed for in-suite welcome, breakfast tables, and retail boutique.',
  cta_text: 'Solicitar Muestras de Degustación',
  cta_text_en: 'Request Tasting Samples',
  cta_href: '#registro',
  value_props: [
    {
      icon: 'ShieldCheck',
      title: 'Amenidad de Bienvenida en Habitación (25 g)',
      description:
        'Frasco individual de vidrio con apertura sellada para turndown nocturno o bandeja de llegada, sin plásticos de un solo uso.',
    },
    {
      icon: 'Layers',
      title: 'Cata en Salón de Desayuno',
      description:
        'Formato para mesa de desayuno de autor que acompaña quesos de campo, bollería de masa madre e infusiones nativas con textura untable sin goteo.',
    },
    {
      icon: 'TrendingUp',
      title: 'Frasco de Recuerdo en Recepción (150 g)',
      description:
        'Producto de alta rotación en el checkout para que el huésped lleve el sabor del bosque consigo. Formato apto para equipaje de mano en vuelos nacionales e internacionales.',
    },
    {
      icon: 'QrCode',
      title: 'Trazabilidad y Análisis de Lote',
      description:
        'Cada frasco enlaza al pasaporte de lote oficial: humedad < 18%, análisis de polen nativo y coordenadas exactas del apiario en Chiloé.',
    },
  ],
  stats: [
    { value: '25 g', label: 'Amenidad de Habitación' },
    { value: '150 g', label: 'Formato Souvenir Boutique' },
    { value: '< 18%', label: 'Humedad Controlada' },
    { value: 'Chiloé 42°S', label: 'Apiarios Fijos de Bosque' },
  ],
  material_badge: 'Material Físico & Soporte de Sala Incluido',
  material_badge_en: 'Physical Assets & Table Support Included',
  material_title: 'Herramientas Tangibles para tu Hotel',
  material_title_en: 'Tangible Tools for Your Boutique Hotel',
  material_description:
    'Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: tarjetas de habitación en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.',
  material_description_en:
    'Upon activating your commercial alliance, you receive all physical materials ready to operate from day one: heavy-weight cotton room cards with batch origin QR, bamboo micro-spatulas, and service guides for your staff.',
  tabletop_title: 'Tarjeta de Habitación & Desayuno',
  tabletop_title_en: 'Room & Breakfast Table Card',
  tabletop_subtitle: 'Bienvenido a un territorio vivo. Conoce el origen de la miel que acompaña tu estadía.',
  tabletop_subtitle_en: 'Welcome to a living territory. Discover the origin of the honey accompanying your stay.',
  staff_title: 'Protocolo de Servicio para Personal de Sala & Desayuno',
  staff_title_en: 'Service Protocol for Dining Room & Breakfast Staff',
  faq: [
    {
      question: '¿Cómo se presenta el envase de 150 g para huéspedes que viajan?',
      answer:
        'Nuestros frascos de 150 g están herméticamente sellados con lacre y etiqueta de alta resistencia. Su volumen y dimensiones son aptos para transporte seguro en equipaje de viaje.',
    },
    {
      question: '¿Cuál es el origen y estándar botánico de la miel de Ulmo?',
      answer:
        'Miel cruda monofloral de Eucryphia cordifolia recolectada en apiarios fijos del bosque nativo de Chiloé, bajo norma chilena NCh2981 con más del 45% de dominancia polínica y humedad natural menor al 18%.',
    },
    {
      question: '¿Cómo se conserva la Miel con Avellana Chilena?',
      answer:
        'Elaboramos una emulsión mecánica en frío que integra avellana chilena silvestre tostada en la miel cruda, manteniendo una textura cremada homogénea sin separación de fases ni conservantes artificiales durante más de 12 meses.',
    },
    {
      question: '¿Cómo solicitar muestras de degustación antes de emitir una orden?',
      answer:
        'A través del formulario de esta página. Despachamos a gerencia general o jefatura de alimentos y bebidas una selección de degustación para validar texturas, notas aromáticas y presentación de sala.',
    },
  ],
  commercial_strategy: {
    titulo: 'Dinámica de Experiencia en Habitación y Venta en Recepción',
    titulo_en: 'Room Experience and Front Desk Retail Dynamics',
    bajada:
      'La disposición del frasco de 25 g como cortesía activa el descubrimiento del producto y estimula la compra del frasco de 150 g en el checkout como recuerdo de viaje.',
    bajada_en:
      'The 25 g jar courtesy amenity drives product discovery and encourages guests to purchase the 150 g retail jar at checkout as a travel souvenir.',
    aumento_ticket:
      'Recaudación complementaria en recepción que amortiza la inversión en amenidades y entrega utilidad líquida.',
    aumento_ticket_en:
      'Complementary front-desk retail revenue that amortizes amenity investments while delivering net profit.',
    herramienta_clave:
      'Atril de Mesón de Recepción, Pasaportes de Habitación Bilingües & Frascos de 150 g',
    herramienta_clave_en:
      'Front Desk Display, Bilingual Room Botanical Passports & 150 g Jars',
    mecanica_ventas: [
      'Paso 1: Disposición del frasco de 25 g en turndown nocturno o mesa de desayuno junto a su Pasaporte Botánico.',
      'Paso 2: El huésped degusta la textura sedosa y los aromas de bosque nativo.',
      'Paso 3: El pasaporte indica que el frasco de 150 g para llevar está disponible en recepción.',
      'Paso 4: En el checkout, el atril de mesón permite al huésped llevarse el frasco como recuerdo auténtico de su viaje.',
    ],
  },
  tools: [],
  kits: [
    {
      id: 'kit-piloto-i-ritual-cata',
      nombre: 'Kit Piloto I: Ritual & Cata Horizontal',
      badge: 'Tracción Operativa · Solo 25 g',
      tier: 'entrada',
      tagline: 'Validación de experiencia del huésped en turndown, excursiones y desayuno VIP sin compromiso de tienda',
      descripcion:
        'Dotación concentrada de 120 amenidades de 25 g distribuidas equilibradamente en las cuatro formulaciones bioactivas, complementadas con 3 regletas de cata en madera nativa, pasaportes bilingües y protocolo de servicio.',
      precio_neto_clp: 168000,
      pvp_estimado_clp: 280000,
      margen_estimado_pct: 40,
      moq_summary: '120 piezas 25 g + 3 regletas cata + 60 pasaportes',
      sales_strategy:
        'Costo por habitación ocupada de apenas $1.400 CLP (~$1,50 USD), una fracción marginal frente al costo laboral de $9 USD de un turndown de lujo en lodges que cobran más de $500 USD por noche.',
      componentes_fisicos: [
        {
          cantidad: '120 un.',
          item: 'Mini Frascos de Cortesía 25 g',
          detalle: '30× Ulmo Puro APF, 30× Avellana Chilena ω-7, 30× Polen Biomimético, 30× Cacao Nibs Santander',
        },
        {
          cantidad: '3 un.',
          item: 'Regletas de Cata Horizontal',
          detalle: 'Madera nativa cepillada con 4 cavidades calibradas para Tasting Flights en suites o salón',
        },
        {
          cantidad: '60 un.',
          item: 'Pasaportes Botánicos A6',
          detalle: 'Papel algodón bilingüe (ES/EN) con relato bioactivo del bosque a 42°S y QR de trazabilidad',
        },
        {
          cantidad: '1 un.',
          item: 'Protocolo Técnico de Servicio',
          detalle: 'Ficha impermeable de 1 página para garzones y housekeeping con temperaturas y maridajes',
        },
      ],
      herramientas_servicio: [
        '3 Regletas de cata horizontal en madera nativa para Tasting Flights',
        'Protocolo técnico plastificado para equipo de sala y camareras',
        'Guía de servicio para turndown nocturno e infusiones de autor',
      ],
      materiales_exhibicion: [
        '60 Pasaportes Botánicos de Habitación A6 en papel algodón',
        'Atriles de mesa minimalistas para desayuno',
        'Certificado analítico NCh2981 del lote vigente enmarcable',
      ],
      integraciones_digitales: [
        {
          titulo: 'Cata Sensorial Bilingüe en Suite',
          descripcion: 'El huésped escanea el QR del frasco y explora la curva aromática y el factor APF.',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Trazabilidad Oficial NCh2981',
          descripcion: 'Informe melisopalinológico y análisis de pureza descargable.',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Directores de Alimentos & Bebidas y Gobernanta que buscan validar la respuesta sensorial de sus huéspedes con riesgo cero de inventario.',
    },
    {
      id: 'kit-piloto-ii-ecosistema-circular',
      nombre: 'Kit Piloto II: Ecosistema Circular Auto-Liquidable',
      badge: 'Costo Neto Cero · 25 g + 150 g',
      tier: 'avanzado',
      tagline: 'Financiar el 100% de las amenidades de cortesía mediante la venta del formato 150 g en recepción',
      descripcion:
        'Ecosistema comercial cerrado: combina 80 frascos de 25 g para bienvenidas y catas con 28 frascos de 150 g Cabin-Safe para vitrina de checkout. La venta de los 28 frascos de 150 g recauda $336.000 netos, recuperando el 100% de la factura del hotel y generando $41.000 netos de excedente más 80 amenidades gratuitas.',
      precio_neto_clp: 295000,
      pvp_estimado_clp: 479840,
      margen_estimado_pct: 38,
      moq_summary: '80 piezas 25 g + 28 frascos 150 g + glorificador',
      sales_strategy:
        'Inversión neta: $295.000 CLP. Venta de 28 frascos de 150 g a PVP $14.280 IVA inc. ($12.000 neto): recauda $336.000 netos. Amortiza el 100% de la factura ($295.000), genera +$41.000 CLP de utilidad líquida y 80 amenidades de 25 g resultan 100% gratuitas.',
      componentes_fisicos: [
        {
          cantidad: '80 un.',
          item: 'Piezas de Cortesía 25 g',
          detalle: '20× Ulmo Puro APF, 20× Avellana ω-7, 20× Polen, 20× Cacao Nibs',
        },
        {
          cantidad: '28 un.',
          item: 'Reserva de Recepción 150 g (Cabin-Safe)',
          detalle: '7× Ulmo Puro, 7× Avellana ω-7, 7× Polen, 7× Cacao Nibs (Net Vol. 98 ml TSA Approved)',
        },
        {
          cantidad: '1 un.',
          item: 'Glorificador Minimalista de Recepción',
          detalle: 'Exhibidor de mesón para las 4 variedades de 150 g con frascos probadores de aroma',
        },
        {
          cantidad: '2 un.',
          item: 'Regletas de Cata Horizontal',
          detalle: 'Para servicio de desayuno en mesa y suites preferentes',
        },
        {
          cantidad: '80 un.',
          item: 'Pasaportes Botánicos de Habitación',
          detalle: 'Con llamado explícito al huésped a adquirir la reserva de 150 g en recepción antes de su vuelo',
        },
      ],
      herramientas_servicio: [
        '1 Glorificador minimalista de lobby para mesón de recepción y checkout',
        '2 Regletas de cata horizontal en madera nativa para desayuno VIP',
        'Briefing Card rígida e impermeable para personal de recepción y salón',
      ],
      materiales_exhibicion: [
        '80 Pasaportes Botánicos A6 bilingües con invitación a boutique de recepción',
        'Frascos probadores tester de 150 g para mesón de checkout',
        'Lámina enmarcable de certificación melisopalinológica de origen',
      ],
      integraciones_digitales: [
        {
          titulo: 'Conversión Cruzada Suite a Recepción',
          descripcion: 'Pasaporte de habitación con QR que invita a retirar la reserva de 150 g antes del vuelo.',
          tag: 'marketing',
        },
        {
          titulo: 'Certificación Cabin & TSA Approved',
          descripcion: 'Garantía volumétrica de 98 ml para tránsito aeroportuario sin decomiso.',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Membresía Digital para Huéspedes',
          descripcion: 'Pase digital para Apple/Google Wallet con trazabilidad y beneficios en próximas visitas.',
          tag: 'fidelizacion',
        },
      ],
      recomendado_para:
        'Gerentes Generales, Propietarios y Directores de Finanzas que exigen un retorno de inversión transparente e inmediato sin gasto muerto.',
    },
  ],
  molecular_pairings: [
    {
      id: 'miel-cruda-pura-ulmo',
      nombre: 'Miel Cruda Pura de Ulmo & Tiaca (42°S)',
      subtitulo: 'Floración monofloral de bosque nativo',
      formato: '25 g (Amenidad / Turndown) · 150 g (Boutique de Recepción)',
      perfil_sensorial:
        'Miel monofloral de Ulmo cremada en frío. Textura sedosa sin goteo, notas de jazmín blanco, anís estrella, sutil fondo mentolado y frescor balsámico.',
      perfil_bioquimico:
        'Miel pura sin pasteurizar con textura cremada en frío. Ideal para el servicio de turndown en suites junto a una infusión de autor o descanso nocturno.',
      par_en_barra:
        'Ritual Nocturno (Turndown Service) & Infusiones: Acompañamiento en habitación para inducir descanso natural.',
      neurogastronomia:
        'Aromas balsámicos y notas florales suaves que reconfortan el paladar en la tranquilidad de la suite.',
      badge: 'Variedad 01 · Pureza & Ritual Nocturno',
      badge_bioquimico: 'Ulmo Monofloral',
    },
    {
      id: 'miel-avellana-chilena-gevuina',
      nombre: 'Miel con Avellana Chilena Tostada',
      subtitulo: 'Gevuina avellana silvestre tostada en frío',
      formato: '25 g (Cata en Desayuno) · 150 g (Boutique de Recepción)',
      perfil_sensorial:
        'Emulsión untable de miel cruda y avellana chilena silvestre recién tostada. Notas cálidas de praliné nativo, madera noble tostada y un fondo envolvente de toffee natural.',
      perfil_bioquimico:
        'Emulsión suave y untable de miel cruda y avellana chilena silvestre tostada, perfecta para el salón de desayuno.',
      par_en_barra:
        'Gastronomía Matinal & Cata de Mesa: Para acompañar pan de masa madre, quesos de campo y frutas en el desayuno de autor.',
      neurogastronomia:
        'Notas cálidas de praliné nativo y avellana tostada que equilibran preparaciones lácteas y ácidas.',
      badge: 'Variedad 02 · Gastronomía Matinal',
      badge_bioquimico: 'Avellana Silvestre',
    },
    {
      id: 'miel-polen-floral-apicola',
      nombre: 'Miel con Polen Floral Apícola Nativo',
      subtitulo: 'Polen apícola de bosque templado lluvioso',
      formato: '25 g (Estación Bienestar) · 150 g (Boutique de Recepción)',
      perfil_sensorial:
        'Miel cruda con microgránulos de polen floral nativo. Textura perlada y aterciopelada, notas florales silvestres, cereal tostado y umami dulce.',
      perfil_bioquimico:
        'Miel cruda con microgránulos de polen floral nativo rico en nutrientes naturales y textura perlada.',
      par_en_barra:
        'Estación Saludable & Spa: Consumo directo en ayunas o en el buffet de bienestar antes de iniciar la jornada.',
      neurogastronomia:
        'Notas de cereal tostado y umami dulce que aportan energía limpia y persistencia en boca.',
      badge: 'Variedad 03 · Bienestar & Desayuno',
      badge_bioquimico: 'Polen Floral Nativo',
    },
    {
      id: 'miel-cacao-nibs-santander',
      nombre: 'Miel con Cacao Nibs de Santander',
      subtitulo: 'Cacao criollo con notas de mora silvestre',
      formato: '25 g (Acompañamiento Excursión) · 150 g (Boutique de Recepción)',
      perfil_sensorial:
        'Miel del bosque templado combinada con nibs tostados de cacao criollo. Contraste de texturas (cremosa y crujiente), notas de frutos rojos, mora silvestre y chocolate noble.',
      perfil_bioquimico:
        'Contraste crujiente de nibs de cacao criollo y miel de bosque, ideal como colación de energía para excursiones.',
      par_en_barra:
        'Acompañamiento de Excursiones: Amenidad para huéspedes antes de caminatas, navegaciones o cabalgatas.',
      neurogastronomia:
        'Contrapunto amargo y achocolatado que entrega vitalidad sostenida en actividades al aire libre.',
      badge: 'Variedad 04 · Excursión & Boutique',
      badge_bioquimico: 'Cacao Criollo',
    },
  ],
  seo_title: 'Hospitalidad de Lujo & Bio-Gastronomía · Enjambre Legado',
  seo_title_en: 'Luxury Hospitality & Bio-Gastronomy · Enjambre Legado',
  seo_description:
    'Bio-gastronomía del bosque lluvioso de Chiloé (42°S) para hotelería de autor y lodges. Sistema modular en 25g y 150g con modelo financiero de costo neto cero.',
  seo_description_en:
    'Rainforest bio-gastronomy from Chiloé (42°S) for signature hospitality and luxury lodges. Modular 25g and 150g system with zero net cost financial model.',
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
  hero_image: B2B_STORAGE_IMAGES['tiendas-gourmet'],
  hero_image_opacity: 35,
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
      'Estuches de presentación: Sets de regalo preparados para fechas clave y ocasiones especiales que incrementan la rotación de tienda.',
    ],
    herramienta_clave: 'Exhibidor Escalonado de Mostrador & Muestrario de Degustación',
    herramienta_clave_en: 'Tiered Counter Stand & Active Tasting Bar',
  },
  tools: [],
  kits: [
    {
      id: 'vitrina-autor',
      nombre: 'Set Piloto Vitrina & Sello Botánico',
      badge: 'Iniciación Gourmet',
      tier: 'entrada',
      tagline: 'El set indispensable para probar rotación en tu mostrador con respaldo analítico',
      descripcion:
        'Selección de 24 frascos de 150g en las variedades más apreciadas para mesón de venta y rotación ágil, con displays A6 de vitrina con sello analítico Codex.',
      precio_neto_clp: 75000,
      pvp_estimado_clp: 130000,
      margen_estimado_pct: 42,
      moq_summary: '24 frascos 150g surtidos + displays A6',
      sales_strategy:
        'Coloca los 24 frascos en el mostrador o mesón de cobro para compras de impulso con margen del 42%.',
      componentes_fisicos: [
        {
          cantidad: '24 un.',
          item: 'Frascos 150g surtidos',
          detalle: '8 Miel Cruda Floral, 8 Crema con Avellana, 4 Crema con Cacao, 4 Crema con Polen',
        },
        {
          cantidad: '1 pack',
          item: 'Displays A6 de Vitrina (Shelf-Talkers)',
          detalle: 'Fichas con garantía analítica Codex (<17.5% humedad, invertasa viva) y QR de trazabilidad',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'Reseñas Verificadas de Cata',
          descripcion:
            'Tus clientes escanean y comprueban las opiniones reales de otros compradores',
          tag: 'resenas',
        },
        {
          titulo: 'Trazabilidad de Lote y Colmenar',
          descripcion:
            'Verificación digital en tiempo real del análisis de polen y trayectoria apícola del bosque',
          tag: 'trazabilidad',
        },
      ],
      recomendado_para:
        'Tiendas gourmet, emporios barriales, vinotecas y panaderías artesanales',
    },
    {
      id: 'emporio-selecto',
      nombre: 'Reserva Emporio Maestro & Colección',
      badge: 'Abastecimiento Completo',
      tier: 'avanzado',
      tagline: 'El mix completo de formatos de 150g y 500g Reserva para clientes habituales',
      descripcion:
        'Surtido balanceado de frascos de 150g y frascos de 500g Reserva del Bosque para abastecer consumo de mesa y amantes de la miel tradicional con margen protegido del 43%+.',
      precio_neto_clp: 249000,
      pvp_estimado_clp: 435000,
      margen_estimado_pct: 43,
      moq_summary: '60 frascos 150g + 16 frascos 500g + material vitrina',
      sales_strategy:
        'La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina, generando recompra recurrente cada 3 semanas.',
      componentes_fisicos: [
        {
          cantidad: '60 un.',
          item: 'Frascos 150g vitrina',
          detalle: '20 Miel Cruda Floral, 20 Crema Avellana, 10 Crema Cacao, 10 Crema Polen',
        },
        {
          cantidad: '16 un.',
          item: 'Frascos 500g Reserva del Bosque',
          detalle: 'Edición mayor con numeración de lote y origen botánico protegido',
        },
        {
          cantidad: '1 pack',
          item: 'Material Completo de Exhibición',
          detalle: 'Atril de madera nativa + fichas analíticas enmarcables de laboratorio',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'Trazabilidad Analítica y Reseñas',
          descripcion:
            'Acceso directo a fichas de ciencia y pureza de laboratorio para clientes informados',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Reposición Ágil con Factura Inmediata',
          descripcion:
            'Reordenamiento en 1 clic desde el portal con condiciones comerciales mayoristas blindadas',
          tag: 'pricing',
        },
      ],
      recomendado_para:
        'Emporios consolidados, tiendas de vinos y quesos, y locales de autor',
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
  material_badge: 'Material Físico & Soporte de Sala Incluido',
  material_badge_en: 'Physical Assets & Table Support Included',
  material_title: 'Herramientas Tangibles para tu Mostrador',
  material_title_en: 'Tangible Tools for Your Retail Counter',
  material_description:
    'Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: atriles de vitrina en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.',
  material_description_en:
    'Upon activating your commercial alliance, you receive all physical materials ready to operate from day one: heavy-weight cotton display cards with batch origin QR, bamboo micro-spatulas, and service guides for your staff.',
  tabletop_title: 'Atril de Vitrina & Ficha Botánica',
  tabletop_title_en: 'Display Stand & Botanical Card',
  tabletop_subtitle: 'Miel cruda de bosque nativo de Chiloé en presentación de alta gama.',
  tabletop_subtitle_en: 'Native forest raw honey from Chiloé in high-end presentation.',
  staff_title: 'Argumentario para Personal de Ventas',
  staff_title_en: 'Sales Staff Talking Points',
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
  hero_image: B2B_STORAGE_IMAGES.ferias,
  hero_image_opacity: 35,
  suggested_products_copy:
    'Para eventos sugerimos una fuerte presencia de mini frascos de 25g, son altamente atractivos y tienen excelente margen en formato de regalo.',
  cta_text: 'Pedir kit de feria',
  cta_text_en: 'Order fair kit',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Impacto de Flujo Rápido & Conversión en 45 Segundos',
    titulo_en: 'Rapid-Flow Impact & 45-Second Conversion Strategy',
    bajada:
      'En ferias y encuentros gastronómicos, la prueba sensorial directa permite conectar inmediatamente con el origen botánico y cerrar con pago ágil.',
    bajada_en:
      'In high-traffic events, direct sensory tasting connects immediately with botanical origin, closing sales with mobile payment speed.',
    aumento_ticket: 'Ticket promedio de $15.000 CLP · Tiempo de atención <60 segundos',
    aumento_ticket_en: 'Average basket of $15,000 CLP · Service cycle <60 seconds',
    mecanica_ventas: [
      'Degustación activa: Muestras guiadas de las variedades (Cruda, Avellana, Cacao) para el público asistente.',
      'Precio accesible y escala: Mini frascos de 25g como compra por impulso accesible ($2.500 CLP) y pack de 3 por $6.900 CLP para asegurar volumen.',
      'Pago QR sin fricción: Soporte QR visible; el cliente escanea y paga en segundos sin filas.',
      'Fidelización in situ: El cliente registra su contacto para ganar su primer sello digital, facilitando ventas posteriores.',
    ],
    herramienta_clave: 'Set de Degustación Sensorial & Pagos Móviles',
    herramienta_clave_en: 'Sensory Tasting Set & Mobile QR Checkout',
  },
  tools: [],
  kits: [
    {
      id: 'stand-degustacion',
      nombre: 'Set Piloto Stand & Degustación en Vivo',
      badge: 'Presencia en Eventos',
      tier: 'entrada',
      tagline: 'Montaje ágil para ferias gastronómicas y mercados de diseño',
      descripcion:
        'Diseñado para montajes temporales con formatos de degustación de impulso de 25g y frascos de 150g listos para venta inmediata al paso.',
      precio_neto_clp: 89000,
      pvp_estimado_clp: 155000,
      margen_estimado_pct: 42,
      moq_summary: '72 mini frascos 25g + 18 frascos 150g',
      sales_strategy:
        'Los mini frascos de impulso y frascos de mesa garantizan un flujo ininterrumpido de ventas sin objeción de precio.',
      componentes_fisicos: [
        {
          cantidad: '72 un.',
          item: 'Mini frascos 25g de impulso',
          detalle: 'Surtido de 4 variedades con tapa dorada para degustación y venta ágil',
        },
        {
          cantidad: '18 un.',
          item: 'Frascos 150g de autor',
          detalle: 'Variedades surtidas para venta directa de mesa',
        },
        {
          cantidad: '1 pack',
          item: 'Guía de Cata en Vivo para Mesón',
          detalle: 'Ficha plastificada para degustación sensorial con comensales',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'QR de Cobro y Registro Rápido',
          descripcion:
            'Cobro ágil y captura de comensales para el programa de fidelización',
          tag: 'fidelizacion',
        },
        {
          titulo: 'Puntos de Bienvenida en Feria',
          descripcion:
            'El cliente registra su cata in situ y gana sus primeros 25 puntos Club Legado',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Productores, feriantes gourmet y activaciones de fin de semana',
    },
    {
      id: 'encuentro-gastronomico',
      nombre: 'Pabellón Gastronómico & Activación Masiva',
      badge: 'Activación de Alto Flujo',
      tier: 'avanzado',
      tagline: 'Para festivales gastronómicos, pabellones de autor y pop-ups de alto flujo',
      descripcion:
        'Capacidad para atender degustaciones continuas y ofrecer frascos de mesa y familiares con excelente margen, respaldado por la app de venta móvil en terreno.',
      precio_neto_clp: 249000,
      pvp_estimado_clp: 435000,
      margen_estimado_pct: 43,
      moq_summary: '144 mini frascos 25g + 36 frascos 150g + 12 frascos 500g',
      sales_strategy:
        'Cobertura total del evento: degustación masiva en 25g, frascos de 150g para compra al paso y frascos de 500g para amantes de la miel tradicional.',
      componentes_fisicos: [
        {
          cantidad: '144 un.',
          item: 'Mini frascos 25g de impulso',
          detalle: 'Para degustación y venta ágil en eventos masivos',
        },
        {
          cantidad: '36 un.',
          item: 'Frascos 150g de autor',
          detalle: 'Surtido completo de bosque nativo',
        },
        {
          cantidad: '12 un.',
          item: 'Frascos 500g Reserva del Bosque',
          detalle: 'Para compradores exigentes de ferias',
        },
        {
          cantidad: '1 pack',
          item: 'Display Completo de Stand',
          detalle: 'Atril de mesón + guías de cata en vivo plastificadas',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'Acceso a App Móvil de Terreno',
          descripcion:
            'POS offline en apps/campo con cobro rápido y sincronización automática',
          tag: 'pricing',
        },
        {
          titulo: 'Reseñas de Evento en Vivo',
          descripcion:
            'Los asistentes dejan comentarios en vivo durante el evento',
          tag: 'resenas',
        },
      ],
      recomendado_para:
        'Participantes en ferias gastronómicas, festivales de café y pabellones',
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
  material_badge: 'Material Físico & Soporte de Sala Incluido',
  material_badge_en: 'Physical Assets & Table Support Included',
  material_title: 'Herramientas Tangibles para tu Stand',
  material_title_en: 'Tangible Tools for Your Event Booth',
  material_description:
    'Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: tarjetas de mesón en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.',
  material_description_en:
    'Upon activating your commercial alliance, you receive all physical materials ready to operate from day one: heavy-weight cotton counter cards with batch origin QR, bamboo micro-spatulas, and service guides for your staff.',
  tabletop_title: 'Tarjeta de Mesón & Degustación Libre',
  tabletop_title_en: 'Stand Counter Card & Free Tasting',
  tabletop_subtitle: 'Cata en 90 segundos con microespátula de bambú y QR de pago rápido.',
  tabletop_subtitle_en: '90-second tasting with bamboo micro-spatula and fast payment QR.',
  staff_title: 'Técnica de Atención en Mostrador de Feria',
  staff_title_en: 'Technique for Gourmet Fair Booth Staff',
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
  hero_image: B2B_STORAGE_IMAGES.revendedores,
  hero_image_opacity: 35,
  suggested_products_copy:
    'Para revendedores recomendamos iniciar con un mix de frascos de 150g y 500g, complementado con mini frascos de 25g ideales para dar a probar a nuevos clientes.',
  cta_text: 'Comenzar ahora',
  cta_text_en: 'Start now',
  cta_href: '#registro',
  commercial_strategy: {
    titulo: 'Estrategia de Venta por Recomendación & Micro-Catas Privadas',
    titulo_en: 'Relationship Selling & Private Micro-Tastings Strategy',
    bajada:
      'La recomendación directa y la degustación guiada en reuniones y círculos cercanos permiten dar a conocer el bosque nativo y cerrar pedidos con confianza.',
    bajada_en:
      'Direct recommendation and guided tasting in personal gatherings introduce the native forest and build trusted recurring orders.',
    aumento_ticket: 'Pedido medio de $28.000 CLP · 40% a 45% de margen directo',
    aumento_ticket_en: 'Average order of $28,000 CLP · 40% to 45% direct profit margin',
    mecanica_ventas: [
      'Degustación cercana: Presenta las 4 variedades explicando el origen botánico y pureza del bosque nativo de Chiloé.',
      'Pedidos inmediatos con stock de mano: Entrega los frascos en el acto cobrando al contado o transferencia directa.',
      'Trazabilidad con código personal: Cada cliente escanea tu QR asignado para ver el pasaporte de lote, registrando su contacto bajo tu cuenta.',
      'Recompra rápida bonificada: Si repones tu inventario dentro de 30 días, desbloqueas unidades adicionales de cortesía que aumentan tu ganancia neta.',
    ],
    herramienta_clave: 'Set de Muestras de Autor con Tarjetas QR de Lote',
    herramienta_clave_en: 'Author Sample Tasting Set with Batch QR Cards',
  },
  tools: [],
  kits: [
    {
      id: 'maletin-embajador',
      nombre: 'Set Piloto Embajador Territorial',
      badge: 'Iniciación de Representante',
      tier: 'entrada',
      tagline: 'El set esencial de formatos de mano para iniciar tu red personal',
      descripcion:
        'Stock inicial de 18 frascos de 150g para entrega inmediata, muestras de degustación y código de revendedor asignado con enlace personalizado en la plataforma.',
      precio_neto_clp: 65000,
      pvp_estimado_clp: 115000,
      margen_estimado_pct: 43,
      moq_summary: '18 frascos 150g surtidos + muestras',
      sales_strategy:
        'Inicia ventas en tu red cercana; recupera la inversión total del kit en mano y genera tus primeros ingresos de inmediato.',
      componentes_fisicos: [
        {
          cantidad: '18 un.',
          item: 'Frascos 150g de autor',
          detalle: 'Variedades de mayor demanda para entrega inmediata (6 Cruda, 6 Avellana, 3 Cacao, 3 Polen)',
        },
        {
          cantidad: '1 pack',
          item: 'Muestras de Degustación en Frío',
          detalle: 'Frasquitos y paletas para dar a probar a potenciales clientes',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'Enlace de Embajador Asignado',
          descripcion:
            'Enlace personalizado con código integrado para compartir en WhatsApp y redes',
          tag: 'trazabilidad',
        },
        {
          titulo: 'Pack Digital de Ventas',
          descripcion:
            'Fotografías en alta resolución, fichas botánicas y textos listos para compartir',
          tag: 'marketing',
        },
      ],
      recomendado_para:
        'Nuevos representantes territoriales y distribuidores independientes',
    },
    {
      id: 'stock-rotacion',
      nombre: 'Stock de Distribución & Rotación Zonal',
      badge: 'Ruta Activa & Escala',
      tier: 'avanzado',
      tagline: 'Volumen para abastecer clientes frecuentes y ventas directas con margen del 44%+',
      descripcion:
        'El balance perfecto de frascos de 150g, frascos de 500g Reserva y piezas de 25g de apertura para cerrar pedidos recurrentes en tu zona.',
      precio_neto_clp: 219000,
      pvp_estimado_clp: 390000,
      margen_estimado_pct: 44,
      moq_summary: '54 frascos 150g + 14 frascos 500g + 50 minis 25g',
      sales_strategy:
        'Atiende pedidos recurrentes de familias y comercios locales con frascos de 150g y 500g, utilizando las piezas de 25g para abrir nuevos clientes.',
      componentes_fisicos: [
        {
          cantidad: '54 un.',
          item: 'Frascos 150g surtidos',
          detalle: 'Miel pura y cremas botánicas de alta demanda',
        },
        {
          cantidad: '14 un.',
          item: 'Frascos 500g Reserva del Bosque',
          detalle: 'Edición mayor para compras familiares y amantes de la miel pura',
        },
        {
          cantidad: '50 un.',
          item: 'Mini frascos 25g cortesía',
          detalle: 'Para degustación y apertura de nuevos compradores',
        },
      ],
      integraciones_digitales: [
        {
          titulo: 'Crédito de Retribución en Portal',
          descripcion:
            'Seguimiento de compras acumuladas a 12 meses y crédito descontable en nuevos pedidos',
          tag: 'pricing',
        },
        {
          titulo: 'Herramienta de Reposición Móvil',
          descripcion:
            'Gestión ágil de pedidos desde tu teléfono con escala de descuentos mayorista',
          tag: 'fidelizacion',
        },
      ],
      recomendado_para:
        'Revendedores activos con cartera de clientes y rutas comerciales',
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
  material_badge: 'Material Físico & Soporte de Sala Incluido',
  material_badge_en: 'Physical Assets & Table Support Included',
  material_title: 'Herramientas Tangibles para tu Espacio',
  material_title_en: 'Tangible Tools for Your Venue',
  material_description:
    'Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: tarjetas de mesa en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.',
  material_description_en:
    'Upon activating your commercial alliance, you receive all physical materials ready to operate from day one: heavy-weight cotton table cards with batch origin QR, bamboo micro-spatulas, and service guides for your staff.',
  tabletop_title: 'Ficha de Presentación de Embajador',
  tabletop_title_en: 'Ambassador Presentation Card',
  tabletop_subtitle: 'Representante oficial de La Obrera y el Zángano. Catálogo disponible.',
  tabletop_subtitle_en: 'Official La Obrera y el Zángano representative. Full catalog available.',
  staff_title: 'Estrategia de Cierre y Reposición',
  staff_title_en: 'Closing and Restock Strategy',
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
  const rawSlug = typeof raw.slug === 'string' ? raw.slug.trim() : '';
  if (rawSlug && rawSlug !== fallbackSlug) {
    return { ...d };
  }

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

  const parsedMolecularPairings: B2BMolecularPairingItem[] = [];
  if (Array.isArray(raw.molecular_pairings)) {
    for (const item of raw.molecular_pairings) {
      const mp = parseB2BMolecularPairingItem(item);
      if (mp) parsedMolecularPairings.push(mp);
    }
  }

  const sanitizedMolecularPairings = parsedMolecularPairings.map((item) => {
    const fallbackItem = d.molecular_pairings?.find((fb) => fb.id === item.id);
    if (!fallbackItem) return item;
    return {
      ...item,
      subtitulo: cleanB2BSlop(item.subtitulo ?? '', fallbackItem.subtitulo ?? item.subtitulo ?? ''),
      perfil_bioquimico: cleanB2BSlop(item.perfil_bioquimico, fallbackItem.perfil_bioquimico),
      neurogastronomia: cleanB2BSlop(item.neurogastronomia, fallbackItem.neurogastronomia),
      badge_bioquimico: cleanB2BSlop(item.badge_bioquimico ?? '', fallbackItem.badge_bioquimico ?? item.badge_bioquimico ?? ''),
    };
  });

  const rawStrategy =
    raw.commercial_strategy ??
    raw.commercialStrategy ??
    raw.strategy ??
    (raw.strategy_title || raw.strategy_summary || raw.strategy_ticket_boost ? raw : null);
  const parsedStrategy = rawStrategy ? parseB2BCommercialStrategy(rawStrategy) : null;

  const rawHero = asString(raw.hero_image, d.hero_image).trim();
  const isLegacyOrCrossContaminatedHero =
    !rawHero ||
    rawHero.startsWith('/images/b2b/') ||
    rawHero.startsWith('/assets/editorial/b2b-') ||
    (fallbackSlug !== 'cafeterias' && rawHero.includes('/cms/b2b_cafeterias/')) ||
    rawHero.includes('814aaec5-330b-4ff2-8872-0c540b0e7825') ||
    rawHero.includes('bd874e95-611d-4d04-ad3a-d28a7fd7d6f5');

  return {
    slug: fallbackSlug,
    tipo: asString(raw.tipo, d.tipo),
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    headline: asString(raw.headline, d.headline).trim(),
    headline_en: typeof raw.headline_en === 'string' ? raw.headline_en.trim() : d.headline_en,
    subheadline: asString(raw.subheadline, d.subheadline).trim(),
    subheadline_en: typeof raw.subheadline_en === 'string' ? raw.subheadline_en.trim() : d.subheadline_en,
    hero_image: isLegacyOrCrossContaminatedHero ? d.hero_image : rawHero,
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 35, 0, 100),
    suggested_products_copy: asString(raw.suggested_products_copy, d.suggested_products_copy ?? '').trim(),
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
    molecular_pairings:
      sanitizedMolecularPairings.length > 0 ? sanitizedMolecularPairings : d.molecular_pairings,
    material_badge: asString(raw.material_badge, d.material_badge ?? '').trim() || d.material_badge,
    material_badge_en:
      typeof raw.material_badge_en === 'string' ? raw.material_badge_en.trim() : d.material_badge_en,
    material_title: asString(raw.material_title, d.material_title ?? '').trim() || d.material_title,
    material_title_en:
      typeof raw.material_title_en === 'string' ? raw.material_title_en.trim() : d.material_title_en,
    material_description:
      asString(raw.material_description, d.material_description ?? '').trim() || d.material_description,
    material_description_en:
      typeof raw.material_description_en === 'string'
        ? raw.material_description_en.trim()
        : d.material_description_en,
    tabletop_title: asString(raw.tabletop_title, d.tabletop_title ?? '').trim() || d.tabletop_title,
    tabletop_title_en:
      typeof raw.tabletop_title_en === 'string' ? raw.tabletop_title_en.trim() : d.tabletop_title_en,
    tabletop_subtitle:
      asString(raw.tabletop_subtitle, d.tabletop_subtitle ?? '').trim() || d.tabletop_subtitle,
    tabletop_subtitle_en:
      typeof raw.tabletop_subtitle_en === 'string'
        ? raw.tabletop_subtitle_en.trim()
        : d.tabletop_subtitle_en,
    staff_title: asString(raw.staff_title, d.staff_title ?? '').trim() || d.staff_title,
    staff_title_en:
      typeof raw.staff_title_en === 'string' ? raw.staff_title_en.trim() : d.staff_title_en,
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
  badge1?: string;
  badge1_en?: string;
  badge2?: string;
  badge2_en?: string;
  badge3?: string;
  badge3_en?: string;
  manifiesto_kicker?: string;
  manifiesto_kicker_en?: string;
  manifiesto_title?: string;
  manifiesto_title_en?: string;
  manifiesto_text?: string;
  manifiesto_text_en?: string;
  manifiesto_cta_label?: string;
  manifiesto_cta_label_en?: string;
  manifiesto_cta_href?: string;
};

export const DEFAULT_ORIGEN_SETTINGS: OrigenSettings = {
  kicker: 'Fenología Austral & Estándar de Origen',
  kicker_en: 'Austral Phenology & Standard of Origin',
  title: 'Origen & Floraciones',
  title_en: 'Origin & Blooms',
  description:
    'Explora nuestra biblioteca de monografías botánicas. Un estudio profundo y documentado sobre las especies nectaríferas que sostienen la biodiversidad del bosque valdiviano y dan origen a nuestras creaciones.',
  description_en:
    'Explore our botanical monograph library. An in-depth and documented study of nectariferous species that sustain Valdivian rainforest biodiversity and give origin to our creations.',
  badge1: 'Predio Pureo, Queilén',
  badge1_en: 'Pureo Estate, Queilén',
  badge2: 'Sin Trashumancia',
  badge2_en: 'No Transhumance',
  badge3: 'Centrifugado en Frío',
  badge3_en: 'Cold Extracted',
  manifiesto_kicker: 'Pureza sin compromiso',
  manifiesto_kicker_en: 'Uncompromising Purity',
  manifiesto_title: 'Por qué nuestras colmenas nunca viajan',
  manifiesto_title_en: 'Why Our Hives Never Travel',
  manifiesto_text:
    'La apicultura industrial traslada abejas miles de kilómetros para polinizar monocultivos de palta o almendro, sometiéndolas a estrés y pesticidas. En Enjambre Legado, nuestras colmenas permanecen fijas en el santuario de bosque nativo de Chiloé todo el año. Su única fuente de néctar son las flores silvestres del bosque austral.',
  manifiesto_text_en:
    'Industrial beekeeping transports bees thousands of miles to pollinate industrial monocultures, exposing them to stress and synthetic chemicals. At Enjambre Legado, our hives remain fixed in the native Chiloé forest sanctuary year-round. Their sole source of nectar is the wild flowers of the southern forest.',
  manifiesto_cta_label: 'Explorar Colección de Origen',
  manifiesto_cta_label_en: 'Explore Origin Collection',
  manifiesto_cta_href: '/catalogo',
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
    badge1: asString(raw.badge1, d.badge1 ?? '').trim(),
    badge1_en: typeof raw.badge1_en === 'string' ? raw.badge1_en.trim() : d.badge1_en,
    badge2: asString(raw.badge2, d.badge2 ?? '').trim(),
    badge2_en: typeof raw.badge2_en === 'string' ? raw.badge2_en.trim() : d.badge2_en,
    badge3: asString(raw.badge3, d.badge3 ?? '').trim(),
    badge3_en: typeof raw.badge3_en === 'string' ? raw.badge3_en.trim() : d.badge3_en,
    manifiesto_kicker: asString(raw.manifiesto_kicker, d.manifiesto_kicker ?? '').trim(),
    manifiesto_kicker_en:
      typeof raw.manifiesto_kicker_en === 'string' ? raw.manifiesto_kicker_en.trim() : d.manifiesto_kicker_en,
    manifiesto_title: asString(raw.manifiesto_title, d.manifiesto_title ?? '').trim(),
    manifiesto_title_en:
      typeof raw.manifiesto_title_en === 'string' ? raw.manifiesto_title_en.trim() : d.manifiesto_title_en,
    manifiesto_text: asString(raw.manifiesto_text, d.manifiesto_text ?? '').trim(),
    manifiesto_text_en:
      typeof raw.manifiesto_text_en === 'string' ? raw.manifiesto_text_en.trim() : d.manifiesto_text_en,
    manifiesto_cta_label: asString(raw.manifiesto_cta_label, d.manifiesto_cta_label ?? '').trim(),
    manifiesto_cta_label_en:
      typeof raw.manifiesto_cta_label_en === 'string' ? raw.manifiesto_cta_label_en.trim() : d.manifiesto_cta_label_en,
    manifiesto_cta_href: sanitizeStoreHref(raw.manifiesto_cta_href, d.manifiesto_cta_href) ?? d.manifiesto_cta_href,
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

export const DEFAULT_MELI_MONOGRAPH: BotanicalMonograph = {
  slug: 'meli',
  common_name: 'Melí',
  common_name_en: 'Melí',
  scientific_name: 'Amomyrtus meli (Philippi) Legrand et Kausel',
  short_description:
    'Árbol endémico de la familia de las mirtáceas en Chiloé. Su miel es de dorado intenso, con notas aromáticas de mirto, pimienta dulce y madera noble.',
  short_description_en:
    'Endemic myrtle tree of Chiloé. Yields intense golden honey with aromatic nuances of wild myrtle, sweet pepper, and noble wood.',
  full_description:
    'El melí es un árbol siempreverde aromático endémico del sur de Chile, con presencia destacada en las islas y costas de Chiloé. Sus hojas lustrosas y flores blancas desprenden aceites esenciales balsámicos. Su néctar da origen a una miel con carácter terpénico pronunciado de altísima nobleza sensorial.',
  full_description_en:
    'Melí is an aromatic evergreen tree endemic to southern Chile, especially prevalent in the damp coastal forests of Chiloé. Its nectar gives birth to an intensely aromatic honey with pronounced terpenic notes.',
  sensory_profile:
    'Dorado intenso con matices cobrizos. Aroma resinoso y cálido, especias suaves de mirto, clavo de olor y retrogusto persistente que acompaña maridajes de alta intensidad.',
  sensory_profile_en:
    'Deep golden amber. Warm balsamic and resinous aroma with subtle wild spices, sweet pepper, and long persistence.',
  flowering_period: 'Diciembre a Enero (Pleno verano austral)',
  flowering_period_en: 'December to January (Mid austral summer)',
  ecology:
    'Especie umbrófila del sotobosque y dosel medio, fundamental en la regulación hídrica y en la provisión de aceites esenciales que fortalecen la sanidad de la colmena.',
  ecology_en:
    'Shade-tolerant understory species key to forest moisture retention and essential volatile production.',
  references:
    'Hechenleitner, P. et al. (2005). Plantas amenazadas del centro-sur de Chile; UACh Melisopalinología.',
};

export const DEFAULT_TEPU_MONOGRAPH: BotanicalMonograph = {
  slug: 'tepu',
  common_name: 'Tepú',
  common_name_en: 'Tepú',
  scientific_name: 'Tepualia stipularis (Hook. et Arn.) Griseb.',
  short_description:
    'El corazón de los tepuales pantanosos de Chiloé. Miel ámbar rojiza oscura, densa, mineral, con notas de melaza pura, turba y bosque húmedo.',
  short_description_en:
    'Heart of the flooded Chiloé tepuales. Dark reddish-amber honey, dense and mineral with notes of pure molasses, peat, and humid rainforest.',
  full_description:
    'El tepú conforma formaciones boscosas impenetrables en suelos anegados del archipiélago chilote (tepuales). Sus troncos retorcidos y raíces aéreas crean un tapiz ecológico donde el agua dulce y la salinidad marina se encuentran. Su floración estival tardía suministra néctar denso y oscuro con altísima concentración mineral.',
  full_description_en:
    'Tepú forms impenetrable swamp forests in saturated soils across Chiloé. Its dense, mineral-rich nectar yields an amber to dark reddish honey of exceptional depth.',
  sensory_profile:
    'Ámbar rojizo oscuro. Textura untuosa y densa, acidez baja, notas de turba, bosque húmedo y azúcar morena con un final mineral marino de gran persistencia.',
  sensory_profile_en:
    'Dark reddish amber. Dense buttery texture, low acidity, earthy peat and forest floor undertones with enduring oceanic mineral persistence.',
  flowering_period: 'Febrero a Abril (Cierre de verano y otoño)',
  flowering_period_en: 'February to April (Late summer to autumn)',
  ecology:
    'Especie estructurante de humedales costeros y turberas, retenedora insustituible de carbono orgánico y amortiguadora de mareas en los canales chilotes.',
  ecology_en:
    'Dominant species in peatlands and wetlands, sequestering massive organic carbon and buffering tidal cycles.',
  references:
    'Villagrán, C. (1991). Historia de los bosques de Chiloé; SAG Registro de Especies Melíferas.',
};

export const DEFAULT_BOTANICAL_MONOGRAPHS: BotanicalMonograph[] = [
  DEFAULT_ULMO_MONOGRAPH,
  DEFAULT_TIACA_MONOGRAPH,
  DEFAULT_MELI_MONOGRAPH,
  DEFAULT_TEPU_MONOGRAPH,
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
  const items = (raw as unknown[]).flat(2);
  for (const item of items) {
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

  // Badges superiores de especificación
  specs_badge1_label: string;
  specs_badge1_label_en?: string;
  specs_badge1_value: string;
  specs_badge1_value_en?: string;

  specs_badge2_label: string;
  specs_badge2_label_en?: string;
  specs_badge2_value: string;
  specs_badge2_value_en?: string;

  specs_badge3_label: string;
  specs_badge3_label_en?: string;
  specs_badge3_value: string;
  specs_badge3_value_en?: string;

  // Encabezado de la Trilogía de Encuentros
  trilogia_kicker: string;
  trilogia_kicker_en?: string;
  trilogia_title: string;
  trilogia_title_en?: string;
  trilogia_subtitle: string;
  trilogia_subtitle_en?: string;

  // Tarjeta 1: Territorio & Bosque Austral
  card1_tag: string;
  card1_tag_en?: string;
  card1_title: string;
  card1_title_en?: string;
  card1_desc: string;
  card1_desc_en?: string;
  card1_space: string;
  card1_space_en?: string;
  card1_capacity: string;
  card1_capacity_en?: string;
  card1_duration: string;
  card1_duration_en?: string;
  card1_cta_label: string;
  card1_cta_label_en?: string;
  card1_cta_href: string;
  card1_image: string;

  // Tarjeta 2: Degustaciones (Insignia)
  flagship_tag?: string;
  flagship_tag_en?: string;
  card2_tag?: string;
  card2_tag_en?: string;
  flagship_badge: string;
  flagship_badge_en?: string;
  flagship_title: string;
  flagship_title_en?: string;
  flagship_desc: string;
  flagship_desc_en?: string;
  flagship_format?: string;
  flagship_format_en?: string;
  flagship_capacity?: string;
  flagship_capacity_en?: string;
  flagship_duration?: string;
  flagship_duration_en?: string;
  flagship_cta_label: string;
  flagship_cta_label_en?: string;
  flagship_href: string;
  flagship_image?: string;
  show_flagship_card?: boolean;

  // Tarjeta 3: Talleres de Técnica Apícola
  card3_tag: string;
  card3_tag_en?: string;
  card3_title: string;
  card3_title_en?: string;
  card3_desc: string;
  card3_desc_en?: string;
  card3_focus: string;
  card3_focus_en?: string;
  card3_capacity: string;
  card3_capacity_en?: string;
  card3_duration: string;
  card3_duration_en?: string;
  card3_cta_label: string;
  card3_cta_label_en?: string;
  card3_cta_href: string;
  card3_image: string;

  // Agenda de Talleres & Encuentros
  talleres_kicker?: string;
  talleres_kicker_en?: string;
  talleres_title?: string;
  talleres_title_en?: string;
  talleres_subtitle?: string;
  talleres_subtitle_en?: string;

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

  specs_badge1_label: '3 Vertientes',
  specs_badge1_label_en: '3 Strands',
  specs_badge1_value: 'Territorio · Cata · Taller',
  specs_badge1_value_en: 'Territory · Tasting · Workshop',

  specs_badge2_label: 'Ubicación',
  specs_badge2_label_en: 'Location',
  specs_badge2_value: 'Chiloé & Santiago',
  specs_badge2_value_en: 'Chiloé & Santiago',

  specs_badge3_label: 'Formato',
  specs_badge3_label_en: 'Format',
  specs_badge3_value: 'Puerta cerrada',
  specs_badge3_value_en: 'Private doors',

  trilogia_kicker: 'Trilogía de Encuentros',
  trilogia_kicker_en: 'Trilogy of Encounters',
  trilogia_title: 'Tres formas de conectar con el bosque',
  trilogia_title_en: 'Three ways to connect with the forest',
  trilogia_subtitle:
    'Cada formato responde a un nivel distinto de inmersión: la estadía viva en el archipiélago, el análisis sensorial guiado o la técnica apícola directa en apiarios nativos.',
  trilogia_subtitle_en:
    'Each format responds to a distinct level of immersion: the living stay in the archipelago, guided sensory analysis, or direct beekeeping technique in native apiaries.',

  card1_tag: '01 · Inmersión Física · Chiloé',
  card1_tag_en: '01 · Physical Immersion · Chiloé',
  card1_title: 'Territorio & Bosque Austral',
  card1_title_en: 'Territory & Southern Forest',
  card1_desc:
    'Estadía privada en cabaña de madera nativa con fogón a leña, navegación en kayak por esteros protegidos y ronda de colmenas entre Ulmos centenarios en Queilén.',
  card1_desc_en:
    'Private stay in a native timber cabin with wood fireplace, kayak navigation along protected estuaries, and hive inspections among century-old Ulmo trees in Queilén.',
  card1_space: 'Espacio: Cabaña nativa en Predio Pureo',
  card1_space_en: 'Space: Native cabin in Pureo Estate',
  card1_capacity: 'Aforo: Estadías privadas de 2 a 6 personas',
  card1_capacity_en: 'Capacity: Private stays for 2 to 6 guests',
  card1_duration: 'Duración: Programas de 3 a 5 días',
  card1_duration_en: 'Duration: 3 to 5-day itineraries',
  card1_cta_label: 'Conocer estancia en Chiloé',
  card1_cta_label_en: 'Discover Chiloé estate',
  card1_cta_href: '/experiencias/territorio',
  card1_image: '/assets/editorial/hero-bosque-tronco.jpg',

  flagship_tag: '02 · Cata Sensorial · Nacional',
  flagship_tag_en: '02 · Sensory Tasting · National',
  card2_tag: '02 · Cata Sensorial · Nacional',
  card2_tag_en: '02 · Sensory Tasting · National',
  flagship_badge: 'Insignia',
  flagship_badge_en: 'Flagship',
  flagship_title: 'Degustaciones · Mieles de Chile',
  flagship_title_en: 'Tastings · Honeys of Chile',
  flagship_desc:
    'Cata sensorial metódica de mieles recolectadas a lo largo de Chile, comprendidas bajo nuestra perspectiva. Incluye kit de degustación y rueda sensorial en papel de alta gramaje.',
  flagship_desc_en:
    'Methodical sensory tasting of honeys collected across Chile, understood from our perspective. Includes tasting kit and printed sensory wheel on high-weight paper.',
  flagship_format: 'Mieles de contraste: Atacama a Patagonia',
  flagship_format_en: 'Contrast honeys: Atacama to Patagonia',
  flagship_capacity: 'Aforo: Corporativo (10-20) | Íntimo (6-10)',
  flagship_capacity_en: 'Capacity: Corporate (10-20) | Intimate (6-10)',
  flagship_duration: 'Duración: 90 a 120 minutos continuos',
  flagship_duration_en: 'Duration: 90 to 120 continuous minutes',
  flagship_cta_label: 'Ver protocolo de cata',
  flagship_cta_label_en: 'View tasting protocol',
  flagship_href: '/experiencias/degustaciones',
  flagship_image: '/assets/editorial/honey-jar.png',
  show_flagship_card: true,

  card3_tag: '03 · Técnica Apícola · Chiloé',
  card3_tag_en: '03 · Beekeeping Technique · Chiloé',
  card3_title: 'Talleres de Técnica Apícola',
  card3_title_en: 'Beekeeping Technique Workshops',
  card3_desc:
    'Manejo técnico de la colmena, sanidad y adaptación biológica en el bosque templado lluvioso. Apertura de colmenas reales junto a Cristina Miranda en apiarios productivos.',
  card3_desc_en:
    'Technical hive management, health and biological adaptation in the temperate rainforest. Live hive inspections with Cristina Miranda in productive apiaries.',
  card3_focus: 'Enfoque: Maestría y práctica en apiario',
  card3_focus_en: 'Focus: Mastery and hands-on apiary practice',
  card3_capacity: 'Aforo: Grupos técnicos reducidos',
  card3_capacity_en: 'Capacity: Intimate technical groups',
  card3_duration: 'Duración: Jornadas de 1 a 2 días',
  card3_duration_en: 'Duration: 1 to 2-day sessions',
  card3_cta_label: 'Ver programa de talleres',
  card3_cta_label_en: 'View workshop curriculum',
  card3_cta_href: '/experiencias/talleres',
  card3_image: '/assets/editorial/hero-hueco.jpg',

  talleres_kicker: 'Agenda de Formación',
  talleres_kicker_en: 'Training Schedule',
  talleres_title: 'Próximos Talleres y Encuentros',
  talleres_title_en: 'Upcoming Workshops & Gatherings',
  talleres_subtitle: 'Fechas confirmadas y programas especiales en Chiloé y Santiago.',
  talleres_subtitle_en: 'Confirmed dates and special programs in Chiloé and Santiago.',
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

    specs_badge1_label: asString(raw.specs_badge1_label, d.specs_badge1_label).trim(),
    specs_badge1_label_en:
      typeof raw.specs_badge1_label_en === 'string' ? raw.specs_badge1_label_en.trim() : d.specs_badge1_label_en,
    specs_badge1_value: asString(raw.specs_badge1_value, d.specs_badge1_value).trim(),
    specs_badge1_value_en:
      typeof raw.specs_badge1_value_en === 'string' ? raw.specs_badge1_value_en.trim() : d.specs_badge1_value_en,

    specs_badge2_label: asString(raw.specs_badge2_label, d.specs_badge2_label).trim(),
    specs_badge2_label_en:
      typeof raw.specs_badge2_label_en === 'string' ? raw.specs_badge2_label_en.trim() : d.specs_badge2_label_en,
    specs_badge2_value: asString(raw.specs_badge2_value, d.specs_badge2_value).trim(),
    specs_badge2_value_en:
      typeof raw.specs_badge2_value_en === 'string' ? raw.specs_badge2_value_en.trim() : d.specs_badge2_value_en,

    specs_badge3_label: asString(raw.specs_badge3_label, d.specs_badge3_label).trim(),
    specs_badge3_label_en:
      typeof raw.specs_badge3_label_en === 'string' ? raw.specs_badge3_label_en.trim() : d.specs_badge3_label_en,
    specs_badge3_value: asString(raw.specs_badge3_value, d.specs_badge3_value).trim(),
    specs_badge3_value_en:
      typeof raw.specs_badge3_value_en === 'string' ? raw.specs_badge3_value_en.trim() : d.specs_badge3_value_en,

    trilogia_kicker: asString(raw.trilogia_kicker, d.trilogia_kicker).trim(),
    trilogia_kicker_en:
      typeof raw.trilogia_kicker_en === 'string' ? raw.trilogia_kicker_en.trim() : d.trilogia_kicker_en,
    trilogia_title: asString(raw.trilogia_title, d.trilogia_title).trim(),
    trilogia_title_en:
      typeof raw.trilogia_title_en === 'string' ? raw.trilogia_title_en.trim() : d.trilogia_title_en,
    trilogia_subtitle: asString(raw.trilogia_subtitle, d.trilogia_subtitle).trim(),
    trilogia_subtitle_en:
      typeof raw.trilogia_subtitle_en === 'string' ? raw.trilogia_subtitle_en.trim() : d.trilogia_subtitle_en,

    card1_tag: asString(raw.card1_tag, d.card1_tag).trim(),
    card1_tag_en: typeof raw.card1_tag_en === 'string' ? raw.card1_tag_en.trim() : d.card1_tag_en,
    card1_title: asString(raw.card1_title, d.card1_title).trim(),
    card1_title_en: typeof raw.card1_title_en === 'string' ? raw.card1_title_en.trim() : d.card1_title_en,
    card1_desc: asString(raw.card1_desc, d.card1_desc).trim(),
    card1_desc_en: typeof raw.card1_desc_en === 'string' ? raw.card1_desc_en.trim() : d.card1_desc_en,
    card1_space: asString(raw.card1_space, d.card1_space).trim(),
    card1_space_en: typeof raw.card1_space_en === 'string' ? raw.card1_space_en.trim() : d.card1_space_en,
    card1_capacity: asString(raw.card1_capacity, d.card1_capacity).trim(),
    card1_capacity_en: typeof raw.card1_capacity_en === 'string' ? raw.card1_capacity_en.trim() : d.card1_capacity_en,
    card1_duration: asString(raw.card1_duration, d.card1_duration).trim(),
    card1_duration_en: typeof raw.card1_duration_en === 'string' ? raw.card1_duration_en.trim() : d.card1_duration_en,
    card1_cta_label: asString(raw.card1_cta_label, d.card1_cta_label).trim(),
    card1_cta_label_en: typeof raw.card1_cta_label_en === 'string' ? raw.card1_cta_label_en.trim() : d.card1_cta_label_en,
    card1_cta_href: sanitizeStoreHref(raw.card1_cta_href, d.card1_cta_href) ?? d.card1_cta_href,
    card1_image: asString(raw.card1_image, d.card1_image).trim(),

    flagship_tag: asString(raw.flagship_tag ?? raw.card2_tag, d.flagship_tag ?? '02 · Cata Sensorial · Nacional').trim(),
    flagship_tag_en:
      typeof (raw.flagship_tag_en ?? raw.card2_tag_en) === 'string'
        ? ((raw.flagship_tag_en ?? raw.card2_tag_en) as string).trim()
        : d.flagship_tag_en,
    card2_tag: asString(raw.card2_tag ?? raw.flagship_tag, d.card2_tag ?? '02 · Cata Sensorial · Nacional').trim(),
    card2_tag_en:
      typeof (raw.card2_tag_en ?? raw.flagship_tag_en) === 'string'
        ? ((raw.card2_tag_en ?? raw.flagship_tag_en) as string).trim()
        : d.card2_tag_en,
    flagship_badge: asString(raw.flagship_badge, d.flagship_badge).trim(),
    flagship_badge_en: typeof raw.flagship_badge_en === 'string' ? raw.flagship_badge_en.trim() : d.flagship_badge_en,
    flagship_title: asString(raw.flagship_title, d.flagship_title).trim(),
    flagship_title_en: typeof raw.flagship_title_en === 'string' ? raw.flagship_title_en.trim() : d.flagship_title_en,
    flagship_desc: asString(raw.flagship_desc, d.flagship_desc).trim(),
    flagship_desc_en: typeof raw.flagship_desc_en === 'string' ? raw.flagship_desc_en.trim() : d.flagship_desc_en,
    flagship_format: asString(raw.flagship_format, d.flagship_format ?? '').trim(),
    flagship_format_en:
      typeof raw.flagship_format_en === 'string' ? raw.flagship_format_en.trim() : d.flagship_format_en,
    flagship_capacity: asString(raw.flagship_capacity, d.flagship_capacity ?? '').trim(),
    flagship_capacity_en:
      typeof raw.flagship_capacity_en === 'string' ? raw.flagship_capacity_en.trim() : d.flagship_capacity_en,
    flagship_duration: asString(raw.flagship_duration, d.flagship_duration ?? '').trim(),
    flagship_duration_en:
      typeof raw.flagship_duration_en === 'string' ? raw.flagship_duration_en.trim() : d.flagship_duration_en,
    flagship_cta_label: asString(raw.flagship_cta_label, d.flagship_cta_label).trim(),
    flagship_cta_label_en:
      typeof raw.flagship_cta_label_en === 'string' ? raw.flagship_cta_label_en.trim() : d.flagship_cta_label_en,
    flagship_href: sanitizeStoreHref(raw.flagship_href, d.flagship_href) ?? d.flagship_href,
    flagship_image: asString(raw.flagship_image, d.flagship_image ?? '').trim(),
    show_flagship_card: typeof raw.show_flagship_card === 'boolean' ? raw.show_flagship_card : d.show_flagship_card ?? true,

    card3_tag: asString(raw.card3_tag, d.card3_tag).trim(),
    card3_tag_en: typeof raw.card3_tag_en === 'string' ? raw.card3_tag_en.trim() : d.card3_tag_en,
    card3_title: asString(raw.card3_title, d.card3_title).trim(),
    card3_title_en: typeof raw.card3_title_en === 'string' ? raw.card3_title_en.trim() : d.card3_title_en,
    card3_desc: asString(raw.card3_desc, d.card3_desc).trim(),
    card3_desc_en: typeof raw.card3_desc_en === 'string' ? raw.card3_desc_en.trim() : d.card3_desc_en,
    card3_focus: asString(raw.card3_focus, d.card3_focus).trim(),
    card3_focus_en: typeof raw.card3_focus_en === 'string' ? raw.card3_focus_en.trim() : d.card3_focus_en,
    card3_capacity: asString(raw.card3_capacity, d.card3_capacity).trim(),
    card3_capacity_en: typeof raw.card3_capacity_en === 'string' ? raw.card3_capacity_en.trim() : d.card3_capacity_en,
    card3_duration: asString(raw.card3_duration, d.card3_duration).trim(),
    card3_duration_en: typeof raw.card3_duration_en === 'string' ? raw.card3_duration_en.trim() : d.card3_duration_en,
    card3_cta_label: asString(raw.card3_cta_label, d.card3_cta_label).trim(),
    card3_cta_label_en: typeof raw.card3_cta_label_en === 'string' ? raw.card3_cta_label_en.trim() : d.card3_cta_label_en,
    card3_cta_href: sanitizeStoreHref(raw.card3_cta_href, d.card3_cta_href) ?? d.card3_cta_href,
    card3_image: asString(raw.card3_image, d.card3_image).trim(),

    talleres_kicker: asString(raw.talleres_kicker, d.talleres_kicker ?? '').trim(),
    talleres_kicker_en:
      typeof raw.talleres_kicker_en === 'string' ? raw.talleres_kicker_en.trim() : d.talleres_kicker_en,
    talleres_title: asString(raw.talleres_title, d.talleres_title ?? '').trim(),
    talleres_title_en:
      typeof raw.talleres_title_en === 'string' ? raw.talleres_title_en.trim() : d.talleres_title_en,
    talleres_subtitle: asString(raw.talleres_subtitle, d.talleres_subtitle ?? '').trim(),
    talleres_subtitle_en:
      typeof raw.talleres_subtitle_en === 'string' ? raw.talleres_subtitle_en.trim() : d.talleres_subtitle_en,

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
  cta_label?: string;
  cta_label_en?: string;
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
    'Análisis sensorial guiado de mieles nativas y relato de origen sobre la supervivencia de la colmena en el archipiélago de Chiloé. Encuentros para directorios, círculos privados y estaciones territoriales en eventos.',
  subtitle_en:
    'Guided sensory analysis of native honeys and origin storytelling on colony resilience in the Chiloé archipelago. Experience for companies and private groups conducted by Cristina Miranda & OYZ Territorial Team.',
  edition_note: 'Edición actual: selección de floraciones nativas de temporada en copas y cucharillas técnicas.',
  hero_image:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/floraciones_experience_settings/ae01c33e-779f-43aa-9d4e-8a0e9202ef3d.webp',
  hero_image_opacity: 35,
  bio_name: 'Cristina Miranda & Equipo Territorial OYZ',
  bio_location: 'Pureo, Queilén · Archipiélago de Chiloé (km 8560)',
  bio_trajectory_years: 22,
  bio_paragraphs: [
    'Nacida y radicada en la localidad rural de Pureo, comuna de Queilén. Tras años dedicados a la pesca artesanal en los canales chilotes, inició en 2005 la transición hacia la apicultura tras sucesivas crisis en el sector pesquero de la zona.',
    'Sostiene apiarios en un territorio caracterizado por 9 a 10 meses de lluvia al año, humedad constante y vientos del Pacífico sur. Estas condiciones obligan a un manejo apícola riguroso y han favorecido la adaptación de abejas con alta resistencia climática, que pecorean en ventanas acotadas de floración en bosque nativo.',
    'Su trabajo con mieles de ulmo, tiaca, melí y bosque templado lluvioso es el pilar de origen del enjambre. La conducción de los encuentros corporativos e íntimos está a cargo de Cristina en persona. Para los módulos de eventos externos, la conducción la lideran miembros del equipo OYZ con dominio territorial directo del bosque y manejo apícola, garantizando precisión técnica sin intermediarios.',
  ],
  bio_metrics: [
    { value: '22 años', label: 'De trayectoria apícola continua' },
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
      cta_label: 'Cotizar esta modalidad',
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
      cta_label: 'Cotizar esta modalidad',
    },
    {
      id: 'estacion_origen',
      title: 'Estación de Origen',
      kicker: 'Presencia en tu evento · Módulos externos',
      capacity: 'Abierto · Flujo variable (8 a 12 min por persona)',
      duration: 'Bloque de 2 a 8 horas según agenda anfitriona',
      context: 'Mesa lineal de 180 cm con acceso logístico 90 min antes',
      summary:
        'Para wine clubs, cenas de autor, retiros y eventos donde la miel de bosque chilote opera como contrapunto territorial a lo que ya está en mesa.',
      includes: [
        'Curaduría de 5 a 8 floraciones de contraste sensorial máximo (claras fluidas, densas oscuras, silvestres y cristalizadas)',
        'Conducción técnica por equipo OYZ con dominio territorial (o Cristina Miranda según agenda y traslado)',
        'Maridaje austero de contrapunto (pan de masa madre de fermentación prolongada o queso duro de guarda con sal en escamas; sin chocolate)',
        'Menaje técnico: copas de cata, cucharillas y display de origen',
        'Tarjeta física reducida de alta gramaje con las 5–8 floraciones de la edición y QR al catálogo privado',
        'Protocolo de adquisición diferida sin transacciones comerciales en sala',
      ],
      cta_label: 'Consultar disponibilidad',
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
      question: '¿Qué superficie y condiciones de espacio requiere la Estación de Origen?',
      answer:
        'Requiere una mesa lineal o mesón de al menos 180 cm de largo en una zona de buena circulación, con iluminación adecuada y acceso logístico con 90 minutos de anticipación para montaje y atemperado de las 5 a 8 floraciones. OYZ provee el display, copas, cucharillas y mantelería neutra.',
    },
    {
      question: '¿El módulo de Estación de Origen incluye conducción o solo la provisión de muestras?',
      answer:
        'Incluye siempre conducción activa por miembros del equipo OYZ con dominio territorial real del bosque y del manejo apícola, capaces de guiar el recorrido de 8 a 12 minutos por persona y responder consultas botánicas. En fechas coordinadas con su agenda en Santiago o mediante traslado directo desde Pureo, la conducción puede ser realizada personalmente por Cristina Miranda.',
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
            cta_label: typeof fr.cta_label === 'string' ? fr.cta_label.trim() : undefined,
            cta_label_en: typeof fr.cta_label_en === 'string' ? fr.cta_label_en.trim() : undefined,
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
    ? raw.bio_paragraphs
        .map((p) =>
          String(p)
            .trim()
            .replace(/oficio ap[ií]cola/gi, 'manejo apícola'),
        )
        .filter(Boolean)
    : d.bio_paragraphs;

  const bioMetrics: Array<{ value: string; label: string }> = Array.isArray(raw.bio_metrics)
    ? raw.bio_metrics
        .map((bm) => {
          if (bm && typeof bm === 'object') {
            const bmr = bm as Record<string, unknown>;
            return {
              value: asString(bmr.value, '').trim(),
              label: asString(bmr.label, '')
                .trim()
                .replace(/oficio ap[ií]cola/gi, 'trayectoria apícola'),
            };
          }
          return null;
        })
        .filter((bm): bm is { value: string; label: string } => Boolean(bm && bm.value))
    : d.bio_metrics;

  const rawHero = asString(raw.hero_image, d.hero_image).trim();
  const heroImage =
    !rawHero || rawHero === '/assets/editorial/experiencias.jpg' ? d.hero_image : rawHero;

  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    edition_note: asString(raw.edition_note, d.edition_note).trim(),
    edition_note_en: typeof raw.edition_note_en === 'string' ? raw.edition_note_en.trim() : d.edition_note_en,
    hero_image: heroImage,
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
  hero_cta_label?: string;
  hero_cta_label_en?: string;
  hero_cta_href?: string;
  hero_secondary_label?: string;
  hero_secondary_label_en?: string;
  hero_secondary_href?: string;

  // Ejes de la estadía (Pilares)
  pilares_kicker?: string;
  pilares_kicker_en?: string;
  pilares_title?: string;
  pilares_title_en?: string;

  cabana_title: string;
  cabana_title_en?: string;
  cabana_desc: string;
  cabana_desc_en?: string;
  cabana_badge?: string;
  cabana_badge_en?: string;

  kayak_title: string;
  kayak_title_en?: string;
  kayak_desc: string;
  kayak_desc_en?: string;
  kayak_badge?: string;
  kayak_badge_en?: string;

  apiturismo_title: string;
  apiturismo_title_en?: string;
  apiturismo_desc: string;
  apiturismo_desc_en?: string;
  apiturismo_badge?: string;
  apiturismo_badge_en?: string;

  logistica_title: string;
  logistica_title_en?: string;
  logistica_text: string;
  logistica_text_en?: string;

  // Formulario de Solicitud
  solicitud_kicker?: string;
  solicitud_kicker_en?: string;
  solicitud_title?: string;
  solicitud_title_en?: string;
  solicitud_subtitle?: string;
  solicitud_subtitle_en?: string;

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
  hero_image:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/bdf279ee-9dc4-4f52-9c29-2c3e522cd8db.webp',
  hero_image_opacity: 30,
  hero_cta_label: 'Consultar disponibilidad',
  hero_cta_label_en: 'Check availability',
  hero_cta_href: '#solicitud',
  hero_secondary_label: 'Conocer la experiencia',
  hero_secondary_label_en: 'Explore the experience',
  hero_secondary_href: '#pilares',

  pilares_kicker: 'Ejes de la Estadía',
  pilares_kicker_en: 'Stay Pillars',
  pilares_title: 'Tres dimensiones del territorio insular',
  pilares_title_en: 'Three dimensions of the island territory',

  cabana_title: 'Cabaña Nativa',
  cabana_title_en: 'Native Cabin',
  cabana_desc:
    'Construida en maderas nobles recuperadas de Tepa, Coigüe y Ciprés de las Guaitecas. Cuenta con estufa de combustión lenta, ventanales sobre la copa de los árboles y cocina equipada para preparar productos de recolección local.',
  cabana_desc_en:
    'Built from reclaimed native woods of Tepa, Coigüe, and Ciprés de las Guaitecas. Equipped with a wood stove, canopy-view windows, and kitchen for local gatherings.',
  cabana_badge: 'Fogón y combustión lenta',
  cabana_badge_en: 'Wood stove and slow combustion',

  kayak_title: 'Kayak en Esteros',
  kayak_title_en: 'Estuary Kayaking',
  kayak_desc:
    'Acceso directo a los brazos de agua protegidos del estero de Pureo. Navegación en kayak de travesía entre cisnes de cuello negro, huillines y arrayanales inundados. Una perspectiva única del ecotono bosque-mar.',
  kayak_desc_en:
    'Direct access to sheltered waters of the Pureo estuary. Touring kayak navigation among black-necked swans, river otters, and flooded arrayán groves.',
  kayak_badge: 'Esteros y arrayanales costeros',
  kayak_badge_en: 'Estuaries and coastal arrayán groves',

  apiturismo_title: 'Ronda de Colmenas',
  apiturismo_title_en: 'Hive Inspection',
  apiturismo_desc:
    'Acompañamiento a Cristina Miranda en la revisión de apiarios. Equipado con traje de protección integral, descubrirás la arquitectura interior del panal, la danza de pecoreo y degustarás miel virgen tibia recién extraída con espátula.',
  apiturismo_desc_en:
    'Join Cristina Miranda during apiary checks. Wearing a full protective suit, observe comb architecture and taste fresh warm honey straight from unsealed combs.',
  apiturismo_badge: 'Equipo de seguridad incluido',
  apiturismo_badge_en: 'Safety equipment included',

  logistica_title: 'Cómo llegar a Pureo',
  logistica_title_en: 'Getting to Pureo',
  logistica_text:
    'Predio Pureo se ubica en la comuna de Queilén, en la costa oriental de la Isla Grande de Chiloé, a 45 minutos al sur de Chonchi y 75 minutos desde el aeródromo de Mocopulli (Castro).',
  logistica_text_en:
    'Predio Pureo is located in Queilén on the eastern coast of Chiloé Island, 45 minutes south of Chonchi and 75 minutes from Mocopulli airport (Castro).',

  solicitud_kicker: 'Reserva de Fechas',
  solicitud_kicker_en: 'Date Booking',
  solicitud_title: 'Solicitud de Inmersión Territorial',
  solicitud_title_en: 'Territorial Immersion Request',
  solicitud_subtitle: 'Coordinación directa para estancias privadas y jornadas en Chiloé.',
  solicitud_subtitle_en: 'Direct coordination for private stays and days in Chiloé.',
};

export function parseExperienciasPureoSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasPureoSettings {
  const d = DEFAULT_EXPERIENCIAS_PUREO_SETTINGS;
  if (!raw) return { ...d };
  const rawHero = asString(raw.hero_image, d.hero_image).trim();
  const heroImage =
    !rawHero || rawHero === '/assets/editorial/experiencias.jpg' ? d.hero_image : rawHero;
  return {
    kicker: asString(raw.kicker, d.kicker).trim(),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    hero_image: heroImage,
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 30, 0, 100),
    hero_cta_label: asString(raw.hero_cta_label, d.hero_cta_label ?? '').trim(),
    hero_cta_label_en: typeof raw.hero_cta_label_en === 'string' ? raw.hero_cta_label_en.trim() : d.hero_cta_label_en,
    hero_cta_href: sanitizeStoreHref(raw.hero_cta_href, d.hero_cta_href) ?? (d.hero_cta_href ?? '#solicitud'),
    hero_secondary_label: asString(raw.hero_secondary_label, d.hero_secondary_label ?? '').trim(),
    hero_secondary_label_en: typeof raw.hero_secondary_label_en === 'string' ? raw.hero_secondary_label_en.trim() : d.hero_secondary_label_en,
    hero_secondary_href: sanitizeStoreHref(raw.hero_secondary_href, d.hero_secondary_href) ?? (d.hero_secondary_href ?? '#pilares'),

    pilares_kicker: asString(raw.pilares_kicker, d.pilares_kicker ?? '').trim(),
    pilares_kicker_en: typeof raw.pilares_kicker_en === 'string' ? raw.pilares_kicker_en.trim() : d.pilares_kicker_en,
    pilares_title: asString(raw.pilares_title, d.pilares_title ?? '').trim(),
    pilares_title_en: typeof raw.pilares_title_en === 'string' ? raw.pilares_title_en.trim() : d.pilares_title_en,

    cabana_title: asString(raw.cabana_title, d.cabana_title).trim(),
    cabana_title_en: typeof raw.cabana_title_en === 'string' ? raw.cabana_title_en.trim() : d.cabana_title_en,
    cabana_desc: asString(raw.cabana_desc, d.cabana_desc).trim(),
    cabana_desc_en: typeof raw.cabana_desc_en === 'string' ? raw.cabana_desc_en.trim() : d.cabana_desc_en,
    cabana_badge: asString(raw.cabana_badge, d.cabana_badge ?? '').trim(),
    cabana_badge_en: typeof raw.cabana_badge_en === 'string' ? raw.cabana_badge_en.trim() : d.cabana_badge_en,

    kayak_title: asString(raw.kayak_title, d.kayak_title).trim(),
    kayak_title_en: typeof raw.kayak_title_en === 'string' ? raw.kayak_title_en.trim() : d.kayak_title_en,
    kayak_desc: asString(raw.kayak_desc, d.kayak_desc).trim(),
    kayak_desc_en: typeof raw.kayak_desc_en === 'string' ? raw.kayak_desc_en.trim() : d.kayak_desc_en,
    kayak_badge: asString(raw.kayak_badge, d.kayak_badge ?? '').trim(),
    kayak_badge_en: typeof raw.kayak_badge_en === 'string' ? raw.kayak_badge_en.trim() : d.kayak_badge_en,

    apiturismo_title: asString(raw.apiturismo_title, d.apiturismo_title).trim(),
    apiturismo_title_en: typeof raw.apiturismo_title_en === 'string' ? raw.apiturismo_title_en.trim() : d.apiturismo_title_en,
    apiturismo_desc: asString(raw.apiturismo_desc, d.apiturismo_desc).trim(),
    apiturismo_desc_en: typeof raw.apiturismo_desc_en === 'string' ? raw.apiturismo_desc_en.trim() : d.apiturismo_desc_en,
    apiturismo_badge: asString(raw.apiturismo_badge, d.apiturismo_badge ?? '').trim(),
    apiturismo_badge_en: typeof raw.apiturismo_badge_en === 'string' ? raw.apiturismo_badge_en.trim() : d.apiturismo_badge_en,

    logistica_title: asString(raw.logistica_title, d.logistica_title).trim(),
    logistica_title_en: typeof raw.logistica_title_en === 'string' ? raw.logistica_title_en.trim() : d.logistica_title_en,
    logistica_text: asString(raw.logistica_text, d.logistica_text).trim(),
    logistica_text_en: typeof raw.logistica_text_en === 'string' ? raw.logistica_text_en.trim() : d.logistica_text_en,

    solicitud_kicker: asString(raw.solicitud_kicker, d.solicitud_kicker ?? '').trim(),
    solicitud_kicker_en: typeof raw.solicitud_kicker_en === 'string' ? raw.solicitud_kicker_en.trim() : d.solicitud_kicker_en,
    solicitud_title: asString(raw.solicitud_title, d.solicitud_title ?? '').trim(),
    solicitud_title_en: typeof raw.solicitud_title_en === 'string' ? raw.solicitud_title_en.trim() : d.solicitud_title_en,
    solicitud_subtitle: asString(raw.solicitud_subtitle, d.solicitud_subtitle ?? '').trim(),
    solicitud_subtitle_en: typeof raw.solicitud_subtitle_en === 'string' ? raw.solicitud_subtitle_en.trim() : d.solicitud_subtitle_en,

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
  hero_cta_label?: string;
  hero_cta_label_en?: string;
  hero_cta_href?: string;
  hero_secondary_label?: string;
  hero_secondary_label_en?: string;
  hero_secondary_href?: string;

  // Curatoria pedagógica / Líneas formativas
  curatoria_kicker?: string;
  curatoria_kicker_en?: string;
  curatoria_title?: string;
  curatoria_title_en?: string;
  curatoria_subtitle?: string;
  curatoria_subtitle_en?: string;

  // Programa 1: Análisis Sensorial
  programa1_tag?: string;
  programa1_tag_en?: string;
  programa1_title: string;
  programa1_title_en?: string;
  programa1_desc: string;
  programa1_desc_en?: string;
  programa1_spec1?: string;
  programa1_spec1_en?: string;
  programa1_spec2?: string;
  programa1_spec2_en?: string;

  // Programa 2: Manejo y Técnica
  programa2_tag?: string;
  programa2_tag_en?: string;
  programa2_title: string;
  programa2_title_en?: string;
  programa2_desc: string;
  programa2_desc_en?: string;
  programa2_spec1?: string;
  programa2_spec1_en?: string;
  programa2_spec2?: string;
  programa2_spec2_en?: string;

  // Programa 3: Botánica Austral
  programa3_tag?: string;
  programa3_tag_en?: string;
  programa3_title: string;
  programa3_title_en?: string;
  programa3_desc: string;
  programa3_desc_en?: string;
  programa3_spec1?: string;
  programa3_spec1_en?: string;
  programa3_spec2?: string;
  programa3_spec2_en?: string;

  // Convocatorias abiertas
  convocatorias_kicker?: string;
  convocatorias_kicker_en?: string;
  convocatorias_title?: string;
  convocatorias_title_en?: string;

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
  hero_image:
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/9f75a68a-2464-4096-a11a-40ddd4a22b9f.webp',
  hero_image_opacity: 25,
  hero_cta_label: 'Coordinar taller privado',
  hero_cta_label_en: 'Coordinate private workshop',
  hero_cta_href: '#solicitud',
  hero_secondary_label: 'Ver programas formativos',
  hero_secondary_label_en: 'View training programs',
  hero_secondary_href: '#programas',

  curatoria_kicker: 'Curatoria Pedagógica',
  curatoria_kicker_en: 'Pedagogical Curatorship',
  curatoria_title: 'Líneas de aprendizaje e inmersión',
  curatoria_title_en: 'Learning & immersion tracks',
  curatoria_subtitle:
    'Diseñados para instituciones educativas, equipos corporativos, profesionales de la gastronomía y comunidades interesadas en la soberanía biológica.',
  curatoria_subtitle_en:
    'Designed for educational institutions, corporate teams, gastronomy professionals, and communities interested in biological sovereignty.',

  programa1_tag: 'Metodología de Cata',
  programa1_tag_en: 'Tasting Methodology',
  programa1_title: 'Análisis Sensorial de Mieles Crudas',
  programa1_title_en: 'Raw Honey Sensory Evaluation',
  programa1_desc:
    'Calibración de receptores olfativos y gustativos para discernir notas florales, ácidas, minerales y balsámicas en monoflorales de Ulmo, Tiaca, Arrayán y poliflorales de cordillera.',
  programa1_desc_en:
    'Calibration of sensory receptors to identify floral, crisp, mineral, and balsamic notes across Ulmo, Tiaca, Arrayán, and mountain polyfloral honeys.',
  programa1_spec1: 'Rueda de descriptores y fichas técnicas',
  programa1_spec1_en: 'Descriptor wheel and technical sheets',
  programa1_spec2: 'Duración: 2.5 horas',
  programa1_spec2_en: 'Duration: 2.5 hours',

  programa2_tag: 'Manejo Respetuoso',
  programa2_tag_en: 'Respectful Management',
  programa2_title: 'Técnica y Manejo Apícola',
  programa2_title_en: 'Apicultural Technique & Colony Management',
  programa2_desc:
    'Fundamentos de la vida en la colmena: castas, comunicación por feromonas, manejo del humo frío, diagnóstico sanitario natural y adaptación a climas hostiles sin jarabes de azúcar.',
  programa2_desc_en:
    'Core hive fundamentals: castes, pheromone communication, cool smoke handling, natural sanitary diagnosis, and climate adaptation without sugar syrups.',
  programa2_spec1: 'Seguridad práctica y uso del velo',
  programa2_spec1_en: 'Practical safety and veil handling',
  programa2_spec2: 'Jornada de 4 a 6 horas',
  programa2_spec2_en: 'Duration: 4 to 6 hours',

  programa3_tag: 'Ecología del Bosque',
  programa3_tag_en: 'Forest Ecology',
  programa3_title: 'Botánica Melífera & Polen',
  programa3_title_en: 'Melliferous Botany & Pollen',
  programa3_desc:
    'Reconocimiento morfológico de especies nativas (Eucryphia cordifolia, Caldcluvia paniculata, Luma apiculata) y su correlación con los granos de polen observados bajo microscopio óptico.',
  programa3_desc_en:
    'Morphological identification of native forest species and correlation with pollen grains under optical microscopy.',
  programa3_spec1: 'Melisopalinología aplicada a origen',
  programa3_spec1_en: 'Melissopalynology applied to origin',
  programa3_spec2: 'Duración: 3 horas',
  programa3_spec2_en: 'Duration: 3 hours',

  convocatorias_kicker: 'Convocatorias Abiertas',
  convocatorias_kicker_en: 'Open Calls',
  convocatorias_title: 'Próximas fechas programadas',
  convocatorias_title_en: 'Upcoming scheduled dates',
};

export function parseExperienciasTalleresSettings(
  raw: Record<string, unknown> | null | undefined,
): ExperienciasTalleresSettings {
  const d = DEFAULT_EXPERIENCIAS_TALLERES_SETTINGS;
  if (!raw) return { ...d };
  const rawHero = asString(raw.hero_image, d.hero_image).trim();
  const heroImage =
    !rawHero || rawHero === '/assets/editorial/experiencias.jpg' ? d.hero_image : rawHero;
  const rawKicker = asString(raw.kicker, d.kicker).trim();
  const rawTitleEn = typeof raw.title_en === 'string' ? raw.title_en.trim() : d.title_en;
  const rawProg2Title = asString(raw.programa2_title, d.programa2_title).trim();
  const rawProg2TitleEn =
    typeof raw.programa2_title_en === 'string' ? raw.programa2_title_en.trim() : d.programa2_title_en;

  return {
    kicker: rawKicker.replace(/^Oficio Vivo\s*&\s*/i, 'Técnica & '),
    kicker_en: typeof raw.kicker_en === 'string' ? raw.kicker_en.trim() : d.kicker_en,
    title: asString(raw.title, d.title).trim(),
    title_en: rawTitleEn === 'Biocultural Workshops' ? d.title_en : rawTitleEn,
    subtitle: asString(raw.subtitle, d.subtitle).trim(),
    subtitle_en: typeof raw.subtitle_en === 'string' ? raw.subtitle_en.trim() : d.subtitle_en,
    hero_image: heroImage,
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 25, 0, 100),
    hero_cta_label: asString(raw.hero_cta_label, d.hero_cta_label ?? '').trim(),
    hero_cta_label_en: typeof raw.hero_cta_label_en === 'string' ? raw.hero_cta_label_en.trim() : d.hero_cta_label_en,
    hero_cta_href: sanitizeStoreHref(raw.hero_cta_href, d.hero_cta_href) ?? (d.hero_cta_href ?? '#solicitud'),
    hero_secondary_label: asString(raw.hero_secondary_label, d.hero_secondary_label ?? '').trim(),
    hero_secondary_label_en: typeof raw.hero_secondary_label_en === 'string' ? raw.hero_secondary_label_en.trim() : d.hero_secondary_label_en,
    hero_secondary_href: sanitizeStoreHref(raw.hero_secondary_href, d.hero_secondary_href) ?? (d.hero_secondary_href ?? '#programas'),

    curatoria_kicker: asString(raw.curatoria_kicker, d.curatoria_kicker ?? '').trim(),
    curatoria_kicker_en: typeof raw.curatoria_kicker_en === 'string' ? raw.curatoria_kicker_en.trim() : d.curatoria_kicker_en,
    curatoria_title: asString(raw.curatoria_title, d.curatoria_title ?? '').trim(),
    curatoria_title_en: typeof raw.curatoria_title_en === 'string' ? raw.curatoria_title_en.trim() : d.curatoria_title_en,
    curatoria_subtitle: asString(raw.curatoria_subtitle, d.curatoria_subtitle ?? '').trim(),
    curatoria_subtitle_en: typeof raw.curatoria_subtitle_en === 'string' ? raw.curatoria_subtitle_en.trim() : d.curatoria_subtitle_en,

    programa1_tag: asString(raw.programa1_tag, d.programa1_tag ?? '').trim(),
    programa1_tag_en: typeof raw.programa1_tag_en === 'string' ? raw.programa1_tag_en.trim() : d.programa1_tag_en,
    programa1_title: asString(raw.programa1_title, d.programa1_title).trim(),
    programa1_title_en: typeof raw.programa1_title_en === 'string' ? raw.programa1_title_en.trim() : d.programa1_title_en,
    programa1_desc: asString(raw.programa1_desc, d.programa1_desc).trim(),
    programa1_desc_en: typeof raw.programa1_desc_en === 'string' ? raw.programa1_desc_en.trim() : d.programa1_desc_en,
    programa1_spec1: asString(raw.programa1_spec1, d.programa1_spec1 ?? '').trim(),
    programa1_spec1_en: typeof raw.programa1_spec1_en === 'string' ? raw.programa1_spec1_en.trim() : d.programa1_spec1_en,
    programa1_spec2: asString(raw.programa1_spec2, d.programa1_spec2 ?? '').trim(),
    programa1_spec2_en: typeof raw.programa1_spec2_en === 'string' ? raw.programa1_spec2_en.trim() : d.programa1_spec2_en,

    programa2_tag: asString(raw.programa2_tag, d.programa2_tag ?? '').trim(),
    programa2_tag_en: typeof raw.programa2_tag_en === 'string' ? raw.programa2_tag_en.trim() : d.programa2_tag_en,
    programa2_title:
      rawProg2Title === 'Iniciación al Oficio Apícola' ? d.programa2_title : rawProg2Title,
    programa2_title_en:
      rawProg2TitleEn === 'Beekeeping Craft Initiation' ? d.programa2_title_en : rawProg2TitleEn,
    programa2_desc: asString(raw.programa2_desc, d.programa2_desc).trim(),
    programa2_desc_en: typeof raw.programa2_desc_en === 'string' ? raw.programa2_desc_en.trim() : d.programa2_desc_en,
    programa2_spec1: asString(raw.programa2_spec1, d.programa2_spec1 ?? '').trim(),
    programa2_spec1_en: typeof raw.programa2_spec1_en === 'string' ? raw.programa2_spec1_en.trim() : d.programa2_spec1_en,
    programa2_spec2: asString(raw.programa2_spec2, d.programa2_spec2 ?? '').trim(),
    programa2_spec2_en: typeof raw.programa2_spec2_en === 'string' ? raw.programa2_spec2_en.trim() : d.programa2_spec2_en,

    programa3_tag: asString(raw.programa3_tag, d.programa3_tag ?? '').trim(),
    programa3_tag_en: typeof raw.programa3_tag_en === 'string' ? raw.programa3_tag_en.trim() : d.programa3_tag_en,
    programa3_title: asString(raw.programa3_title, d.programa3_title).trim(),
    programa3_title_en: typeof raw.programa3_title_en === 'string' ? raw.programa3_title_en.trim() : d.programa3_title_en,
    programa3_desc: asString(raw.programa3_desc, d.programa3_desc).trim(),
    programa3_desc_en: typeof raw.programa3_desc_en === 'string' ? raw.programa3_desc_en.trim() : d.programa3_desc_en,
    programa3_spec1: asString(raw.programa3_spec1, d.programa3_spec1 ?? '').trim(),
    programa3_spec1_en: typeof raw.programa3_spec1_en === 'string' ? raw.programa3_spec1_en.trim() : d.programa3_spec1_en,
    programa3_spec2: asString(raw.programa3_spec2, d.programa3_spec2 ?? '').trim(),
    programa3_spec2_en: typeof raw.programa3_spec2_en === 'string' ? raw.programa3_spec2_en.trim() : d.programa3_spec2_en,

    convocatorias_kicker: asString(raw.convocatorias_kicker, d.convocatorias_kicker ?? '').trim(),
    convocatorias_kicker_en: typeof raw.convocatorias_kicker_en === 'string' ? raw.convocatorias_kicker_en.trim() : d.convocatorias_kicker_en,
    convocatorias_title: asString(raw.convocatorias_title, d.convocatorias_title ?? '').trim(),
    convocatorias_title_en: typeof raw.convocatorias_title_en === 'string' ? raw.convocatorias_title_en.trim() : d.convocatorias_title_en,

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
  garantia1_title: string;
  garantia1_title_en?: string;
  garantia1_desc: string;
  garantia1_desc_en?: string;
  garantia2_title: string;
  garantia2_title_en?: string;
  garantia2_desc: string;
  garantia2_desc_en?: string;
  garantia3_title: string;
  garantia3_title_en?: string;
  garantia3_desc: string;
  garantia3_desc_en?: string;
  garantia4_title: string;
  garantia4_title_en?: string;
  garantia4_desc: string;
  garantia4_desc_en?: string;

  // Hero Secondary CTA
  hero_secondary_cta_label: string;
  hero_secondary_cta_label_en?: string;
  hero_secondary_cta_href: string;

  // Hero Pills (3 pilares)
  show_hero_pills?: boolean;
  pill1_title: string;
  pill1_title_en?: string;
  pill1_subtitle: string;
  pill1_subtitle_en?: string;
  pill2_title: string;
  pill2_title_en?: string;
  pill2_subtitle: string;
  pill2_subtitle_en?: string;
  pill3_title: string;
  pill3_title_en?: string;
  pill3_subtitle: string;
  pill3_subtitle_en?: string;

  // Encabezado de Segmentos B2B
  segmentos_kicker: string;
  segmentos_kicker_en?: string;
  segmentos_title: string;
  segmentos_title_en?: string;
  segmentos_subtitle: string;
  segmentos_subtitle_en?: string;
  segmentos_cta_label: string;
  segmentos_cta_label_en?: string;

  // Tarjeta 1: Cafeterías de Especialidad
  seg_cafeterias_title: string;
  seg_cafeterias_title_en?: string;
  seg_cafeterias_badge: string;
  seg_cafeterias_badge_en?: string;
  seg_cafeterias_desc: string;
  seg_cafeterias_desc_en?: string;
  seg_cafeterias_h1: string;
  seg_cafeterias_h1_en?: string;
  seg_cafeterias_h2: string;
  seg_cafeterias_h2_en?: string;
  seg_cafeterias_h3: string;
  seg_cafeterias_h3_en?: string;
  seg_cafeterias_image: string;

  // Tarjeta 2: Hoteles & Amenities
  seg_hoteles_title: string;
  seg_hoteles_title_en?: string;
  seg_hoteles_badge: string;
  seg_hoteles_badge_en?: string;
  seg_hoteles_desc: string;
  seg_hoteles_desc_en?: string;
  seg_hoteles_h1: string;
  seg_hoteles_h1_en?: string;
  seg_hoteles_h2: string;
  seg_hoteles_h2_en?: string;
  seg_hoteles_h3: string;
  seg_hoteles_h3_en?: string;
  seg_hoteles_image: string;

  // Tarjeta 3: Tiendas Gourmet & Emporios
  seg_gourmet_title: string;
  seg_gourmet_title_en?: string;
  seg_gourmet_badge: string;
  seg_gourmet_badge_en?: string;
  seg_gourmet_desc: string;
  seg_gourmet_desc_en?: string;
  seg_gourmet_h1: string;
  seg_gourmet_h1_en?: string;
  seg_gourmet_h2: string;
  seg_gourmet_h2_en?: string;
  seg_gourmet_h3: string;
  seg_gourmet_h3_en?: string;
  seg_gourmet_image: string;

  // Tarjeta 4: Encuentros & Presentaciones Privadas
  seg_ferias_title: string;
  seg_ferias_title_en?: string;
  seg_ferias_badge: string;
  seg_ferias_badge_en?: string;
  seg_ferias_desc: string;
  seg_ferias_desc_en?: string;
  seg_ferias_h1: string;
  seg_ferias_h1_en?: string;
  seg_ferias_h2: string;
  seg_ferias_h2_en?: string;
  seg_ferias_h3: string;
  seg_ferias_h3_en?: string;
  seg_ferias_image: string;

  // Tarjeta 5: Programa de Revendedores
  seg_revendedores_title: string;
  seg_revendedores_title_en?: string;
  seg_revendedores_badge: string;
  seg_revendedores_badge_en?: string;
  seg_revendedores_desc: string;
  seg_revendedores_desc_en?: string;
  seg_revendedores_h1: string;
  seg_revendedores_h1_en?: string;
  seg_revendedores_h2: string;
  seg_revendedores_h2_en?: string;
  seg_revendedores_h3: string;
  seg_revendedores_h3_en?: string;
  seg_revendedores_image: string;

  // Condiciones Comerciales y Logística Mayorista
  condiciones_kicker: string;
  condiciones_kicker_en?: string;
  condiciones_title: string;
  condiciones_title_en?: string;
  condiciones_subtitle: string;
  condiciones_subtitle_en?: string;

  moq_title: string;
  moq_title_en?: string;
  moq_description: string;
  moq_description_en?: string;
  moq_highlight: string;
  moq_highlight_en?: string;

  despacho_title: string;
  despacho_title_en?: string;
  despacho_description: string;
  despacho_description_en?: string;
  despacho_nota: string;
  despacho_nota_en?: string;

  descuentos_title: string;
  descuentos_title_en?: string;
  descuentos_items: string;
  descuentos_items_en?: string;

  garantia_title: string;
  garantia_title_en?: string;
  garantia_description: string;
  garantia_description_en?: string;
  garantia_nota: string;
  garantia_nota_en?: string;

  // Formulario de Registro / Solicitud
  form_kicker: string;
  form_kicker_en?: string;
  form_title: string;
  form_title_en?: string;
  form_subtitle: string;
  form_subtitle_en?: string;

  // Posicionamiento & SEO
  seo_title?: string;
  seo_title_en?: string;
  seo_description?: string;
  seo_description_en?: string;

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
  hero_image: B2B_STORAGE_IMAGES.cafeterias,
  hero_image_opacity: 35,
  hero_badge: 'Canal Directo & Formatos de Hospitalidad',
  hero_badge_en: 'Direct Channel & Hospitality Formats',
  cta_label: 'Solicitar catálogo mayorista',
  cta_label_en: 'Request wholesale catalog',
  cta_href: '#solicitud',
  hero_secondary_cta_label: 'Explorar formatos & segmentos',
  hero_secondary_cta_label_en: 'Explore formats & segments',
  hero_secondary_cta_href: '#segmentos',

  show_hero_pills: true,
  pill1_title: 'Pureza de Origen',
  pill1_title_en: 'Origin Purity',
  pill1_subtitle: '<18% humedad · Cruda y sin pasteurizar',
  pill1_subtitle_en: '<18% moisture · Raw & unpasteurized',
  pill2_title: 'Despacho Nacional',
  pill2_title_en: 'Nationwide Shipping',
  pill2_subtitle: 'Cobertura prioritaria con seguro de quiebre',
  pill2_subtitle_en: 'Priority coverage with breakage insurance',
  pill3_title: 'Facturación Formal',
  pill3_title_en: 'Commercial Invoicing',
  pill3_subtitle: 'Emisión tributaria inmediata con RUT empresa',
  pill3_subtitle_en: 'Immediate tax invoicing with company RUT',

  segmentos_kicker: 'Formatos a Medida',
  segmentos_kicker_en: 'Tailored Formats',
  segmentos_title: 'Cinco propuestas para diferentes tipos de espacio',
  segmentos_title_en: 'Five proposals for distinct spaces',
  segmentos_subtitle:
    'Selecciona tu área de actividad para conocer los formatos específicos, volúmenes de entrega y ventajas comerciales asociadas.',
  segmentos_subtitle_en:
    'Select your industry to explore specific formats, delivery volumes, and associated commercial terms.',
  segmentos_cta_label: 'Ver propuesta completa',
  segmentos_cta_label_en: 'View full proposal',

  seg_cafeterias_title: 'Cafeterías de Especialidad',
  seg_cafeterias_title_en: 'Specialty Coffee Shops',
  seg_cafeterias_badge: 'Barismo & Repostería',
  seg_cafeterias_badge_en: 'Barista & Bakery',
  seg_cafeterias_desc:
    'Sachets monodosis para servicio de barra, miel cruda a granel para repostería fina y descriptores de cata para maridar con orígenes de café.',
  seg_cafeterias_desc_en:
    'Single-dose sachets for bar service, bulk raw honey for fine baking, and cupping descriptors to pair with coffee origins.',
  seg_cafeterias_h1: 'Sachets 15g sellados',
  seg_cafeterias_h1_en: '15g sealed sachets',
  seg_cafeterias_h2: 'Formato granel 1.2kg y 5kg',
  seg_cafeterias_h2_en: '1.2kg and 5kg bulk formats',
  seg_cafeterias_h3: 'Fichas de cata para baristas',
  seg_cafeterias_h3_en: 'Cupping sheets for baristas',
  seg_cafeterias_image: B2B_STORAGE_IMAGES.cafeterias,

  seg_hoteles_title: 'Hoteles & Amenities',
  seg_hoteles_title_en: 'Hotels & Luxury Amenities',
  seg_hoteles_badge: 'Hospitalidad de Lujo',
  seg_hoteles_badge_en: 'Luxury Hospitality',
  seg_hoteles_desc:
    'Frascos de cortesía de 25g para habitaciones, formatos para salón de desayuno y amenities de autor formulados con propóleo virgen.',
  seg_hoteles_desc_en:
    '25g courtesy jars for guest rooms, breakfast room formats, and signature amenities formulated with virgin propolis.',
  seg_hoteles_h1: 'Frascos miniatura 25g',
  seg_hoteles_h1_en: '25g miniature jars',
  seg_hoteles_h2: 'Línea de cuidado con cera y propóleo',
  seg_hoteles_h2_en: 'Care line with beeswax and propolis',
  seg_hoteles_h3: 'Presentación de cortesía elegante',
  seg_hoteles_h3_en: 'Elegant courtesy presentation',
  seg_hoteles_image: B2B_STORAGE_IMAGES.hoteles,

  seg_gourmet_title: 'Tiendas Gourmet & Emporios',
  seg_gourmet_title_en: 'Gourmet Boutiques & Emporiums',
  seg_gourmet_badge: 'Retail Seleccionado',
  seg_gourmet_badge_en: 'Curated Retail',
  seg_gourmet_desc:
    'Ediciones numeradas de autor con trazabilidad verificable por lote, formatos de alta rotación para mesón y márgenes comerciales protegidos.',
  seg_gourmet_desc_en:
    'Numbered limited editions with verifiable batch traceability, high-turnover counter formats, and protected commercial margins.',
  seg_gourmet_h1: 'Embalaje de lujo para regalo',
  seg_gourmet_h1_en: 'Luxury gift packaging',
  seg_gourmet_h2: 'Material de apoyo y fichas de origen',
  seg_gourmet_h2_en: 'Support material and origin datasheets',
  seg_gourmet_h3: 'Rotación y reposición prioritaria',
  seg_gourmet_h3_en: 'Priority turnover and restocking',
  seg_gourmet_image: B2B_STORAGE_IMAGES['tiendas-gourmet'],

  seg_ferias_title: 'Encuentros & Presentaciones Privadas',
  seg_ferias_title_en: 'Private Gatherings & Tastings',
  seg_ferias_badge: 'Activaciones de Marca',
  seg_ferias_badge_en: 'Brand Activations',
  seg_ferias_desc:
    'Packs de degustación sensorial, presencia en stands gastronómicos de autor y formatos institucionales que cuentan la historia del bosque chilote.',
  seg_ferias_desc_en:
    'Sensory tasting packs, presence in bespoke culinary stands, and institutional formats telling the story of Chiloé forest.',
  seg_ferias_h1: 'Muestras sensoriales guiadas',
  seg_ferias_h1_en: 'Guided sensory samples',
  seg_ferias_h2: 'Formatos institucionales para regalo',
  seg_ferias_h2_en: 'Institutional gift formats',
  seg_ferias_h3: 'Soporte narrativo y fichas botánicas',
  seg_ferias_h3_en: 'Narrative support and botanical datasheets',
  seg_ferias_image: B2B_STORAGE_IMAGES.ferias,

  seg_revendedores_title: 'Programa de Revendedores',
  seg_revendedores_title_en: 'Reseller & Ambassador Program',
  seg_revendedores_badge: 'Embajadores Territoriales',
  seg_revendedores_badge_en: 'Territorial Ambassadors',
  seg_revendedores_desc:
    'Para distribuidores y tiendas de especialidad que comparten nuestro estándar de calidad. Margen por volumen, catálogo digital y soporte logístico continuo.',
  seg_revendedores_desc_en:
    'For distributors and specialty stores sharing our quality standard. Volume-tiered margins, digital catalog, and continuous logistics support.',
  seg_revendedores_h1: 'Escala progresiva de descuentos',
  seg_revendedores_h1_en: 'Progressive discount tiers',
  seg_revendedores_h2: 'Acceso a terminal de venta en ferias',
  seg_revendedores_h2_en: 'Access to fair point-of-sale terminal',
  seg_revendedores_h3: 'Capacitación en producto y origen',
  seg_revendedores_h3_en: 'Product and origin training',
  seg_revendedores_image: B2B_STORAGE_IMAGES.revendedores,

  condiciones_kicker: 'Términos Transparentes',
  condiciones_kicker_en: 'Transparent Commercial Terms',
  condiciones_title: 'Condiciones Comerciales y Logística Mayorista',
  condiciones_title_en: 'Commercial Conditions & Wholesale Logistics',
  condiciones_subtitle:
    'Parámetros operativos claros para compras institucionales, distribución y hostelería.',
  condiciones_subtitle_en:
    'Clear operational parameters for institutional purchasing, distribution, and hospitality.',

  moq_title: 'Pedido Mínimo (MOQ)',
  moq_title_en: 'Minimum Order Quantity (MOQ)',
  moq_description: '120 frascos surtidos para pedidos mayoristas regulares de reposición.',
  moq_description_en: '120 assorted jars for regular wholesale replenishment orders.',
  moq_highlight:
    'Excepción: Los Sets de Entrada para cafeterías, hoteles, tiendas gourmet y revendedores (desde $78.400 neto) no exigen el mínimo de 120 unidades, facilitando la primera degustación en barra o vitrina.',
  moq_highlight_en:
    'Exception: Starter Sets for coffee shops, hotels, gourmet stores, and brand ambassadors (from $78,400 net) do not require the 120-unit minimum, facilitating initial tasting service or display.',

  despacho_title: 'Despacho & Cobertura',
  despacho_title_en: 'Shipping & Coverage',
  despacho_description:
    'Despacho gratuito en la Región Metropolitana en compras netas a partir de $900.000.',
  despacho_description_en:
    'Complimentary shipping in the Metropolitan Region on net purchases from $900,000.',
  despacho_nota:
    'Envíos a todo Chile vía courier prioritario con embalaje técnico de alta protección y reposición inmediata por rotura en transporte.',
  despacho_nota_en:
    'Priority nationwide shipping across Chile with high-protection technical packaging and immediate replacement in case of transport damage.',

  descuentos_title: 'Escala de Descuentos',
  descuentos_title_en: 'Volume Discount Schedule',
  descuentos_items:
    '• 5% de descuento adicional en compras sobre $500.000 neto.\n• 10% de descuento adicional en compras sobre $1.000.000 neto.\n• Facturación formal inmediata con RUT empresa (afecta o exenta según ítem).',
  descuentos_items_en:
    '• 5% additional discount on net orders over $500,000.\n• 10% additional discount on net orders over $1,000,000.\n• Instant electronic tax invoicing with company tax ID (SII DTE).',

  garantia_title: 'Respaldo & Garantía Técnica',
  garantia_title_en: 'Quality Assurance & Technical Guarantee',
  garantia_description:
    'Ventana de 30 días corridos desde la recepción para cualquier reclamo técnico o ajuste de lote.',
  garantia_description_en:
    '30-day window upon delivery for any technical claim or batch adjustment.',
  garantia_nota:
    'Conservación recomendada: almacenar entre 15 °C y 25 °C en ambiente seco y protegido de la luz solar directa para mantener intacta la actividad enzimática.',
  garantia_nota_en:
    'Recommended storage: keep between 15 °C and 25 °C in a dry place shielded from direct sunlight to preserve enzymatic activity intact.',

  garantias_kicker: 'Garantías del Canal Directo',
  garantias_kicker_en: 'Direct Channel Assurances',
  garantias_title: 'Por qué asociarte con La Obrera y el Zángano',
  garantias_title_en: 'Why Partner with La Obrera y el Zángano',
  show_garantias: true,
  garantia1_title: 'Pureza Certificada',
  garantia1_title_en: 'Certified Purity',
  garantia1_desc:
    'Cada lote cuenta con análisis de laboratorio acreditado: humedad controlada (<18%), HMF Codex y pureza botánica documentada en nuestra sección de ciencia.',
  garantia1_desc_en:
    'Every batch features accredited laboratory analysis: controlled moisture (<18%), Codex HMF levels, and botanical purity documented in our science section.',
  garantia2_title: 'Despacho Nacional',
  garantia2_title_en: 'Nationwide Shipping',
  garantia2_desc:
    'Envíos protegidos a todo Chile con courier prioritario y reposición asegurada en caso de quiebre o demora.',
  garantia2_desc_en:
    'Secure shipments across Chile via priority courier with guaranteed replacement in case of breakage or delay.',
  garantia3_title: 'Facturación Formal',
  garantia3_title_en: 'Commercial Invoicing',
  garantia3_desc:
    'Emisión inmediata de Factura Electrónica (afecta o exenta según el producto) con RUT de empresa y soporte tributario.',
  garantia3_desc_en:
    'Immediate electronic invoice issuance with company tax ID and corporate tax compliance support.',
  garantia4_title: 'Soporte de Marca',
  garantia4_title_en: 'Brand Support',
  garantia4_desc:
    'Material gráfico, fichas técnicas de origen y apoyo en el relato de producto para capacitar a tu equipo de atención.',
  garantia4_desc_en:
    'Marketing collateral, origin technical datasheets, and storytelling support to train your customer-facing staff.',

  form_kicker: 'Registro de Alianzas',
  form_kicker_en: 'Commercial Registration',
  form_title: 'Inicia una conversación comercial',
  form_title_en: 'Start a Commercial Conversation',
  form_subtitle:
    'Completa tus datos y nos pondremos en contacto en menos de 24 horas hábiles con la lista de precios mayoristas y condiciones de entrega.',
  form_subtitle_en:
    'Fill in your details and we will reach out within 24 business hours with our wholesale catalog and delivery terms.',

  seo_title: 'Alianzas & Negocios · La Obrera y el Zángano',
  seo_title_en: 'Commercial Partnerships · La Obrera y el Zángano',
  seo_description:
    'Soluciones mayoristas y programas de colaboración para cafeterías de especialidad, hoteles, tiendas gourmet, ferias y revendedores. Miel cruda de bosque nativo con trazabilidad certificada.',
  seo_description_en:
    'Wholesale solutions and collaborative programs for specialty coffee shops, luxury hotels, gourmet emporiums, fairs, and brand ambassadors. Raw native honey with certified batch traceability.',
};

export function parseB2BHubSettings(
  raw: Record<string, unknown> | null | undefined,
): B2BHubSettings {
  const d = DEFAULT_B2B_HUB_SETTINGS;
  if (!raw) return { ...d };
  const resolveB2BImage = (val: unknown, fallback: string) => {
    const s = asString(val, fallback).trim();
    if (!s || s.startsWith('/images/b2b/') || s.startsWith('/assets/editorial/b2b-')) {
      return fallback;
    }
    return s;
  };
  return {
    hero_kicker: asString(raw.hero_kicker, d.hero_kicker).trim(),
    hero_kicker_en: typeof raw.hero_kicker_en === 'string' ? raw.hero_kicker_en.trim() : d.hero_kicker_en,
    hero_title: asString(raw.hero_title, d.hero_title).trim(),
    hero_title_en: typeof raw.hero_title_en === 'string' ? raw.hero_title_en.trim() : d.hero_title_en,
    hero_subtitle: asString(raw.hero_subtitle, d.hero_subtitle).trim(),
    hero_subtitle_en: typeof raw.hero_subtitle_en === 'string' ? raw.hero_subtitle_en.trim() : d.hero_subtitle_en,
    hero_image: resolveB2BImage(raw.hero_image, d.hero_image),
    hero_image_opacity: asNumber(raw.hero_image_opacity, d.hero_image_opacity ?? 35, 0, 100),
    hero_badge: asString(raw.hero_badge, d.hero_badge ?? '').trim(),
    hero_badge_en: typeof raw.hero_badge_en === 'string' ? raw.hero_badge_en.trim() : d.hero_badge_en,
    cta_label: asString(raw.cta_label, d.cta_label).trim(),
    cta_label_en: typeof raw.cta_label_en === 'string' ? raw.cta_label_en.trim() : d.cta_label_en,
    cta_href: sanitizeStoreHref(raw.cta_href, d.cta_href) ?? d.cta_href,
    hero_secondary_cta_label: asString(raw.hero_secondary_cta_label, d.hero_secondary_cta_label).trim(),
    hero_secondary_cta_label_en: typeof raw.hero_secondary_cta_label_en === 'string' ? raw.hero_secondary_cta_label_en.trim() : d.hero_secondary_cta_label_en,
    hero_secondary_cta_href: sanitizeStoreHref(raw.hero_secondary_cta_href, d.hero_secondary_cta_href) ?? d.hero_secondary_cta_href,

    show_hero_pills: typeof raw.show_hero_pills === 'boolean' ? raw.show_hero_pills : d.show_hero_pills ?? true,
    pill1_title: asString(raw.pill1_title, d.pill1_title).trim(),
    pill1_title_en: typeof raw.pill1_title_en === 'string' ? raw.pill1_title_en.trim() : d.pill1_title_en,
    pill1_subtitle: asString(raw.pill1_subtitle, d.pill1_subtitle).trim(),
    pill1_subtitle_en: typeof raw.pill1_subtitle_en === 'string' ? raw.pill1_subtitle_en.trim() : d.pill1_subtitle_en,
    pill2_title: asString(raw.pill2_title, d.pill2_title).trim(),
    pill2_title_en: typeof raw.pill2_title_en === 'string' ? raw.pill2_title_en.trim() : d.pill2_title_en,
    pill2_subtitle: asString(raw.pill2_subtitle, d.pill2_subtitle).trim(),
    pill2_subtitle_en: typeof raw.pill2_subtitle_en === 'string' ? raw.pill2_subtitle_en.trim() : d.pill2_subtitle_en,
    pill3_title: asString(raw.pill3_title, d.pill3_title).trim(),
    pill3_title_en: typeof raw.pill3_title_en === 'string' ? raw.pill3_title_en.trim() : d.pill3_title_en,
    pill3_subtitle: asString(raw.pill3_subtitle, d.pill3_subtitle).trim(),
    pill3_subtitle_en: typeof raw.pill3_subtitle_en === 'string' ? raw.pill3_subtitle_en.trim() : d.pill3_subtitle_en,

    segmentos_kicker: asString(raw.segmentos_kicker, d.segmentos_kicker).trim(),
    segmentos_kicker_en: typeof raw.segmentos_kicker_en === 'string' ? raw.segmentos_kicker_en.trim() : d.segmentos_kicker_en,
    segmentos_title: asString(raw.segmentos_title, d.segmentos_title).trim(),
    segmentos_title_en: typeof raw.segmentos_title_en === 'string' ? raw.segmentos_title_en.trim() : d.segmentos_title_en,
    segmentos_subtitle: asString(raw.segmentos_subtitle, d.segmentos_subtitle).trim(),
    segmentos_subtitle_en: typeof raw.segmentos_subtitle_en === 'string' ? raw.segmentos_subtitle_en.trim() : d.segmentos_subtitle_en,
    segmentos_cta_label: asString(raw.segmentos_cta_label, d.segmentos_cta_label).trim(),
    segmentos_cta_label_en: typeof raw.segmentos_cta_label_en === 'string' ? raw.segmentos_cta_label_en.trim() : d.segmentos_cta_label_en,

    seg_cafeterias_title: asString(raw.seg_cafeterias_title, d.seg_cafeterias_title).trim(),
    seg_cafeterias_title_en: typeof raw.seg_cafeterias_title_en === 'string' ? raw.seg_cafeterias_title_en.trim() : d.seg_cafeterias_title_en,
    seg_cafeterias_badge: asString(raw.seg_cafeterias_badge, d.seg_cafeterias_badge).trim(),
    seg_cafeterias_badge_en: typeof raw.seg_cafeterias_badge_en === 'string' ? raw.seg_cafeterias_badge_en.trim() : d.seg_cafeterias_badge_en,
    seg_cafeterias_desc: asString(raw.seg_cafeterias_desc, d.seg_cafeterias_desc).trim(),
    seg_cafeterias_desc_en: typeof raw.seg_cafeterias_desc_en === 'string' ? raw.seg_cafeterias_desc_en.trim() : d.seg_cafeterias_desc_en,
    seg_cafeterias_h1: asString(raw.seg_cafeterias_h1, d.seg_cafeterias_h1).trim(),
    seg_cafeterias_h1_en: typeof raw.seg_cafeterias_h1_en === 'string' ? raw.seg_cafeterias_h1_en.trim() : d.seg_cafeterias_h1_en,
    seg_cafeterias_h2: asString(raw.seg_cafeterias_h2, d.seg_cafeterias_h2).trim(),
    seg_cafeterias_h2_en: typeof raw.seg_cafeterias_h2_en === 'string' ? raw.seg_cafeterias_h2_en.trim() : d.seg_cafeterias_h2_en,
    seg_cafeterias_h3: asString(raw.seg_cafeterias_h3, d.seg_cafeterias_h3)
      .trim()
      .replace(/fidelizacio$/i, 'fidelización'),
    seg_cafeterias_h3_en: typeof raw.seg_cafeterias_h3_en === 'string' ? raw.seg_cafeterias_h3_en.trim() : d.seg_cafeterias_h3_en,
    seg_cafeterias_image: resolveB2BImage(raw.seg_cafeterias_image, d.seg_cafeterias_image),

    seg_hoteles_title: asString(raw.seg_hoteles_title, d.seg_hoteles_title).trim(),
    seg_hoteles_title_en: typeof raw.seg_hoteles_title_en === 'string' ? raw.seg_hoteles_title_en.trim() : d.seg_hoteles_title_en,
    seg_hoteles_badge: asString(raw.seg_hoteles_badge, d.seg_hoteles_badge).trim(),
    seg_hoteles_badge_en: typeof raw.seg_hoteles_badge_en === 'string' ? raw.seg_hoteles_badge_en.trim() : d.seg_hoteles_badge_en,
    seg_hoteles_desc: asString(raw.seg_hoteles_desc, d.seg_hoteles_desc).trim(),
    seg_hoteles_desc_en: typeof raw.seg_hoteles_desc_en === 'string' ? raw.seg_hoteles_desc_en.trim() : d.seg_hoteles_desc_en,
    seg_hoteles_h1: asString(raw.seg_hoteles_h1, d.seg_hoteles_h1).trim(),
    seg_hoteles_h1_en: typeof raw.seg_hoteles_h1_en === 'string' ? raw.seg_hoteles_h1_en.trim() : d.seg_hoteles_h1_en,
    seg_hoteles_h2: asString(raw.seg_hoteles_h2, d.seg_hoteles_h2).trim(),
    seg_hoteles_h2_en: typeof raw.seg_hoteles_h2_en === 'string' ? raw.seg_hoteles_h2_en.trim() : d.seg_hoteles_h2_en,
    seg_hoteles_h3: asString(raw.seg_hoteles_h3, d.seg_hoteles_h3).trim(),
    seg_hoteles_h3_en: typeof raw.seg_hoteles_h3_en === 'string' ? raw.seg_hoteles_h3_en.trim() : d.seg_hoteles_h3_en,
    seg_hoteles_image: resolveB2BImage(raw.seg_hoteles_image, d.seg_hoteles_image),

    seg_gourmet_title: asString(raw.seg_gourmet_title, d.seg_gourmet_title).trim(),
    seg_gourmet_title_en: typeof raw.seg_gourmet_title_en === 'string' ? raw.seg_gourmet_title_en.trim() : d.seg_gourmet_title_en,
    seg_gourmet_badge: asString(raw.seg_gourmet_badge, d.seg_gourmet_badge).trim(),
    seg_gourmet_badge_en: typeof raw.seg_gourmet_badge_en === 'string' ? raw.seg_gourmet_badge_en.trim() : d.seg_gourmet_badge_en,
    seg_gourmet_desc: asString(raw.seg_gourmet_desc, d.seg_gourmet_desc).trim(),
    seg_gourmet_desc_en: typeof raw.seg_gourmet_desc_en === 'string' ? raw.seg_gourmet_desc_en.trim() : d.seg_gourmet_desc_en,
    seg_gourmet_h1: asString(raw.seg_gourmet_h1, d.seg_gourmet_h1).trim(),
    seg_gourmet_h1_en: typeof raw.seg_gourmet_h1_en === 'string' ? raw.seg_gourmet_h1_en.trim() : d.seg_gourmet_h1_en,
    seg_gourmet_h2: asString(raw.seg_gourmet_h2, d.seg_gourmet_h2).trim(),
    seg_gourmet_h2_en: typeof raw.seg_gourmet_h2_en === 'string' ? raw.seg_gourmet_h2_en.trim() : d.seg_gourmet_h2_en,
    seg_gourmet_h3: asString(raw.seg_gourmet_h3, d.seg_gourmet_h3).trim(),
    seg_gourmet_h3_en: typeof raw.seg_gourmet_h3_en === 'string' ? raw.seg_gourmet_h3_en.trim() : d.seg_gourmet_h3_en,
    seg_gourmet_image: resolveB2BImage(raw.seg_gourmet_image, d.seg_gourmet_image),

    seg_ferias_title: asString(raw.seg_ferias_title, d.seg_ferias_title).trim(),
    seg_ferias_title_en: typeof raw.seg_ferias_title_en === 'string' ? raw.seg_ferias_title_en.trim() : d.seg_ferias_title_en,
    seg_ferias_badge: asString(raw.seg_ferias_badge, d.seg_ferias_badge).trim(),
    seg_ferias_badge_en: typeof raw.seg_ferias_badge_en === 'string' ? raw.seg_ferias_badge_en.trim() : d.seg_ferias_badge_en,
    seg_ferias_desc: asString(raw.seg_ferias_desc, d.seg_ferias_desc).trim(),
    seg_ferias_desc_en: typeof raw.seg_ferias_desc_en === 'string' ? raw.seg_ferias_desc_en.trim() : d.seg_ferias_desc_en,
    seg_ferias_h1: asString(raw.seg_ferias_h1, d.seg_ferias_h1).trim(),
    seg_ferias_h1_en: typeof raw.seg_ferias_h1_en === 'string' ? raw.seg_ferias_h1_en.trim() : d.seg_ferias_h1_en,
    seg_ferias_h2: asString(raw.seg_ferias_h2, d.seg_ferias_h2).trim(),
    seg_ferias_h2_en: typeof raw.seg_ferias_h2_en === 'string' ? raw.seg_ferias_h2_en.trim() : d.seg_ferias_h2_en,
    seg_ferias_h3: asString(raw.seg_ferias_h3, d.seg_ferias_h3).trim(),
    seg_ferias_h3_en: typeof raw.seg_ferias_h3_en === 'string' ? raw.seg_ferias_h3_en.trim() : d.seg_ferias_h3_en,
    seg_ferias_image: resolveB2BImage(raw.seg_ferias_image, d.seg_ferias_image),

    seg_revendedores_title: asString(raw.seg_revendedores_title, d.seg_revendedores_title).trim(),
    seg_revendedores_title_en: typeof raw.seg_revendedores_title_en === 'string' ? raw.seg_revendedores_title_en.trim() : d.seg_revendedores_title_en,
    seg_revendedores_badge: asString(raw.seg_revendedores_badge, d.seg_revendedores_badge).trim(),
    seg_revendedores_badge_en: typeof raw.seg_revendedores_badge_en === 'string' ? raw.seg_revendedores_badge_en.trim() : d.seg_revendedores_badge_en,
    seg_revendedores_desc: asString(raw.seg_revendedores_desc, d.seg_revendedores_desc).trim(),
    seg_revendedores_desc_en: typeof raw.seg_revendedores_desc_en === 'string' ? raw.seg_revendedores_desc_en.trim() : d.seg_revendedores_desc_en,
    seg_revendedores_h1: asString(raw.seg_revendedores_h1, d.seg_revendedores_h1).trim(),
    seg_revendedores_h1_en: typeof raw.seg_revendedores_h1_en === 'string' ? raw.seg_revendedores_h1_en.trim() : d.seg_revendedores_h1_en,
    seg_revendedores_h2: asString(raw.seg_revendedores_h2, d.seg_revendedores_h2).trim(),
    seg_revendedores_h2_en: typeof raw.seg_revendedores_h2_en === 'string' ? raw.seg_revendedores_h2_en.trim() : d.seg_revendedores_h2_en,
    seg_revendedores_h3: asString(raw.seg_revendedores_h3, d.seg_revendedores_h3).trim(),
    seg_revendedores_h3_en: typeof raw.seg_revendedores_h3_en === 'string' ? raw.seg_revendedores_h3_en.trim() : d.seg_revendedores_h3_en,
    seg_revendedores_image: resolveB2BImage(raw.seg_revendedores_image, d.seg_revendedores_image),

    condiciones_kicker: asString(raw.condiciones_kicker, d.condiciones_kicker).trim(),
    condiciones_kicker_en: typeof raw.condiciones_kicker_en === 'string' ? raw.condiciones_kicker_en.trim() : d.condiciones_kicker_en,
    condiciones_title: asString(raw.condiciones_title, d.condiciones_title).trim(),
    condiciones_title_en: typeof raw.condiciones_title_en === 'string' ? raw.condiciones_title_en.trim() : d.condiciones_title_en,
    condiciones_subtitle: asString(raw.condiciones_subtitle, d.condiciones_subtitle).trim(),
    condiciones_subtitle_en: typeof raw.condiciones_subtitle_en === 'string' ? raw.condiciones_subtitle_en.trim() : d.condiciones_subtitle_en,

    moq_title: asString(raw.moq_title, d.moq_title).trim(),
    moq_title_en: typeof raw.moq_title_en === 'string' ? raw.moq_title_en.trim() : d.moq_title_en,
    moq_description: asString(raw.moq_description, d.moq_description).trim(),
    moq_description_en: typeof raw.moq_description_en === 'string' ? raw.moq_description_en.trim() : d.moq_description_en,
    moq_highlight: asString(raw.moq_highlight, d.moq_highlight).trim(),
    moq_highlight_en: typeof raw.moq_highlight_en === 'string' ? raw.moq_highlight_en.trim() : d.moq_highlight_en,

    despacho_title: asString(raw.despacho_title, d.despacho_title).trim(),
    despacho_title_en: typeof raw.despacho_title_en === 'string' ? raw.despacho_title_en.trim() : d.despacho_title_en,
    despacho_description: asString(raw.despacho_description, d.despacho_description).trim(),
    despacho_description_en: typeof raw.despacho_description_en === 'string' ? raw.despacho_description_en.trim() : d.despacho_description_en,
    despacho_nota: asString(raw.despacho_nota, d.despacho_nota).trim(),
    despacho_nota_en: typeof raw.despacho_nota_en === 'string' ? raw.despacho_nota_en.trim() : d.despacho_nota_en,

    descuentos_title: asString(raw.descuentos_title, d.descuentos_title).trim(),
    descuentos_title_en: typeof raw.descuentos_title_en === 'string' ? raw.descuentos_title_en.trim() : d.descuentos_title_en,
    descuentos_items: asString(raw.descuentos_items, d.descuentos_items).trim(),
    descuentos_items_en: typeof raw.descuentos_items_en === 'string' ? raw.descuentos_items_en.trim() : d.descuentos_items_en,

    garantia_title: asString(raw.garantia_title, d.garantia_title).trim(),
    garantia_title_en: typeof raw.garantia_title_en === 'string' ? raw.garantia_title_en.trim() : d.garantia_title_en,
    garantia_description: asString(raw.garantia_description, d.garantia_description).trim(),
    garantia_description_en: typeof raw.garantia_description_en === 'string' ? raw.garantia_description_en.trim() : d.garantia_description_en,
    garantia_nota: asString(raw.garantia_nota, d.garantia_nota).trim(),
    garantia_nota_en: typeof raw.garantia_nota_en === 'string' ? raw.garantia_nota_en.trim() : d.garantia_nota_en,

    garantias_kicker: asString(raw.garantias_kicker, d.garantias_kicker).trim(),
    garantias_kicker_en: typeof raw.garantias_kicker_en === 'string' ? raw.garantias_kicker_en.trim() : d.garantias_kicker_en,
    garantias_title: asString(raw.garantias_title, d.garantias_title).trim(),
    garantias_title_en: typeof raw.garantias_title_en === 'string' ? raw.garantias_title_en.trim() : d.garantias_title_en,
    show_garantias: typeof raw.show_garantias === 'boolean' ? raw.show_garantias : d.show_garantias ?? true,
    garantia1_title: asString(raw.garantia1_title, d.garantia1_title).trim(),
    garantia1_title_en: typeof raw.garantia1_title_en === 'string' ? raw.garantia1_title_en.trim() : d.garantia1_title_en,
    garantia1_desc: asString(raw.garantia1_desc, d.garantia1_desc).trim(),
    garantia1_desc_en: typeof raw.garantia1_desc_en === 'string' ? raw.garantia1_desc_en.trim() : d.garantia1_desc_en,
    garantia2_title: asString(raw.garantia2_title, d.garantia2_title).trim(),
    garantia2_title_en: typeof raw.garantia2_title_en === 'string' ? raw.garantia2_title_en.trim() : d.garantia2_title_en,
    garantia2_desc: asString(raw.garantia2_desc, d.garantia2_desc).trim(),
    garantia2_desc_en: typeof raw.garantia2_desc_en === 'string' ? raw.garantia2_desc_en.trim() : d.garantia2_desc_en,
    garantia3_title: asString(raw.garantia3_title, d.garantia3_title).trim(),
    garantia3_title_en: typeof raw.garantia3_title_en === 'string' ? raw.garantia3_title_en.trim() : d.garantia3_title_en,
    garantia3_desc: asString(raw.garantia3_desc, d.garantia3_desc).trim(),
    garantia3_desc_en: typeof raw.garantia3_desc_en === 'string' ? raw.garantia3_desc_en.trim() : d.garantia3_desc_en,
    garantia4_title: asString(raw.garantia4_title, d.garantia4_title).trim(),
    garantia4_title_en: typeof raw.garantia4_title_en === 'string' ? raw.garantia4_title_en.trim() : d.garantia4_title_en,
    garantia4_desc: asString(raw.garantia4_desc, d.garantia4_desc).trim(),
    garantia4_desc_en: typeof raw.garantia4_desc_en === 'string' ? raw.garantia4_desc_en.trim() : d.garantia4_desc_en,

    form_kicker: asString(raw.form_kicker, d.form_kicker).trim(),
    form_kicker_en: typeof raw.form_kicker_en === 'string' ? raw.form_kicker_en.trim() : d.form_kicker_en,
    form_title: asString(raw.form_title, d.form_title).trim(),
    form_title_en: typeof raw.form_title_en === 'string' ? raw.form_title_en.trim() : d.form_title_en,
    form_subtitle: asString(raw.form_subtitle, d.form_subtitle).trim(),
    form_subtitle_en: typeof raw.form_subtitle_en === 'string' ? raw.form_subtitle_en.trim() : d.form_subtitle_en,

    seo_title: typeof raw.seo_title === 'string' ? raw.seo_title.trim() : d.seo_title,
    seo_title_en: typeof raw.seo_title_en === 'string' ? raw.seo_title_en.trim() : d.seo_title_en,
    seo_description: typeof raw.seo_description === 'string' ? raw.seo_description.trim() : d.seo_description,
    seo_description_en: typeof raw.seo_description_en === 'string' ? raw.seo_description_en.trim() : d.seo_description_en,

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

// ── Perfil Dashboard CMS ───────────────────────────────────────────────────

export type PerfilInicioSettings = {
  hero_title: string;
  hero_title_en?: string;
  hero_subtitle: string;
  hero_subtitle_en?: string;
  hero_tagline: string;
  hero_tagline_en?: string;
  member_label: string;
  member_label_en?: string;
  tier_label: string;
  tier_label_en?: string;
  stat_pedidos_label: string;
  stat_pedidos_label_en?: string;
  stat_pedidos_empty: string;
  stat_pedidos_empty_en?: string;
  stat_legado_label: string;
  stat_legado_label_en?: string;
  stat_legado_empty: string;
  stat_legado_empty_en?: string;
  stat_m2_label: string;
  stat_m2_label_en?: string;
  stat_m2_empty: string;
  stat_m2_empty_en?: string;
  onboarding_step_1: string;
  onboarding_step_1_en?: string;
  onboarding_step_2: string;
  onboarding_step_2_en?: string;
  onboarding_step_3: string;
  onboarding_step_3_en?: string;
  onboarding_step_4: string;
  onboarding_step_4_en?: string;
  onboarding_step_5: string;
  onboarding_step_5_en?: string;
  onboarding_cta_label: string;
  onboarding_cta_label_en?: string;
  onboarding_cta_href: string;
  onboarding_secondary_label: string;
  onboarding_secondary_label_en?: string;
  onboarding_secondary_href: string;
  power_grid_kicker: string;
  power_grid_kicker_en?: string;
  power_grid_title: string;
  power_grid_title_en?: string;
  power_grid_subtitle: string;
  power_grid_subtitle_en?: string;
  power_1_title: string;
  power_1_title_en?: string;
  power_1_desc: string;
  power_1_desc_en?: string;
  power_1_badge: string;
  power_1_badge_en?: string;
  power_2_title: string;
  power_2_title_en?: string;
  power_2_desc: string;
  power_2_desc_en?: string;
  power_2_badge: string;
  power_2_badge_en?: string;
  power_3_title: string;
  power_3_title_en?: string;
  power_3_desc: string;
  power_3_desc_en?: string;
  power_3_badge: string;
  power_3_badge_en?: string;
  power_4_title: string;
  power_4_title_en?: string;
  power_4_desc: string;
  power_4_desc_en?: string;
  power_4_badge: string;
  power_4_badge_en?: string;
  power_5_title: string;
  power_5_title_en?: string;
  power_5_desc: string;
  power_5_desc_en?: string;
  power_5_badge: string;
  power_5_badge_en?: string;
  power_6_title: string;
  power_6_title_en?: string;
  power_6_desc: string;
  power_6_desc_en?: string;
  power_6_badge: string;
  power_6_badge_en?: string;
};

export const DEFAULT_PERFIL_INICIO_SETTINGS: PerfilInicioSettings = {
  hero_title: 'El Legado',
  hero_title_en: 'The Legacy',
  hero_subtitle: '',
  hero_subtitle_en: '',
  hero_tagline: 'El bosque nativo de Chiloé en tu despensa',
  hero_tagline_en: 'The native forest of Chiloé in your pantry',
  member_label: 'Miembro Activo',
  member_label_en: 'Active Member',
  tier_label: 'Rango de fidelidad',
  tier_label_en: 'Loyalty Tier',
  stat_pedidos_label: 'Pedidos',
  stat_pedidos_label_en: 'Orders',
  stat_pedidos_empty: 'Aún sin pedidos · Tu primer ciclo abre el legado',
  stat_pedidos_empty_en: 'No orders yet · Your first cycle opens the legacy',
  stat_legado_label: 'Legado Acumulado',
  stat_legado_label_en: 'Accumulated Legacy',
  stat_legado_empty: 'Aún sin aportes · Financia bosque nativo en Pureo',
  stat_legado_empty_en: 'No contributions yet · Funds native forest in Pureo',
  stat_m2_label: 'Superficie Protegida',
  stat_m2_label_en: 'Protected Area',
  stat_m2_empty: 'Aún en reposo · Se activa con tu primer frasco',
  stat_m2_empty_en: 'At rest · Activates with your first jar',
  onboarding_step_1: 'Cuenta creada (+100 pts de bienvenida)',
  onboarding_step_1_en: 'Account created (+100 welcome pts)',
  onboarding_step_2: 'Dirección de despacho registrada',
  onboarding_step_2_en: 'Shipping address registered',
  onboarding_step_3: 'Pase digital en billetera descubierto',
  onboarding_step_3_en: 'Digital wallet pass unlocked',
  onboarding_step_4: 'Primer ciclo o recolección de temporada',
  onboarding_step_4_en: 'First cycle or seasonal collection',
  onboarding_step_5: 'Suscripción o reserva de floración activa',
  onboarding_step_5_en: 'Active subscription or bloom reservation',
  onboarding_cta_label: 'Iniciar Mi Primer Ciclo',
  onboarding_cta_label_en: 'Start My First Cycle',
  onboarding_cta_href: '/catalogo',
  onboarding_secondary_label: 'Metodología del bosque',
  onboarding_secondary_label_en: 'Forest methodology',
  onboarding_secondary_href: '/ciencia',
  power_grid_kicker: 'Trayectoria en el Ecosistema',
  power_grid_kicker_en: 'Ecosystem Trajectory',
  power_grid_title: 'Tu Vínculo con el Bosque',
  power_grid_title_en: 'Your Bond with the Forest',
  power_grid_subtitle: 'Como miembro de El Legado, dispones de herramientas para gestionar tu despensa de miel nativa de autor, sellos de recolección y trazabilidad directa de colmenas.',
  power_grid_subtitle_en: 'As a member of The Legacy, you have tools to manage your signature native honey pantry, collection stamps, and direct hive traceability.',
  power_1_title: 'Pase Digital & Billetera',
  power_1_title_en: 'Digital Pass & Wallet',
  power_1_desc: 'Lleva tu Pase del Bosque en el teléfono. Suma sellos en compras reales de sachet y frascos para canjes físicos en feria con tu QR.',
  power_1_desc_en: 'Carry your Forest Pass on your phone. Collect stamps on real sachet and jar purchases for in-person redemptions with your QR.',
  power_1_badge: 'Sellos & Tarjeta',
  power_1_badge_en: 'Stamps & Card',
  power_2_title: 'Catálogo de Canje',
  power_2_title_en: 'Redemption Catalog',
  power_2_desc: 'Tus puntos acumulados por compras y bienvenida se canjean por frascos exclusivos de autor, mieles de guarda y catas guiadas.',
  power_2_desc_en: 'Your welcome and purchase points can be redeemed for exclusive signature jars, aged honeys, and guided tastings.',
  power_2_badge: 'Canjes',
  power_2_badge_en: 'Redemptions',
  power_3_title: 'Suscripciones & Reservas',
  power_3_title_en: 'Subscriptions & Reservations',
  power_3_desc: 'Reposición programada en tu hogar o reserva anticipada de floraciones de temporada (Ulmo, Tiaca, Quillay) sin intermediarios.',
  power_3_desc_en: 'Scheduled home replenishment or early reservation of seasonal blooms (Ulmo, Tiaca, Quillay) with zero intermediaries.',
  power_3_badge: 'Despensa Protegida',
  power_3_badge_en: 'Protected Pantry',
  power_4_title: 'Origen & Trazabilidad',
  power_4_title_en: 'Origin & Traceability',
  power_4_desc: 'Escanea cualquier frasco con tu cámara para ver su colmena viva, predio en Chiloé, fecha de recolección y pureza polínica.',
  power_4_desc_en: 'Scan any jar with your camera to inspect its living hive, estate in Chiloé, collection date, and botanical purity.',
  power_4_badge: 'Origen Verificado',
  power_4_badge_en: 'Verified Origin',
  power_5_title: 'Monitoreo de Floración',
  power_5_title_en: 'Bloom Monitoring',
  power_5_desc: 'Avisos tempranos en tu campanita cuando el bosque nativo comienza a florecer en Chiloé y se abren cupos limitados de recolección.',
  power_5_desc_en: 'Early alerts in your notification bell when the native forest begins to bloom in Chiloé and limited collection slots open.',
  power_5_badge: 'Sensores del Bosque',
  power_5_badge_en: 'Forest Sensors',
  power_6_title: 'Club Legado del Bosque',
  power_6_title_en: 'Forest Legacy Club',
  power_6_desc: 'Como usuario registrado, eres parte del patrimonio forestal. Cada frasco financia árboles nativos protegidos en Chiloé.',
  power_6_desc_en: 'As a registered member, you are part of the forest heritage. Every jar funds protected native trees in Chiloé.',
  power_6_badge: 'Membresía Activa',
  power_6_badge_en: 'Active Membership',
};

export const PERFIL_INICIO_SETTINGS_TEMPLATE: PerfilInicioSettings = {
  ...DEFAULT_PERFIL_INICIO_SETTINGS,
};

export function parsePerfilInicioSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilInicioSettings {
  const d = DEFAULT_PERFIL_INICIO_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    hero_title: es('hero_title', d.hero_title),
    hero_title_en: en('hero_title_en', d.hero_title_en),
    hero_subtitle: es('hero_subtitle', d.hero_subtitle),
    hero_subtitle_en: en('hero_subtitle_en', d.hero_subtitle_en),
    hero_tagline: es('hero_tagline', d.hero_tagline),
    hero_tagline_en: en('hero_tagline_en', d.hero_tagline_en),
    member_label: es('member_label', d.member_label),
    member_label_en: en('member_label_en', d.member_label_en),
    tier_label: es('tier_label', d.tier_label),
    tier_label_en: en('tier_label_en', d.tier_label_en),
    stat_pedidos_label: es('stat_pedidos_label', d.stat_pedidos_label),
    stat_pedidos_label_en: en('stat_pedidos_label_en', d.stat_pedidos_label_en),
    stat_pedidos_empty: es('stat_pedidos_empty', d.stat_pedidos_empty),
    stat_pedidos_empty_en: en('stat_pedidos_empty_en', d.stat_pedidos_empty_en),
    stat_legado_label: es('stat_legado_label', d.stat_legado_label),
    stat_legado_label_en: en('stat_legado_label_en', d.stat_legado_label_en),
    stat_legado_empty: es('stat_legado_empty', d.stat_legado_empty),
    stat_legado_empty_en: en('stat_legado_empty_en', d.stat_legado_empty_en),
    stat_m2_label: es('stat_m2_label', d.stat_m2_label),
    stat_m2_label_en: en('stat_m2_label_en', d.stat_m2_label_en),
    stat_m2_empty: es('stat_m2_empty', d.stat_m2_empty),
    stat_m2_empty_en: en('stat_m2_empty_en', d.stat_m2_empty_en),
    onboarding_step_1: es('onboarding_step_1', d.onboarding_step_1),
    onboarding_step_1_en: en('onboarding_step_1_en', d.onboarding_step_1_en),
    onboarding_step_2: es('onboarding_step_2', d.onboarding_step_2),
    onboarding_step_2_en: en('onboarding_step_2_en', d.onboarding_step_2_en),
    onboarding_step_3: es('onboarding_step_3', d.onboarding_step_3),
    onboarding_step_3_en: en('onboarding_step_3_en', d.onboarding_step_3_en),
    onboarding_step_4: es('onboarding_step_4', d.onboarding_step_4),
    onboarding_step_4_en: en('onboarding_step_4_en', d.onboarding_step_4_en),
    onboarding_step_5: es('onboarding_step_5', d.onboarding_step_5),
    onboarding_step_5_en: en('onboarding_step_5_en', d.onboarding_step_5_en),
    onboarding_cta_label: es('onboarding_cta_label', d.onboarding_cta_label),
    onboarding_cta_label_en: en('onboarding_cta_label_en', d.onboarding_cta_label_en),
    onboarding_cta_href: es('onboarding_cta_href', d.onboarding_cta_href),
    onboarding_secondary_label: es('onboarding_secondary_label', d.onboarding_secondary_label),
    onboarding_secondary_label_en: en('onboarding_secondary_label_en', d.onboarding_secondary_label_en),
    onboarding_secondary_href: es('onboarding_secondary_href', d.onboarding_secondary_href),
    power_grid_kicker: es('power_grid_kicker', d.power_grid_kicker),
    power_grid_kicker_en: en('power_grid_kicker_en', d.power_grid_kicker_en),
    power_grid_title: es('power_grid_title', d.power_grid_title),
    power_grid_title_en: en('power_grid_title_en', d.power_grid_title_en),
    power_grid_subtitle: es('power_grid_subtitle', d.power_grid_subtitle),
    power_grid_subtitle_en: en('power_grid_subtitle_en', d.power_grid_subtitle_en),
    power_1_title: es('power_1_title', d.power_1_title),
    power_1_title_en: en('power_1_title_en', d.power_1_title_en),
    power_1_desc: es('power_1_desc', d.power_1_desc),
    power_1_desc_en: en('power_1_desc_en', d.power_1_desc_en),
    power_1_badge: es('power_1_badge', d.power_1_badge),
    power_1_badge_en: en('power_1_badge_en', d.power_1_badge_en),
    power_2_title: es('power_2_title', d.power_2_title),
    power_2_title_en: en('power_2_title_en', d.power_2_title_en),
    power_2_desc: es('power_2_desc', d.power_2_desc),
    power_2_desc_en: en('power_2_desc_en', d.power_2_desc_en),
    power_2_badge: es('power_2_badge', d.power_2_badge),
    power_2_badge_en: en('power_2_badge_en', d.power_2_badge_en),
    power_3_title: es('power_3_title', d.power_3_title),
    power_3_title_en: en('power_3_title_en', d.power_3_title_en),
    power_3_desc: es('power_3_desc', d.power_3_desc),
    power_3_desc_en: en('power_3_desc_en', d.power_3_desc_en),
    power_3_badge: es('power_3_badge', d.power_3_badge),
    power_3_badge_en: en('power_3_badge_en', d.power_3_badge_en),
    power_4_title: es('power_4_title', d.power_4_title),
    power_4_title_en: en('power_4_title_en', d.power_4_title_en),
    power_4_desc: es('power_4_desc', d.power_4_desc),
    power_4_desc_en: en('power_4_desc_en', d.power_4_desc_en),
    power_4_badge: es('power_4_badge', d.power_4_badge),
    power_4_badge_en: en('power_4_badge_en', d.power_4_badge_en),
    power_5_title: es('power_5_title', d.power_5_title),
    power_5_title_en: en('power_5_title_en', d.power_5_title_en),
    power_5_desc: es('power_5_desc', d.power_5_desc),
    power_5_desc_en: en('power_5_desc_en', d.power_5_desc_en),
    power_5_badge: es('power_5_badge', d.power_5_badge),
    power_5_badge_en: en('power_5_badge_en', d.power_5_badge_en),
    power_6_title: es('power_6_title', d.power_6_title),
    power_6_title_en: en('power_6_title_en', d.power_6_title_en),
    power_6_desc: es('power_6_desc', d.power_6_desc),
    power_6_desc_en: en('power_6_desc_en', d.power_6_desc_en),
    power_6_badge: es('power_6_badge', d.power_6_badge),
    power_6_badge_en: en('power_6_badge_en', d.power_6_badge_en),
  };
}

export type PerfilTrazabilidadSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_TRAZABILIDAD_SETTINGS: PerfilTrazabilidadSettings = {
  title: 'Origen y Trazabilidad',
  title_en: 'Origin & Traceability',
  subtitle: '',
  subtitle_en: '',
  empty_title: 'Aún sin trazabilidad activa',
  empty_title_en: 'No active traceability yet',
  empty_desc: '',
  empty_desc_en: '',
};

export const PERFIL_TRAZABILIDAD_SETTINGS_TEMPLATE: PerfilTrazabilidadSettings = {
  ...DEFAULT_PERFIL_TRAZABILIDAD_SETTINGS,
};

export function parsePerfilTrazabilidadSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilTrazabilidadSettings {
  const d = DEFAULT_PERFIL_TRAZABILIDAD_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}

export type PerfilPedidosSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_PEDIDOS_SETTINGS: PerfilPedidosSettings = {
  title: 'Pedidos',
  title_en: 'Orders',
  subtitle: '',
  subtitle_en: '',
  empty_title: 'Aún sin pedidos registrados',
  empty_title_en: 'No orders recorded yet',
  empty_desc: 'Tu primer ciclo de miel cruda o adopción de colmena se reflejará aquí.',
  empty_desc_en: 'Your first raw honey cycle or hive bond will appear here.',
};

export const PERFIL_PEDIDOS_SETTINGS_TEMPLATE: PerfilPedidosSettings = {
  ...DEFAULT_PERFIL_PEDIDOS_SETTINGS,
};

export function parsePerfilPedidosSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilPedidosSettings {
  const d = DEFAULT_PERFIL_PEDIDOS_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}

export type PerfilSuscripcionesSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_SUSCRIPCIONES_SETTINGS: PerfilSuscripcionesSettings = {
  title: 'Suscripciones y Reservas',
  title_en: 'Subscriptions & Reservations',
  subtitle: '',
  subtitle_en: '',
  empty_title: 'Sin suscripciones activas',
  empty_title_en: 'No active subscriptions',
  empty_desc: '',
  empty_desc_en: '',
};

export const PERFIL_SUSCRIPCIONES_SETTINGS_TEMPLATE: PerfilSuscripcionesSettings = {
  ...DEFAULT_PERFIL_SUSCRIPCIONES_SETTINGS,
};

export function parsePerfilSuscripcionesSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilSuscripcionesSettings {
  const d = DEFAULT_PERFIL_SUSCRIPCIONES_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}

export type PerfilResenasSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_RESENAS_SETTINGS: PerfilResenasSettings = {
  title: 'Mis Reseñas',
  title_en: 'My Reviews',
  subtitle: '',
  subtitle_en: '',
  empty_title: 'Aún sin reseñas',
  empty_title_en: 'No reviews yet',
  empty_desc: '',
  empty_desc_en: '',
};

export const PERFIL_RESENAS_SETTINGS_TEMPLATE: PerfilResenasSettings = {
  ...DEFAULT_PERFIL_RESENAS_SETTINGS,
};

export function parsePerfilResenasSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilResenasSettings {
  const d = DEFAULT_PERFIL_RESENAS_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}

export type PerfilRetornoSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_RETORNO_SETTINGS: PerfilRetornoSettings = {
  title: 'Retorno de Frascos',
  title_en: 'Jar Return Program',
  subtitle: '',
  subtitle_en: '',
  empty_title: 'Sin frascos para retornar',
  empty_title_en: 'No jars to return',
  empty_desc: '',
  empty_desc_en: '',
};

export const PERFIL_RETORNO_SETTINGS_TEMPLATE: PerfilRetornoSettings = {
  ...DEFAULT_PERFIL_RETORNO_SETTINGS,
};

export function parsePerfilRetornoSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilRetornoSettings {
  const d = DEFAULT_PERFIL_RETORNO_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}

export type PerfilBilleteraSettings = {
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  tarjeta_kicker: string;
  tarjeta_kicker_en?: string;
  tarjeta_title: string;
  tarjeta_title_en?: string;
  tarjeta_desc: string;
  tarjeta_desc_en?: string;
  empty_title: string;
  empty_title_en?: string;
  empty_desc: string;
  empty_desc_en?: string;
};

export const DEFAULT_PERFIL_BILLETERA_SETTINGS: PerfilBilleteraSettings = {
  title: 'Billetera & Beneficios',
  title_en: 'Wallet & Benefits',
  subtitle: '',
  subtitle_en: '',
  tarjeta_kicker: 'Pase del Bosque',
  tarjeta_kicker_en: 'Forest Pass',
  tarjeta_title: 'Sellos de producto y pase digital',
  tarjeta_title_en: 'Product stamps and digital pass',
  tarjeta_desc: 'Escanea tu credencial en ferias locales, gestiona sellos de fidelización por variedad y descarga tu pase oficial a Apple Wallet o Google Wallet.',
  tarjeta_desc_en: 'Scan your pass at local fairs, manage variety loyalty stamps, and download your official pass to Apple Wallet or Google Wallet.',
  empty_title: 'Billetera vacía',
  empty_title_en: 'Empty wallet',
  empty_desc: '',
  empty_desc_en: '',
};

export const PERFIL_BILLETERA_SETTINGS_TEMPLATE: PerfilBilleteraSettings = {
  ...DEFAULT_PERFIL_BILLETERA_SETTINGS,
};

export function parsePerfilBilleteraSettings(
  raw: Record<string, unknown> | null | undefined,
): PerfilBilleteraSettings {
  const d = DEFAULT_PERFIL_BILLETERA_SETTINGS;
  if (!raw) return { ...d };
  const es = (key: string, fallback: string) => {
    const v = raw[key];
    return typeof v === 'string' ? v.trim() : fallback;
  };
  const en = (key: string, fallback?: string) =>
    typeof raw[key] === 'string' ? (raw[key] as string).trim() : fallback;

  return {
    title: es('title', d.title),
    title_en: en('title_en', d.title_en),
    subtitle: es('subtitle', d.subtitle),
    subtitle_en: en('subtitle_en', d.subtitle_en),
    tarjeta_kicker: es('tarjeta_kicker', d.tarjeta_kicker),
    tarjeta_kicker_en: en('tarjeta_kicker_en', d.tarjeta_kicker_en),
    tarjeta_title: es('tarjeta_title', d.tarjeta_title),
    tarjeta_title_en: en('tarjeta_title_en', d.tarjeta_title_en),
    tarjeta_desc: es('tarjeta_desc', d.tarjeta_desc),
    tarjeta_desc_en: en('tarjeta_desc_en', d.tarjeta_desc_en),
    empty_title: es('empty_title', d.empty_title),
    empty_title_en: en('empty_title_en', d.empty_title_en),
    empty_desc: es('empty_desc', d.empty_desc),
    empty_desc_en: en('empty_desc_en', d.empty_desc_en),
  };
}
