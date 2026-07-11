/**
 * Brand assets CMS (section brand_assets).
 * Fuente única para nucleo editor + tienda render.
 */

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

function asNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  let out = n;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
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
