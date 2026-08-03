import { describe, it, expect } from 'vitest';
import { itemListJsonLd, productJsonLd, mergeJsonLd } from './json-ld';

describe('itemListJsonLd (movimiento 5: rich results de estrellas en catálogo)', () => {
  const items = [
    { name: 'Miel de Ulmo', slug: 'miel-de-ulmo', position: 1 },
    { name: 'Miel de Tiaca', slug: 'miel-de-tiaca', position: 2 },
  ];

  it('sin ratings → ListItem simple (estructura actual)', () => {
    const schema = itemListJsonLd(items);
    expect(schema['@type']).toBe('ItemList');
    expect(schema.numberOfItems).toBe(2);
    const first = (schema.itemListElement as Array<Record<string, unknown>>)[0];
    expect(first['@type']).toBe('ListItem');
    expect(first.url).toContain('/producto/miel-de-ulmo');
    expect(first.item).toBeUndefined();
  });

  it('con ratings → cada ListItem lleva item Product con AggregateRating', () => {
    const schema = itemListJsonLd(items, {
      'miel-de-ulmo': { ratingValue: 4.5, reviewCount: 2 },
      'miel-de-tiaca': { ratingValue: 5, reviewCount: 1 },
    });
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    const ulmo = elements[0].item as Record<string, unknown>;
    expect(ulmo['@type']).toBe('Product');
    expect(ulmo.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 2,
      bestRating: 5,
      worstRating: 1,
    });
    expect(elements[1].item).toBeDefined();
  });

  it('rating con reviewCount 0 → sin item (no inventar reseñas)', () => {
    const schema = itemListJsonLd(items, {
      'miel-de-ulmo': { ratingValue: 0, reviewCount: 0 },
    });
    const first = (schema.itemListElement as Array<Record<string, unknown>>)[0];
    expect(first.item).toBeUndefined();
  });

  it('producto sin rating en el mapa → sin item', () => {
    const schema = itemListJsonLd(items, {
      'miel-de-tiaca': { ratingValue: 4, reviewCount: 1 },
    });
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements[0].item).toBeUndefined();
    expect(elements[1].item).toBeDefined();
  });
});

describe('productJsonLd (agregados de reseñas)', () => {
  const base = {
    name: 'Miel',
    slug: 'miel',
    description: 'Desc',
    price: 10000,
    photos: [],
    stock: 5,
    format: '500g',
  };

  it('agrega AggregateRating solo cuando reviewCount > 0', () => {
    const withRating = productJsonLd({
      ...base,
      aggregateRating: { ratingValue: 4.8, reviewCount: 12 },
    });
    expect(withRating.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    });

    const without = productJsonLd({ ...base, aggregateRating: { ratingValue: 4.8, reviewCount: 0 } });
    expect(without.aggregateRating).toBeUndefined();
  });
});

describe('mergeJsonLd', () => {
  it('un solo registro → lo devuelve tal cual', () => {
    const record = { '@context': 'https://schema.org', '@type': 'Organization' };
    expect(mergeJsonLd([record])).toBe(record);
  });

  it('varios registros → @graph sin @context duplicado', () => {
    const merged = mergeJsonLd([
      { '@context': 'https://schema.org', '@type': 'Organization' },
      { '@context': 'https://schema.org', '@type': 'WebSite' },
    ]);
    expect(merged['@graph']).toHaveLength(2);
    const graph = merged['@graph'] as Array<Record<string, unknown>>;
    expect(graph[0]['@context']).toBeUndefined();
    expect(graph[1]['@type']).toBe('WebSite');
  });
});
