import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COLLECTIONS_SETTINGS,
  parseCollectionsSettings,
  parseCatalogSettings,
  parseProductsSettings,
  parseGaleriaSettings,
  parseNosotrosSettings,
  parseMediaSettings,
  parseCienciaSettings,
  parseHomeMediaItem,
} from './store-chrome';

describe('parseCollectionsSettings', () => {
  it('null/undefined → defaults con aspect-ratio 4/3 y fit cover', () => {
    const out = parseCollectionsSettings(null);
    expect(out.kicker).toBe('Colecciones');
    expect(out.image_aspect_ratio).toBe('4/3');
    expect(out.image_fit).toBe('cover');
    expect(out.grid_columns).toBe(3);
  });

  it('parsea correctamente valores válidos de aspect ratio y fit mode', () => {
    const out = parseCollectionsSettings({
      kicker: 'Categorías Estacionales',
      image_aspect_ratio: '1/1',
      image_fit: 'contain',
      grid_columns: 4,
    });
    expect(out.kicker).toBe('Categorías Estacionales');
    expect(out.image_aspect_ratio).toBe('1/1');
    expect(out.image_fit).toBe('contain');
    expect(out.grid_columns).toBe(4);
  });

  it('descarte de enums inválidos y fallback seguro', () => {
    const out = parseCollectionsSettings({
      image_aspect_ratio: 'invalid-ratio',
      image_fit: 'stretch',
      grid_columns: 10,
    });
    expect(out.image_aspect_ratio).toBe('4/3');
    expect(out.image_fit).toBe('cover');
    expect(out.grid_columns).toBe(4); // min 2 max 4
  });
});

describe('parseCatalogSettings e image_aspect_ratio', () => {
  it('parsea campos de imagen en catálogo', () => {
    const out = parseCatalogSettings({
      image_aspect_ratio: '3/4',
      image_fit: 'contain',
    });
    expect(out.image_aspect_ratio).toBe('3/4');
    expect(out.image_fit).toBe('contain');
  });
});

describe('parseProductsSettings e image_aspect_ratio', () => {
  it('parsea campos de imagen en bloque de productos de landing', () => {
    const out = parseProductsSettings({
      image_aspect_ratio: '16/10',
      image_fit: 'contain',
    });
    expect(out.image_aspect_ratio).toBe('16/10');
    expect(out.image_fit).toBe('contain');
  });
});

describe('parseGaleriaSettings', () => {
  it('null/undefined → defaults con aspect-ratio 4/3 y fit cover', () => {
    const out = parseGaleriaSettings(null);
    expect(out.kicker).toBe('Galería');
    expect(out.image_aspect_ratio).toBe('4/3');
    expect(out.image_fit).toBe('cover');
    expect(out.grid_columns).toBe(3);
  });
});

describe('parseNosotrosSettings', () => {
  it('null/undefined → defaults con aspect-ratio 16/9 y fit cover', () => {
    const out = parseNosotrosSettings(null);
    expect(out.kicker).toBe('Nuestra Historia');
    expect(out.image_aspect_ratio).toBe('16/9');
    expect(out.image_fit).toBe('cover');
  });
});

describe('parseMediaSettings', () => {
  it('null/undefined → defaults con height 50vh/70vh y fit cover', () => {
    const out = parseMediaSettings(null);
    expect(out.carousel_height).toBe('50vh/70vh');
    expect(out.image_fit).toBe('cover');
    expect(out.autoplay_ms).toBe(5000);
  });
});

describe('parseCienciaSettings', () => {
  it('null/undefined → defaults de ciencia', () => {
    const out = parseCienciaSettings(null);
    // Defaults actuales de DEFAULT_CIENCIA_SETTINGS.
    expect(out.kicker).toBe('Ciencia & Innovación');
    expect(out.title).toBe('Respaldado por la naturaleza y la investigación');
  });
});

describe('parseHomeMediaItem', () => {
  it('parsea correctamente imagen con superposición de copy y CTA', () => {
    const item = parseHomeMediaItem({
      type: 'image',
      image: 'https://example.com/foto.jpg',
      alt: 'Bosque Nativo',
      kicker: 'REFORESTACIÓN',
      title: 'Miel Virgen del Colmenar',
      subtitle: 'Apicultura regenerativa en Chiloé',
      cta_label: 'Ver Colección',
      cta_link: '/catalogo',
    });
    expect(item).not.toBeNull();
    expect(item?.src).toBe('https://example.com/foto.jpg');
    expect(item?.kicker).toBe('REFORESTACIÓN');
    expect(item?.title).toBe('Miel Virgen del Colmenar');
    expect(item?.cta_label).toBe('Ver Colección');
    expect(item?.cta_link).toBe('/catalogo');
  });
});
