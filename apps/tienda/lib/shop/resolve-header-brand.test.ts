import { describe, expect, it } from 'vitest';
import { resolveHeaderBrand } from './resolve-header-brand';
import { DEFAULT_BRAND_ASSETS } from './store-chrome';
import { DEFAULT_HEADER_SETTINGS } from './header-menu';

describe('resolveHeaderBrand', () => {
  const brand = {
    ...DEFAULT_BRAND_ASSETS,
    logo_url: 'https://cdn.example/logo.png',
    logo_height_px: 48,
    logo_max_width_px: 200,
  };

  it('usa brand + texto por defecto (show_logo off)', () => {
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: false,
      show_brand_text: true,
      logo_src: '',
    });
    expect(r.source).toBe('brand');
    expect(r.logoSrc).toBe(brand.logo_url);
    expect(r.heightPx).toBe(48);
    expect(r.maxWidthPx).toBe(200);
    expect(r.showText).toBe(true);
  });

  it('show_logo sin logo_src → fallback brand, solo imagen', () => {
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: true,
      logo_src: '',
      show_brand_text: true,
    });
    expect(r.source).toBe('brand');
    expect(r.logoSrc).toBe(brand.logo_url);
    expect(r.showText).toBe(false);
    expect(r.heightPx).toBe(48);
  });

  it('show_logo + logo_src → override menú y altura menú', () => {
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: true,
      logo_src: 'https://cdn.example/menu-only.png',
      logo_height_px: 28,
    });
    expect(r.source).toBe('menu');
    expect(r.logoSrc).toBe('https://cdn.example/menu-only.png');
    expect(r.heightPx).toBe(28);
    expect(r.maxWidthPx).toBe(200);
    expect(r.showText).toBe(false);
  });

  it('logo_url vacío → sin img, puede mostrar texto', () => {
    const r = resolveHeaderBrand(
      { ...brand, logo_url: '' },
      {
        ...DEFAULT_HEADER_SETTINGS,
        show_logo: false,
        show_brand_text: true,
      },
    );
    expect(r.source).toBe('none');
    expect(r.logoSrc).toBeNull();
    expect(r.showText).toBe(true);
  });

  it('respeta alturas personalizadas del menú sobre el logo oficial de marca', () => {
    const r = resolveHeaderBrand(brand, {
      ...DEFAULT_HEADER_SETTINGS,
      show_logo: true,
      logo_src: '',
      logo_height_mobile_px: 36,
      logo_height_desktop_px: 56,
      show_brand_text: true,
    });
    expect(r.source).toBe('brand');
    expect(r.logoSrc).toBe(brand.logo_url);
    expect(r.heightMobilePx).toBe(36);
    expect(r.heightDesktopPx).toBe(56);
    expect(r.heightPx).toBe(56);
  });
});
