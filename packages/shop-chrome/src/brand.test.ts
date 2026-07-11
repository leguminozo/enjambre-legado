import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_ASSETS, parseBrandAssets } from './brand';
import { resolveHeaderBrand } from './resolve-header-brand';

describe('parseBrandAssets', () => {
  it('defaults y logo vacío', () => {
    expect(parseBrandAssets(null).logo_url).toBe(DEFAULT_BRAND_ASSETS.logo_url);
    expect(parseBrandAssets({ logo_url: '' }).logo_url).toBe('');
  });

  it('clamps de tamaño', () => {
    expect(parseBrandAssets({ logo_height_px: 2 }).logo_height_px).toBe(16);
    expect(parseBrandAssets({ logo_height_px: 200 }).logo_height_px).toBe(120);
    expect(parseBrandAssets({ logo_max_width_px: 999 }).logo_max_width_px).toBe(480);
  });
});

describe('resolveHeaderBrand', () => {
  const brand = parseBrandAssets({
    logo_url: 'https://cdn.example/logo.png',
    logo_height_px: 48,
    logo_max_width_px: 200,
  });

  it('show_logo sin logo_src → brand solo imagen', () => {
    const r = resolveHeaderBrand(brand, {
      show_logo: true,
      logo_src: '',
      logo_height_px: 32,
      show_brand_text: true,
    });
    expect(r.source).toBe('brand');
    expect(r.logoSrc).toBe(brand.logo_url);
    expect(r.showText).toBe(false);
    expect(r.heightPx).toBe(48);
  });

  it('menu override', () => {
    const r = resolveHeaderBrand(brand, {
      show_logo: true,
      logo_src: 'https://cdn.example/menu.png',
      logo_height_px: 28,
      show_brand_text: true,
    });
    expect(r.source).toBe('menu');
    expect(r.logoSrc).toBe('https://cdn.example/menu.png');
    expect(r.heightPx).toBe(28);
  });
});
