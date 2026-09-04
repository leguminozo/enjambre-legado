import { describe, expect, it } from 'vitest';
import {
  expandCatalogSearchQuery,
  productMatchesExpandedQuery,
  resolveCollectionCatalogHref,
} from './catalog-query';

const sample = [
  {
    name: 'Sachet Crema de Miel con Avellanas',
    format: '30x15g',
    category: 'miel',
    description: 'Gotas de Néctar',
    tags: [] as string[],
  },
  {
    name: 'Crema de Miel',
    format: '250g',
    category: 'miel',
    description: 'Tesoros del Colmenar',
    tags: [] as string[],
  },
  {
    name: 'Crema de Miel',
    format: '1kg',
    category: 'miel',
    description: 'Reservas del Bosque',
    tags: [] as string[],
  },
  {
    name: 'Miel Virgen',
    format: 'Panal',
    category: 'miel',
    description: 'Panal de Bosque',
    tags: [] as string[],
  },
  {
    name: 'Esencia de Canelo',
    format: 'Panal',
    category: '',
    description: 'Esencia de canelo',
    tags: [] as string[],
  },
];

describe('resolveCollectionCatalogHref', () => {
  it('reescribe /catalogo genérico según kicker', () => {
    expect(resolveCollectionCatalogHref({ kicker: 'Sachets', href: '/catalogo' })).toBe(
      '/catalogo?q=Sachet',
    );
    expect(resolveCollectionCatalogHref({ kicker: 'Frascos Medios', href: '/catalogo' })).toBe(
      '/catalogo?formato=250g',
    );
    expect(resolveCollectionCatalogHref({ kicker: 'Suscripciones', href: '/catalogo' })).toBe(
      '/club-legado-del-bosque',
    );
  });

  it('reescribe q=Sachets legacy del landing', () => {
    expect(
      resolveCollectionCatalogHref({ kicker: 'Sachets', href: '/catalogo?q=Sachets' }),
    ).toBe('/catalogo?q=Sachet');
    expect(
      resolveCollectionCatalogHref({ kicker: 'Hidrolatos', href: '/catalogo?q=Hidrolatos' }),
    ).toBe('/catalogo?q=Canelo');
  });
});

describe('expandCatalogSearchQuery + match', () => {
  it('q=Sachets encuentra sachets (no catálogo vacío)', () => {
    const exp = expandCatalogSearchQuery('Sachets');
    const hits = sample.filter((p) => productMatchesExpandedQuery(p, exp));
    expect(hits.map((h) => h.format)).toContain('30x15g');
    expect(hits.every((h) => h.format === '30x15g' || /sachet/i.test(h.name))).toBe(true);
  });

  it('q=Frascos encuentra frascos 250g/1kg', () => {
    const exp = expandCatalogSearchQuery('Frascos');
    const hits = sample.filter((p) => productMatchesExpandedQuery(p, exp));
    expect(hits.map((h) => h.format).sort()).toEqual(['1kg', '250g']);
  });

  it('q=Hidrolatos encuentra esencia/canelo', () => {
    const exp = expandCatalogSearchQuery('Hidrolatos');
    const hits = sample.filter((p) => productMatchesExpandedQuery(p, exp));
    expect(hits.some((h) => /canelo/i.test(h.name))).toBe(true);
  });

  it('q=Miel sigue encontrando categoría miel', () => {
    const exp = expandCatalogSearchQuery('Miel');
    const hits = sample.filter((p) => productMatchesExpandedQuery(p, exp));
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });
});
