/**
 * Single policy for header logo/text from brand_assets + menu_settings.
 */

import type { BrandAssets } from './store-chrome';

/** Subconjunto de HeaderMenuSettings necesario para resolver logo. */
export type HeaderLogoSettings = {
  logo_src: string;
  show_logo: boolean;
  logo_height_px: number;
  logo_height_mobile_px?: number;
  logo_height_desktop_px?: number;
  show_brand_text: boolean;
};

export type ResolvedHeaderBrand = {
  /** null → no <img> (solo texto o vacío) */
  logoSrc: string | null;
  /** Altura fallback/desktop para compatibilidad previa */
  heightPx: number;
  /** Altura optimizada para pantallas móviles (<768px) */
  heightMobilePx: number;
  /** Altura optimizada para pantallas de escritorio (≥768px) */
  heightDesktopPx: number;
  maxWidthPx: number;
  showText: boolean;
  source: 'menu' | 'brand' | 'none';
};

function nonEmpty(url: string | undefined | null): string {
  return typeof url === 'string' ? url.trim() : '';
}

/**
 * Resolución:
 * 1. show_logo + menu.logo_src → menú (altura menú, maxWidth marca)
 * 2. show_logo + sin logo_src → brand.logo_url (fallback; logo-only)
 * 3. !show_logo + brand.logo_url → brand + show_brand_text
 * 4. sin URL → solo texto si show_brand_text
 */
export function resolveHeaderBrand(
  brand: BrandAssets,
  settings: HeaderLogoSettings,
): ResolvedHeaderBrand {
  const brandUrl = nonEmpty(brand.logo_url);
  const menuUrl = nonEmpty(settings.logo_src);
  const maxWidthPx = brand.logo_max_width_px > 0 ? brand.logo_max_width_px : 180;
  const brandDesktop = brand.logo_height_desktop_px ?? (brand.logo_height_px > 0 ? brand.logo_height_px : 44);
  const brandMobile = brand.logo_height_mobile_px ?? Math.min(brandDesktop, 32);

  if (settings.show_logo && menuUrl) {
    const menuDesktop = settings.logo_height_desktop_px ?? (settings.logo_height_px > 0 ? settings.logo_height_px : brandDesktop);
    const menuMobile = settings.logo_height_mobile_px ?? Math.min(menuDesktop, 32);
    return {
      logoSrc: menuUrl,
      heightPx: menuDesktop,
      heightMobilePx: menuMobile,
      heightDesktopPx: menuDesktop,
      maxWidthPx,
      showText: false,
      source: 'menu',
    };
  }

  if (settings.show_logo && brandUrl) {
    return {
      logoSrc: brandUrl,
      heightPx: brandDesktop,
      heightMobilePx: brandMobile,
      heightDesktopPx: brandDesktop,
      maxWidthPx,
      showText: false,
      source: 'brand',
    };
  }

  if (brandUrl) {
    return {
      logoSrc: brandUrl,
      heightPx: brandDesktop,
      heightMobilePx: brandMobile,
      heightDesktopPx: brandDesktop,
      maxWidthPx,
      showText: settings.show_brand_text,
      source: 'brand',
    };
  }

  return {
    logoSrc: null,
    heightPx: brandDesktop,
    heightMobilePx: brandMobile,
    heightDesktopPx: brandDesktop,
    maxWidthPx,
    showText: settings.show_brand_text,
    source: 'none',
  };
}
