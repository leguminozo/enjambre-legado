import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_ASSETS, parseBrandAssets } from './store-chrome';
import { resolveHeaderBrand } from './resolve-header-brand';

describe('parseBrandAssets', () => {
  it('defaults y logo vacío', () => {
    expect(parseBrandAssets(null).logo_url).toBe(DEFAULT_BRAND_ASSETS.logo_url);
    expect(parseBrandAssets({ logo_url: '' }).logo_url).toBe('');
    expect(parseBrandAssets(null).logo_perfil_url).toBe(DEFAULT_BRAND_ASSETS.logo_perfil_url);
    expect(parseBrandAssets(null).logo_perfil_height_px).toBe(DEFAULT_BRAND_ASSETS.logo_perfil_height_px);
  });

  it('parsea y clampa logo_perfil', () => {
    const custom = parseBrandAssets({
      logo_perfil_url: 'https://cdn.example/logo-perfil.svg',
      logo_perfil_height_px: 42,
    });
    expect(custom.logo_perfil_url).toBe('https://cdn.example/logo-perfil.svg');
    expect(custom.logo_perfil_height_px).toBe(42);

    const clampedLow = parseBrandAssets({ logo_perfil_height_px: 5 });
    expect(clampedLow.logo_perfil_height_px).toBe(16);

    const clampedHigh = parseBrandAssets({ logo_perfil_height_px: 500 });
    expect(clampedHigh.logo_perfil_height_px).toBe(120);
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

  it('parsea tamaños de nombre y lema y visibilidad responsive', () => {
    const d = parseBrandAssets(null);
    expect(d.brand_name_size_mobile_px).toBe(11);
    expect(d.brand_name_size_desktop_px).toBe(16);
    expect(d.brand_tagline_show_mobile).toBe(false);
    expect(d.brand_tagline_show_desktop).toBe(true);
    expect(d.brand_tagline_size_mobile_px).toBe(6);
    expect(d.brand_tagline_size_desktop_px).toBe(10);

    const custom = parseBrandAssets({
      brand_name_size_mobile_px: 13,
      brand_name_size_desktop_px: 22,
      brand_tagline_show_mobile: false,
      brand_tagline_show_desktop: true,
      brand_tagline_size_mobile_px: 8,
      brand_tagline_size_desktop_px: 12,
    });
    expect(custom.brand_name_size_mobile_px).toBe(13);
    expect(custom.brand_name_size_desktop_px).toBe(22);
    expect(custom.brand_name_size_px).toBe(22);
    expect(custom.brand_tagline_show_mobile).toBe(false);
    expect(custom.brand_tagline_show_desktop).toBe(true);
    expect(custom.brand_tagline_size_mobile_px).toBe(8);
    expect(custom.brand_tagline_size_desktop_px).toBe(12);
    expect(custom.brand_tagline_size_px).toBe(12);
  });

  it('clampa tamaños de nombre y lema dentro de rangos seguros', () => {
    const clamped = parseBrandAssets({
      brand_name_size_mobile_px: 1,
      brand_name_size_desktop_px: 999,
      brand_tagline_size_mobile_px: 2,
      brand_tagline_size_desktop_px: 999,
    });
    expect(clamped.brand_name_size_mobile_px).toBe(8);
    expect(clamped.brand_name_size_desktop_px).toBe(64);
    expect(clamped.brand_tagline_size_mobile_px).toBe(6);
    expect(clamped.brand_tagline_size_desktop_px).toBe(32);
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

  it('parseFooterSettings respeta y valida logo_layout', async () => {
    const { parseFooterSettings, DEFAULT_FOOTER_SETTINGS } = await import('./store-chrome');
    expect(DEFAULT_FOOTER_SETTINGS.logo_layout).toBe('stacked');
    expect(parseFooterSettings(null).logo_layout).toBe('stacked');
    expect(parseFooterSettings({ logo_layout: 'inline' }).logo_layout).toBe('inline');
    expect(parseFooterSettings({ logo_layout: 'stacked' }).logo_layout).toBe('stacked');
    expect(parseFooterSettings({ logo_layout: 'invalid' as unknown }).logo_layout).toBe('stacked');
  });
});

