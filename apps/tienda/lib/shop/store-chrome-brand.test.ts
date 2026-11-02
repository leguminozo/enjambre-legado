import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BRAND_ASSETS,
  parseBrandAssets,
  parseThemeSettings,
  parseAnnouncementSettings,
} from './store-chrome';

describe('parseBrandAssets', () => {
  it('devuelve defaults si raw es null', () => {
    const brand = parseBrandAssets(null);
    expect(brand.logo_url).toBe(DEFAULT_BRAND_ASSETS.logo_url);
    expect(brand.logo_height_px).toBe(DEFAULT_BRAND_ASSETS.logo_height_px);
    expect(brand.logo_max_width_px).toBe(DEFAULT_BRAND_ASSETS.logo_max_width_px);
    expect(brand.logo_footer_height_px).toBe(DEFAULT_BRAND_ASSETS.logo_footer_height_px);
  });

  it('acepta logo_url vacío (sin forzar default)', () => {
    const brand = parseBrandAssets({ logo_url: '' });
    expect(brand.logo_url).toBe('');
  });

  it('parsea URLs y tamaños de display', () => {
    const brand = parseBrandAssets({
      logo_url: 'https://cdn.example/logo.png',
      logo_footer_url: 'https://cdn.example/footer.png',
      favicon_url: 'https://cdn.example/fav.png',
      og_image_url: 'https://cdn.example/og.jpg',
      logo_height_px: 56,
      logo_max_width_px: 220,
      logo_footer_height_px: 64,
      logo_perfil_dark_url: 'https://cdn.example/perfil-dark.svg',
      logo_perfil_light_url: 'https://cdn.example/perfil-light.svg',
      logo_perfil_height_px: 48,
    });
    expect(brand.logo_url).toBe('https://cdn.example/logo.png');
    expect(brand.logo_footer_url).toBe('https://cdn.example/footer.png');
    expect(brand.favicon_url).toBe('https://cdn.example/fav.png');
    expect(brand.og_image_url).toBe('https://cdn.example/og.jpg');
    expect(brand.logo_height_px).toBe(56);
    expect(brand.logo_max_width_px).toBe(220);
    expect(brand.logo_footer_height_px).toBe(64);
    expect(brand.logo_perfil_dark_url).toBe('https://cdn.example/perfil-dark.svg');
    expect(brand.logo_perfil_url).toBe('https://cdn.example/perfil-dark.svg');
    expect(brand.logo_perfil_light_url).toBe('https://cdn.example/perfil-light.svg');
    expect(brand.logo_perfil_height_px).toBe(48);
  });

  it('clampa logo_height_px al rango 16–256', () => {
    expect(parseBrandAssets({ logo_height_px: 5 }).logo_height_px).toBe(16);
    expect(parseBrandAssets({ logo_height_px: 999 }).logo_height_px).toBe(256);
  });

  it('clampa logo_max_width_px 0–800 y footer height 16–256', () => {
    expect(parseBrandAssets({ logo_max_width_px: -10 }).logo_max_width_px).toBe(0);
    expect(parseBrandAssets({ logo_max_width_px: 9999 }).logo_max_width_px).toBe(800);
    expect(parseBrandAssets({ logo_footer_height_px: 5 }).logo_footer_height_px).toBe(16);
    expect(parseBrandAssets({ logo_footer_height_px: 500 }).logo_footer_height_px).toBe(256);
  });

  it('usa default favicon si falta o no es string', () => {
    expect(parseBrandAssets({}).favicon_url).toBe(DEFAULT_BRAND_ASSETS.favicon_url);
    expect(parseBrandAssets({ favicon_url: 123 as unknown as string }).favicon_url).toBe(
      DEFAULT_BRAND_ASSETS.favicon_url,
    );
  });

  it('parsea tamaños de nombre y lema y visibilidad responsive', () => {
    const d = parseBrandAssets(null);
    expect(d.brand_name_size_mobile_px).toBe(11);
    expect(d.brand_name_size_desktop_px).toBe(16);
    expect(d.brand_tagline_show_mobile).toBe(false);
    expect(d.brand_tagline_show_desktop).toBe(true);
    expect(d.brand_tagline_size_mobile_px).toBe(6);
    expect(d.brand_tagline_size_desktop_px).toBe(10);

    const custom = parseBrandAssets({
      brand_name_size_mobile_px: 12,
      brand_name_size_desktop_px: 24,
      brand_tagline_show_mobile: false,
      brand_tagline_show_desktop: true,
      brand_tagline_size_mobile_px: 8,
      brand_tagline_size_desktop_px: 11,
    });
    expect(custom.brand_name_size_mobile_px).toBe(12);
    expect(custom.brand_name_size_desktop_px).toBe(24);
    expect(custom.brand_tagline_show_mobile).toBe(false);
    expect(custom.brand_tagline_show_desktop).toBe(true);
    expect(custom.brand_tagline_size_mobile_px).toBe(8);
    expect(custom.brand_tagline_size_desktop_px).toBe(11);
  });
});

describe('parseThemeSettings / announcement (smoke chrome)', () => {
  it('theme defaults y force_dark_public', () => {
    const t = parseThemeSettings({ force_dark_public: true, default_theme: 'light' });
    expect(t.force_dark_public).toBe(true);
    expect(t.default_theme).toBe('light');
  });

  it('announcement enabled + interval clamp', () => {
    const a = parseAnnouncementSettings({ enabled: false, interval_ms: 500 });
    expect(a.enabled).toBe(false);
    // min 2000
    expect(a.interval_ms).toBe(2000);
  });
});

describe('parseBrandAssets + resolveHeaderBrand integration', () => {
  it('brand vacío + menu show_logo usa null logo sin romper', async () => {
    const { resolveHeaderBrand } = await import('./resolve-header-brand');
    const { DEFAULT_HEADER_SETTINGS } = await import('./header-menu');
    const brand = parseBrandAssets({ logo_url: '' });
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: true,
      logo_src: '',
    });
    expect(r.logoSrc).toBeNull();
    expect(r.source).toBe('none');
  });

  it('brand con URL y show_logo sin override → brand solo imagen', async () => {
    const { resolveHeaderBrand } = await import('./resolve-header-brand');
    const { DEFAULT_HEADER_SETTINGS } = await import('./header-menu');
    const brand = parseBrandAssets({
      logo_url: 'https://cdn.example/logo.png',
      logo_height_px: 48,
      logo_max_width_px: 160,
    });
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: true,
      logo_src: '',
    });
    expect(r.logoSrc).toBe('https://cdn.example/logo.png');
    expect(r.heightPx).toBe(48);
    expect(r.maxWidthPx).toBe(160);
    expect(r.showText).toBe(false);
    expect(r.source).toBe('brand');
  });
});
