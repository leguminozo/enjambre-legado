/**
 * Contrato del menú / header de tienda (CMS: menu_settings + menu_links).
 * Editable en Núcleo → Editor de Tienda. Fallback editorial OYZ.
 */

export type HeaderLayout = 'classic' | 'centered' | 'split';
export type MobileMenuStyle = 'fullscreen' | 'drawer-left' | 'drawer-right';
export type NavTextTransform = 'uppercase' | 'none' | 'capitalize';
export type NavFont = 'sans' | 'display';

export type HeaderNavItem = {
  label: string;
  label_en?: string;
  href: string;
  show_desktop?: boolean;
  show_mobile?: boolean;
};

export type HeaderMenuSettings = {
  layout: HeaderLayout;
  mobile_menu: MobileMenuStyle;
  /** Burger también en desktop (equivale a menu_format: "burger" del seed Antigravity) */
  force_burger_desktop: boolean;
  height_mobile_px: number;
  height_desktop_px: number;
  nav_letter_spacing_em: number;
  nav_item_gap_px: number;
  nav_font_size_px: number;
  nav_text_transform: NavTextTransform;
  nav_font: NavFont;
  mobile_item_gap_px: number;
  mobile_font_size_px: number;
  mobile_font: NavFont;
  mobile_letter_spacing_em: number;
  brand_line1: string;
  brand_line2: string;
  brand_letter_spacing_em: number;
  show_brand_text: boolean;
  show_cart: boolean;
  show_account: boolean;
  show_lang_selector: boolean;
  show_notifications: boolean;
  sticky: boolean;
  backdrop_blur: boolean;
  logo_src: string;
  show_logo: boolean;
  logo_height_px: number;
};

export type HeaderMenuConfig = {
  settings: HeaderMenuSettings;
  items: HeaderNavItem[];
};

export const DEFAULT_HEADER_SETTINGS: HeaderMenuSettings = {
  layout: 'classic',
  mobile_menu: 'fullscreen',
  force_burger_desktop: false,
  height_mobile_px: 64,
  height_desktop_px: 80,
  nav_letter_spacing_em: 0.2,
  nav_item_gap_px: 40,
  nav_font_size_px: 10.4,
  nav_text_transform: 'uppercase',
  nav_font: 'sans',
  mobile_item_gap_px: 28,
  mobile_font_size_px: 30,
  mobile_font: 'display',
  mobile_letter_spacing_em: 0,
  brand_line1: 'La Obrera',
  brand_line2: 'y el Zángano',
  brand_letter_spacing_em: 0.3,
  show_brand_text: true,
  show_cart: true,
  show_account: true,
  show_lang_selector: true,
  show_notifications: true,
  sticky: true,
  backdrop_blur: true,
  logo_src: '',
  show_logo: false,
  logo_height_px: 32,
};

export const DEFAULT_HEADER_NAV: HeaderNavItem[] = [
  { label: 'Inicio', label_en: 'Home', href: '/', show_desktop: true, show_mobile: true },
  { label: 'Creaciones', label_en: 'Creations', href: '/catalogo', show_desktop: true, show_mobile: true },
  { label: 'Experiencias', label_en: 'Experiences', href: '/experiencias', show_desktop: true, show_mobile: true },
  { label: 'Galería', label_en: 'Gallery', href: '/galeria', show_desktop: true, show_mobile: true },
  { label: 'Ciencia', label_en: 'Science', href: '/ciencia', show_desktop: true, show_mobile: true },
  { label: 'Nosotros', label_en: 'About', href: '/nosotros', show_desktop: true, show_mobile: true },
  { label: 'Escáner QR', label_en: 'QR Scan', href: '/qr-scan', show_desktop: true, show_mobile: true },
  { label: 'Contacto', label_en: 'Contact', href: '/contacto', show_desktop: true, show_mobile: true },
];

function asNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  let out = n;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/** Parse "0.2em" | "2.5rem" | number → number in target unit. */
function parseCssMeasure(value: unknown, unit: 'em' | 'px' | 'rem', fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  const m = value.trim().match(/^([\d.]+)\s*(em|px|rem)?$/i);
  if (!m) return fallback;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return fallback;
  const u = (m[2] ?? unit).toLowerCase();
  if (unit === 'em') {
    if (u === 'em') return n;
    if (u === 'px') return n / 16;
    if (u === 'rem') return n;
  }
  if (unit === 'px') {
    if (u === 'px') return n;
    if (u === 'rem' || u === 'em') return n * 16;
  }
  return n;
}

const LAYOUTS: HeaderLayout[] = ['classic', 'centered', 'split'];
const MOBILE_MENUS: MobileMenuStyle[] = ['fullscreen', 'drawer-left', 'drawer-right'];
const TRANSFORMS: NavTextTransform[] = ['uppercase', 'none', 'capitalize'];
const FONTS: NavFont[] = ['sans', 'display'];

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function mapLegacyLayout(raw: Record<string, unknown>): HeaderLayout | null {
  const fmt = raw.menu_format;
  if (fmt === 'horizontal' || fmt === 'classic' || fmt === 'burger') return 'classic';
  if (fmt === 'centered' || fmt === 'center') return 'centered';
  if (fmt === 'split') return 'split';
  return null;
}

export function parseHeaderSettings(raw: Record<string, unknown> | null | undefined): HeaderMenuSettings {
  const d = DEFAULT_HEADER_SETTINGS;
  if (!raw || typeof raw !== 'object') return { ...d };

  const legacyLayout = mapLegacyLayout(raw);
  const forceBurger =
    typeof raw.force_burger_desktop === 'boolean'
      ? raw.force_burger_desktop
      : raw.menu_format === 'burger';
  const heightMobile = raw.height_mobile_px ?? raw.height_mobile;
  const heightDesktop = raw.height_desktop_px ?? raw.height_desktop;
  const tracking =
    raw.nav_letter_spacing_em ??
    parseCssMeasure(raw.letter_spacing, 'em', d.nav_letter_spacing_em);
  const gap =
    raw.nav_item_gap_px ?? parseCssMeasure(raw.button_gap, 'px', d.nav_item_gap_px);

  return {
    layout: pickEnum(raw.layout, LAYOUTS, legacyLayout ?? d.layout),
    mobile_menu: pickEnum(raw.mobile_menu, MOBILE_MENUS, d.mobile_menu),
    force_burger_desktop: forceBurger,
    height_mobile_px: asNumber(heightMobile, d.height_mobile_px, 48, 120),
    height_desktop_px: asNumber(heightDesktop, d.height_desktop_px, 48, 140),
    nav_letter_spacing_em: asNumber(tracking, d.nav_letter_spacing_em, 0, 1),
    nav_item_gap_px: asNumber(gap, d.nav_item_gap_px, 4, 80),
    nav_font_size_px: asNumber(raw.nav_font_size_px, d.nav_font_size_px, 8, 20),
    nav_text_transform: pickEnum(raw.nav_text_transform, TRANSFORMS, d.nav_text_transform),
    nav_font: pickEnum(raw.nav_font, FONTS, d.nav_font),
    mobile_item_gap_px: asNumber(raw.mobile_item_gap_px, d.mobile_item_gap_px, 8, 64),
    mobile_font_size_px: asNumber(raw.mobile_font_size_px, d.mobile_font_size_px, 14, 48),
    mobile_font: pickEnum(raw.mobile_font, FONTS, d.mobile_font),
    mobile_letter_spacing_em: asNumber(raw.mobile_letter_spacing_em, d.mobile_letter_spacing_em, 0, 0.5),
    brand_line1: asString(raw.brand_line1, d.brand_line1),
    brand_line2: asString(raw.brand_line2, d.brand_line2),
    brand_letter_spacing_em: asNumber(raw.brand_letter_spacing_em, d.brand_letter_spacing_em, 0, 1),
    show_brand_text: asBool(raw.show_brand_text, d.show_brand_text),
    show_cart: asBool(raw.show_cart, d.show_cart),
    show_account: asBool(raw.show_account, d.show_account),
    show_lang_selector: asBool(raw.show_lang_selector, d.show_lang_selector),
    show_notifications: asBool(raw.show_notifications, d.show_notifications),
    sticky: asBool(raw.sticky, d.sticky),
    backdrop_blur: asBool(raw.backdrop_blur, d.backdrop_blur),
    show_logo: asBool(raw.show_logo, d.show_logo),
    logo_src: asString(raw.logo_src, d.logo_src),
    logo_height_px: asNumber(raw.logo_height_px, d.logo_height_px, 16, 160),
  };
}

export function parseHeaderNavItem(raw: Record<string, unknown>): HeaderNavItem | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const href = typeof raw.href === 'string' ? raw.href.trim() : '';
  if (!label || !href) return null;
  if (!href.startsWith('/') || href.startsWith('//')) return null;

  return {
    label,
    label_en: typeof raw.label_en === 'string' ? raw.label_en : undefined,
    href,
    show_desktop: asBool(raw.show_desktop, true),
    show_mobile: asBool(raw.show_mobile, true),
  };
}

export function resolveNavLabel(item: HeaderNavItem, locale: string): string {
  if (locale === 'en' && item.label_en?.trim()) return item.label_en.trim();
  return item.label;
}

export function headerSettingsToCssVars(settings: HeaderMenuSettings): Record<string, string> {
  return {
    '--tienda-header-h': `${settings.height_mobile_px}px`,
    '--tienda-header-h-md': `${settings.height_desktop_px}px`,
    '--tienda-nav-tracking': `${settings.nav_letter_spacing_em}em`,
    '--tienda-nav-gap': `${settings.nav_item_gap_px}px`,
    '--tienda-nav-size': `${settings.nav_font_size_px}px`,
    '--tienda-nav-transform': settings.nav_text_transform,
    '--tienda-mobile-nav-gap': `${settings.mobile_item_gap_px}px`,
    '--tienda-mobile-nav-size': `${settings.mobile_font_size_px}px`,
    '--tienda-mobile-nav-tracking': `${settings.mobile_letter_spacing_em}em`,
    '--tienda-brand-tracking': `${settings.brand_letter_spacing_em}em`,
  };
}

export const HEADER_LAYOUT_OPTIONS: { value: HeaderLayout; label: string; desc: string }[] = [
  { value: 'classic', label: 'Clásico', desc: 'Logo izq · nav centro · acciones der' },
  { value: 'centered', label: 'Centrado', desc: 'Logo centro · nav debajo en desktop' },
  { value: 'split', label: 'Split', desc: 'Logo izq · nav + acciones der' },
];

export const MOBILE_MENU_OPTIONS: { value: MobileMenuStyle; label: string; desc: string }[] = [
  { value: 'fullscreen', label: 'Pantalla completa', desc: 'Overlay editorial (actual)' },
  { value: 'drawer-left', label: 'Drawer izquierdo', desc: 'Panel lateral desde la izquierda' },
  { value: 'drawer-right', label: 'Drawer derecho', desc: 'Panel lateral desde la derecha' },
];
