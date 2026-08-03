import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const state = vi.hoisted(() => ({
  queryResult: { data: null as unknown, error: null as unknown },
}));

vi.mock('@/utils/supabase/anon-server', () => ({
  createAnonServerClient: () => ({
    from: () => {
      const q = {
        select: () => q,
        in: () => q,
        eq: () => Promise.resolve(state.queryResult),
      };
      return q;
    },
  }),
}));

import { fetchRatingAggregatesByProduct } from './catalog-ratings';

const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';

describe('fetchRatingAggregatesByProduct (movimiento 5: rating en catálogo)', () => {
  beforeEach(() => {
    state.queryResult = { data: null, error: null };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('ids vacíos → {} sin consultar', async () => {
    const result = await fetchRatingAggregatesByProduct([]);
    expect(result).toEqual({});
  });

  it('sin reseñas aprobadas → {}', async () => {
    state.queryResult = { data: [], error: null };
    expect(await fetchRatingAggregatesByProduct([P1])).toEqual({});
  });

  it('error de la query → {} (no lanza)', async () => {
    state.queryResult = { data: null, error: { message: 'boom' } };
    expect(await fetchRatingAggregatesByProduct([P1])).toEqual({});
  });

  it('agrupa por producto y calcula el agregado (promedio a 1 decimal + count)', async () => {
    state.queryResult = {
      data: [
        { producto_id: P1, rating: 5 },
        { producto_id: P1, rating: 4 },
        { producto_id: P2, rating: 3 },
      ],
      error: null,
    };
    const result = await fetchRatingAggregatesByProduct([P1, P2]);
    expect(result[P1]).toEqual({ ratingValue: 4.5, reviewCount: 2 });
    expect(result[P2]).toEqual({ ratingValue: 3, reviewCount: 1 });
  });

  it('rating null se trata como 0 (no rompe el agregado)', async () => {
    state.queryResult = {
      data: [{ producto_id: P1, rating: null }],
      error: null,
    };
    const result = await fetchRatingAggregatesByProduct([P1]);
    expect(result[P1]).toEqual({ ratingValue: 0, reviewCount: 1 });
  });

  it('devuelve la misma clave para todos los ratings de un producto', async () => {
    state.queryResult = {
      data: [
        { producto_id: P1, rating: 5 },
        { producto_id: P1, rating: 5 },
        { producto_id: P1, rating: 1 },
      ],
      error: null,
    };
    const result = await fetchRatingAggregatesByProduct([P1]);
    expect(result[P1]).toEqual({ ratingValue: 3.7, reviewCount: 3 });
  });
});
