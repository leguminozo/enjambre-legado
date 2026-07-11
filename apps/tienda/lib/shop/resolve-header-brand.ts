/**
 * Single policy for header logo/text from brand_assets + menu_settings.
 * Avoids dual-source races: Marca owns default asset+size; Menú can override URL/height.
 */

import type { BrandAssets } from '@/lib/shop/store-chrome';
import type { HeaderMenuSettings } from '@/lib/shop/header-menu';

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
  settings: HeaderMenuSettings,
): ResolvedHeaderBrand {
  const brandUrl = nonEmpty(brand.logo_url);
  const menuUrl = nonEmpty(settings.logo_src);
  const maxWidthPx =
    brand.logo_max_width_px > 0 ? brand.logo_max_width_px : 180;
  const brandHeight = brand.logo_height_px > 0 ? brand.logo_height_px : 40;

  // Menú con override explícito
  if (settings.show_logo && menuUrl) {
    return {
      logoSrc: menuUrl,
      heightPx: settings.logo_height_px > 0 ? settings.logo_height_px : brandHeight,
      maxWidthPx,
      showText: false, // modo logo dedicado
      source: 'menu',
    };
  }

  // show_logo sin override → Marca (flujo principal tras subir en brand_assets)
  if (settings.show_logo && brandUrl) {
    return {
      logoSrc: brandUrl,
      heightPx: brandHeight,
      maxWidthPx,
      showText: false,
      source: 'brand',
    };
  }

  // Default: logo de marca + texto opcional
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
