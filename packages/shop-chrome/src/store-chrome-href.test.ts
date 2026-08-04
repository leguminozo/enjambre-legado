import { describe, expect, it } from 'vitest';
import {
  parseAnnouncementSlide,
  parseCampaignBanner,
  parseFooterSocialItem,
  parseLandingLayout,
  sanitizeStoreHref,
} from './store-chrome';

describe('sanitizeStoreHref', () => {
  it('acepta paths internos', () => {
    expect(sanitizeStoreHref('/catalogo')).toBe('/catalogo');
    expect(sanitizeStoreHref('/nosotros?x=1')).toBe('/nosotros?x=1');
  });

  it('acepta http(s)', () => {
    expect(sanitizeStoreHref('https://example.com/x')).toBe('https://example.com/x');
    expect(sanitizeStoreHref('http://example.com')).toBe('http://example.com');
  });

  it('rechaza protocol-relative, javascript y data', () => {
    expect(sanitizeStoreHref('//evil.com', '/')).toBe('/');
    expect(sanitizeStoreHref('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeStoreHref('data:text/html,hi', '/catalogo')).toBe('/catalogo');
  });
});

describe('parsers chrome usan sanitize', () => {
  it('announcement slide descarta href peligroso', () => {
    const slide = parseAnnouncementSlide({
      text: 'Hola',
      href: 'javascript:alert(1)',
    });
    expect(slide?.href).toBeUndefined();
  });

  it('campaign banner cae a /catalogo si href inválido', () => {
    const b = parseCampaignBanner({ title: 'Promo', href: '//phish.example' });
    expect(b?.href).toBe('/catalogo');
  });

  it('footer social rechaza href no-http sin slash', () => {
    expect(parseFooterSocialItem({ label: 'X', href: 'javascript:void(0)' })).toBeNull();
    expect(parseFooterSocialItem({ label: 'IG', href: 'https://instagram.com/x' })?.href).toContain(
      'instagram',
    );
  });

  it('landing hero_cta_href malicioso → default /catalogo', () => {
    const layout = parseLandingLayout({ hero_cta_href: '//evil.com' });
    expect(layout.hero_cta_href).toBe('/catalogo');
  });
});
