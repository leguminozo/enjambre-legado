/**
 * Tipos del menú de tienda (espejo de apps/tienda/lib/shop/header-menu.ts).
 * Mantener defaults alineados al seed migration 86.
 */

export type HeaderLayout = 'classic' | 'centered' | 'split';
export type MobileMenuStyle = 'fullscreen' | 'drawer-left' | 'drawer-right';
export type NavTextTransform = 'uppercase' | 'none' | 'capitalize';
export type NavFont = 'sans' | 'display';

export type HeaderMenuSettings = {
  layout: HeaderLayout;
  mobile_menu: MobileMenuStyle;
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
};

export const DEFAULT_HEADER_SETTINGS: HeaderMenuSettings = {
  layout: 'classic',
  mobile_menu: 'fullscreen',
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
};

export const HEADER_NAV_TEMPLATE = {
  label: '',
  label_en: '',
  href: '/',
  show_desktop: true,
  show_mobile: true,
};

export const HEADER_SETTINGS_TEMPLATE: HeaderMenuSettings = { ...DEFAULT_HEADER_SETTINGS };

export const HEADER_LAYOUT_OPTIONS: { value: HeaderLayout; label: string; desc: string }[] = [
  { value: 'classic', label: 'Clásico', desc: 'Logo izq · nav centro · acciones der' },
  { value: 'centered', label: 'Centrado', desc: 'Logo centro · nav debajo' },
  { value: 'split', label: 'Split', desc: 'Logo izq · nav + acciones der' },
];

export const MOBILE_MENU_OPTIONS: { value: MobileMenuStyle; label: string; desc: string }[] = [
  { value: 'fullscreen', label: 'Pantalla completa', desc: 'Overlay editorial' },
  { value: 'drawer-left', label: 'Drawer izquierdo', desc: 'Panel desde la izquierda' },
  { value: 'drawer-right', label: 'Drawer derecho', desc: 'Panel desde la derecha' },
];

export function mergeHeaderSettings(raw: Record<string, unknown> | undefined): HeaderMenuSettings {
  const d = DEFAULT_HEADER_SETTINGS;
  if (!raw) return { ...d };
  return {
    ...d,
    ...raw,
    layout: (['classic', 'centered', 'split'] as const).includes(raw.layout as HeaderLayout)
      ? (raw.layout as HeaderLayout)
      : d.layout,
    mobile_menu: (['fullscreen', 'drawer-left', 'drawer-right'] as const).includes(
      raw.mobile_menu as MobileMenuStyle,
    )
      ? (raw.mobile_menu as MobileMenuStyle)
      : d.mobile_menu,
  } as HeaderMenuSettings;
}
