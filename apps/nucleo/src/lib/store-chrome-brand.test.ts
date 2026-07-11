import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_ASSETS, parseBrandAssets } from './store-chrome';

/** Parity con tienda: mismos clamps y logo_url vacío permitido. */
describe('nucleo parseBrandAssets', () => {
  it('defaults y logo vacío', () => {
    expect(parseBrandAssets(null).logo_url).toBe(DEFAULT_BRAND_ASSETS.logo_url);
    expect(parseBrandAssets({ logo_url: '' }).logo_url).toBe('');
  });

  it('clamps de tamaño de display', () => {
    expect(parseBrandAssets({ logo_height_px: 2 }).logo_height_px).toBe(16);
    expect(parseBrandAssets({ logo_height_px: 200 }).logo_height_px).toBe(120);
    expect(parseBrandAssets({ logo_max_width_px: 999 }).logo_max_width_px).toBe(480);
    expect(parseBrandAssets({ logo_footer_height_px: 200 }).logo_footer_height_px).toBe(160);
  });

  it('preserva URLs de marca', () => {
    const b = parseBrandAssets({
      logo_url: 'https://cdn/l.png',
      logo_footer_url: 'https://cdn/f.png',
      favicon_url: 'https://cdn/i.png',
      og_image_url: 'https://cdn/og.jpg',
      logo_height_px: 44,
    });
    expect(b.logo_url).toBe('https://cdn/l.png');
    expect(b.logo_footer_url).toBe('https://cdn/f.png');
    expect(b.favicon_url).toBe('https://cdn/i.png');
    expect(b.og_image_url).toBe('https://cdn/og.jpg');
    expect(b.logo_height_px).toBe(44);
  });
});
