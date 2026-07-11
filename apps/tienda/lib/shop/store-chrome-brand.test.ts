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
    });
    expect(brand.logo_url).toBe('https://cdn.example/logo.png');
    expect(brand.logo_footer_url).toBe('https://cdn.example/footer.png');
    expect(brand.favicon_url).toBe('https://cdn.example/fav.png');
    expect(brand.og_image_url).toBe('https://cdn.example/og.jpg');
    expect(brand.logo_height_px).toBe(56);
    expect(brand.logo_max_width_px).toBe(220);
    expect(brand.logo_footer_height_px).toBe(64);
  });

  it('clampa logo_height_px al rango 16–120', () => {
    expect(parseBrandAssets({ logo_height_px: 5 }).logo_height_px).toBe(16);
    expect(parseBrandAssets({ logo_height_px: 999 }).logo_height_px).toBe(120);
  });

  it('clampa logo_max_width_px 0–480 y footer height 16–160', () => {
    expect(parseBrandAssets({ logo_max_width_px: -10 }).logo_max_width_px).toBe(0);
    expect(parseBrandAssets({ logo_max_width_px: 9999 }).logo_max_width_px).toBe(480);
    expect(parseBrandAssets({ logo_footer_height_px: 1 }).logo_footer_height_px).toBe(16);
    expect(parseBrandAssets({ logo_footer_height_px: 500 }).logo_footer_height_px).toBe(160);
  });

  it('usa default favicon si falta o no es string', () => {
    expect(parseBrandAssets({}).favicon_url).toBe(DEFAULT_BRAND_ASSETS.favicon_url);
    expect(parseBrandAssets({ favicon_url: 123 as unknown as string }).favicon_url).toBe(
      DEFAULT_BRAND_ASSETS.favicon_url,
    );
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
