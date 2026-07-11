/**
 * Single policy for header logo/text from brand_assets + menu_settings.
 */

import type { BrandAssets } from './store-chrome';

/** Subconjunto de HeaderMenuSettings necesario para resolver logo. */
export type HeaderLogoSettings = {
  logo_src: string;
  show_logo: boolean;
  logo_height_px: number;
  show_brand_text: boolean;
};

export type ResolvedHeaderBrand = {
  /** null → no <img> (solo texto o vacío) */
  logoSrc: string | null;
  heightPx: number;
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
  const brandHeight = brand.logo_height_px > 0 ? brand.logo_height_px : 40;

  if (settings.show_logo && menuUrl) {
    return {
      logoSrc: menuUrl,
      heightPx: settings.logo_height_px > 0 ? settings.logo_height_px : brandHeight,
      maxWidthPx,
      showText: false,
      source: 'menu',
    };
  }

  if (settings.show_logo && brandUrl) {
    return {
      logoSrc: brandUrl,
      heightPx: brandHeight,
      maxWidthPx,
      showText: false,
      source: 'brand',
    };
  }

  if (brandUrl) {
    return {
      logoSrc: brandUrl,
      heightPx: brandHeight,
      maxWidthPx,
      showText: settings.show_brand_text,
      source: 'brand',
    };
  }

  return {
    logoSrc: null,
    heightPx: brandHeight,
    maxWidthPx,
    showText: settings.show_brand_text,
    source: 'none',
  };
}
