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
};

/** Defaults = oro-miel de tokens.css (--enj-oro-miel-h/s/l). */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  default_theme: 'system',
  grain_intensity: 0.35,
  border_radius: 'md',
  force_dark_public: false,
  accent_h: 44,
  accent_s: 85,
  accent_l: 46,
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
    logo_height_px: asNumber(raw.logo_height_px, d.logo_height_px, 16, 120),
    logo_max_width_px: asNumber(raw.logo_max_width_px, d.logo_max_width_px, 0, 480),
    logo_footer_height_px: asNumber(raw.logo_footer_height_px, d.logo_footer_height_px, 16, 160),
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
  es: string,
  en: string | undefined,
  locale: string,
): string {
  if (locale === 'en' && en?.trim()) return en.trim();
  return es;
}

export function themeToCssVars(theme: ThemeSettings): Record<string, string> {
  // Grano: 0-1 → 0-6% opacidad. El ruido visible se satura muy rápido: el
  // default histórico de GrainOverlay era 0.02 y grain_intensity default es
  // 0.35, así que la escala mapea 0.35 → ~0.021 (look actual).
  const grainOpacity = String(Math.min(0.06, Number(theme.grain_intensity) * 0.06));
  // Radio: presets alineados con las cards de la tienda (rounded-lg = 0.5rem).
  const radiusMap = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem' };
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
  { id: 'products', enabled: true, order: 1 },
  { id: 'media', enabled: true, order: 2 },
  { id: 'video', enabled: true, order: 3 },
  { id: 'collections', enabled: true, order: 4 },
  { id: 'conservation', enabled: true, order: 5 },
  { id: 'map', enabled: true, order: 6 },
];

export const DEFAULT_LANDING_LAYOUT: LandingLayoutSettings = {
  sections: DEFAULT_LANDING_SECTIONS,
  show_grain: false,
  show_custom_cursor: false,
  show_bee_canvas: false,
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
  conservation: 'Impacto',
  collections: 'Grid colecciones',
  media: 'Media',
  products: 'Creaciones',
  video: 'Video',
  map: 'Mapa',
};

/** Fila de “Orden del home” → herramienta que edita las fichas (no otra entrada gemela). */
export const LANDING_SECTION_EDITOR_KEY: Partial<Record<LandingSectionId, string>> = {
  conservation: 'conservation_content',
  collections: 'colecciones',
  media: 'media_items',
  products: 'products_settings',
  video: 'video_settings',
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
    'Árboles registrados con coordenadas y especie en sectores de Pureo. Colmenas monitoreadas en apiarios entre Quemchi, Molulco y Pureo-Quelen.',
  tri2_desc_en:
    'Trees registered with coordinates and species in sectors of Pureo. Hives monitored in apiaries between Quemchi, Molulco and Pureo-Quelen.',
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

const MEDIA_TYPES = ['image', 'video'] as const;

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
};
