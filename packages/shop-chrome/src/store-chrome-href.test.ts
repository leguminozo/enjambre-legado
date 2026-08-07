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

describe('parseLandingLayout copy del hero', () => {
  it('defaults vacíos (la tienda cae al i18n)', () => {
    const layout = parseLandingLayout(null);
    expect(layout.hero_eyebrow).toBe('');
    expect(layout.hero_title_line1).toBe('');
    expect(layout.hero_title_line2).toBe('');
    expect(layout.hero_subtitle).toBe('');
    expect(layout.hero_formula).toBe('');
    expect(layout.hero_eyebrow_en).toBeUndefined();
    expect(layout.hero_title_line1_en).toBeUndefined();
    expect(layout.hero_title_line2_en).toBeUndefined();
    expect(layout.hero_subtitle_en).toBeUndefined();
    expect(layout.hero_formula_en).toBeUndefined();
  });

  it('parsea ES + EN y recorta espacios', () => {
    const layout = parseLandingLayout({
      hero_eyebrow: '  Miel Virgen del Sur del Mundo ',
      hero_eyebrow_en: 'Regenerating the Chiloé ecosystem ',
      hero_title_line1: 'La Obrera',
      hero_title_line1_en: 'The Worker',
      hero_title_line2: 'y el Zángano',
      hero_title_line2_en: 'and the Drone',
      hero_subtitle: 'Desde el bosque húmedo de Chiloé',
      hero_subtitle_en: 'From the humid forest of Chiloé',
      hero_formula: 'Luz solar → Néctar → Miel virgen',
      hero_formula_en: 'Sunlight → Nectar → Virgin honey',
    });
    expect(layout.hero_eyebrow).toBe('Miel Virgen del Sur del Mundo');
    expect(layout.hero_eyebrow_en).toBe('Regenerating the Chiloé ecosystem');
    expect(layout.hero_title_line1).toBe('La Obrera');
    expect(layout.hero_title_line1_en).toBe('The Worker');
    expect(layout.hero_title_line2).toBe('y el Zángano');
    expect(layout.hero_title_line2_en).toBe('and the Drone');
    expect(layout.hero_subtitle).toBe('Desde el bosque húmedo de Chiloé');
    expect(layout.hero_subtitle_en).toBe('From the humid forest of Chiloé');
    expect(layout.hero_formula).toBe('Luz solar → Néctar → Miel virgen');
    expect(layout.hero_formula_en).toBe('Sunlight → Nectar → Virgin honey');
  });

  it('ignora valores no-string en el copy', () => {
    const layout = parseLandingLayout({
      hero_title_line1: 42,
      hero_eyebrow_en: null,
    });
    expect(layout.hero_title_line1).toBe('');
    expect(layout.hero_eyebrow_en).toBeUndefined();
  });
});
