import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_ASSETS, parseBrandAssets } from './store-chrome';
import { resolveHeaderBrand } from './resolve-header-brand';

describe('parseBrandAssets', () => {
  it('defaults y logo vacío', () => {
    expect(parseBrandAssets(null).logo_url).toBe(DEFAULT_BRAND_ASSETS.logo_url);
    expect(parseBrandAssets({ logo_url: '' }).logo_url).toBe('');
  });

  it('clamps de tamaño', () => {
    expect(parseBrandAssets({ logo_height_px: 2 }).logo_height_px).toBe(16);
    expect(parseBrandAssets({ logo_height_px: 999 }).logo_height_px).toBe(256);
    expect(parseBrandAssets({ logo_max_width_px: 999 }).logo_max_width_px).toBe(800);
  });

  it('parsea tamaños móvil y escritorio con fallbacks', () => {
    const res = parseBrandAssets({
      logo_height_mobile_px: 28,
      logo_height_desktop_px: 52,
      logo_footer_height_mobile_px: 30,
      logo_footer_height_desktop_px: 60,
    });
    expect(res.logo_height_mobile_px).toBe(28);
    expect(res.logo_height_desktop_px).toBe(52);
    expect(res.logo_height_px).toBe(52);
    expect(res.logo_footer_height_mobile_px).toBe(30);
    expect(res.logo_footer_height_desktop_px).toBe(60);
    expect(res.logo_footer_height_px).toBe(60);
  });
});

describe('resolveHeaderBrand', () => {
  const brand = parseBrandAssets({
    logo_url: 'https://cdn.example/logo.png',
    logo_height_px: 48,
    logo_height_mobile_px: 32,
    logo_height_desktop_px: 48,
    logo_max_width_px: 200,
  });

  it('show_logo sin logo_src → brand solo imagen con alturas móvil y escritorio', () => {
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
    expect(r.heightDesktopPx).toBe(48);
    expect(r.heightMobilePx).toBe(32);
  });

  it('menu override con alturas móvil y escritorio', () => {
    const r = resolveHeaderBrand(brand, {
      show_logo: true,
      logo_src: 'https://cdn.example/menu.png',
      logo_height_px: 28,
      logo_height_mobile_px: 24,
      logo_height_desktop_px: 36,
      show_brand_text: true,
    });
    expect(r.source).toBe('menu');
    expect(r.logoSrc).toBe('https://cdn.example/menu.png');
    expect(r.heightPx).toBe(36);
    expect(r.heightDesktopPx).toBe(36);
    expect(r.heightMobilePx).toBe(24);
  });

  it('show_logo con logo de marca y alturas personalizadas en menú', () => {
    const r = resolveHeaderBrand(brand, {
      show_logo: true,
      logo_src: '',
      logo_height_px: 32,
      logo_height_mobile_px: 40,
      logo_height_desktop_px: 60,
      show_brand_text: true,
    });
    expect(r.source).toBe('brand');
    expect(r.logoSrc).toBe(brand.logo_url);
    expect(r.showText).toBe(false);
    expect(r.heightPx).toBe(60);
    expect(r.heightDesktopPx).toBe(60);
    expect(r.heightMobilePx).toBe(40);
  });
});

describe('store-chrome smoke', () => {
  it('exporta theme defaults y templates editor', async () => {
    const m = await import('./store-chrome');
    expect(m.DEFAULT_THEME_SETTINGS.default_theme).toBeDefined();
    expect(m.DEFAULT_ANNOUNCEMENT_SETTINGS.enabled).toBe(true);
    expect(m.LANDING_SECTION_LABELS.hero).toBeTruthy();
    expect(m.LANDING_SECTION_LABELS.media).toBe('Media');
    expect(m.LANDING_SECTION_EDITOR_KEY.media).toBe('media_items');
    // Orden del home no debe repetir el nombre de la herramienta de fichas
    expect(m.LANDING_SECTION_LABELS.video).not.toBe('Video central');
    expect(m.LANDING_SECTION_LABELS.map).not.toBe('Mapa / Lugar');
    expect(m.LANDING_SECTION_LABELS.products).not.toBe('Creaciones — Cabecera');
    expect(m.LANDING_SECTION_LABELS.collections).not.toBe('Colecciones');
    expect(m.BRAND_ASSETS_TEMPLATE.logo_url).toBeDefined();
  });
});
