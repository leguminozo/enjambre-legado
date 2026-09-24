import { describe, it, expect } from 'vitest';
import {
  computeAggregateRating,
  computeFloracionAggregate,
  isWithinCooldown,
  ventaContainsProduct,
} from '../eligibility';

describe('ventaContainsProduct', () => {
  it('detecta productId en líneas de venta', () => {
    const productos = [
      { productId: 'aaa', quantity: 1 },
      { productId: 'bbb', quantity: 2 },
    ];
    expect(ventaContainsProduct(productos, 'bbb')).toBe(true);
    expect(ventaContainsProduct(productos, 'ccc')).toBe(false);
  });

  it('acepta producto_id legacy', () => {
    expect(ventaContainsProduct([{ producto_id: 'x' }], 'x')).toBe(true);
  });
});

describe('isWithinCooldown', () => {
  it('retorna true si la última reseña fue hace pocos días', () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(isWithinCooldown(recent)).toBe(true);
  });

  it('retorna false sin reseña previa', () => {
    expect(isWithinCooldown(null)).toBe(false);
  });
});

describe('computeAggregateRating', () => {
  it('calcula promedio redondeado', () => {
    expect(computeAggregateRating([5, 4, 4])).toEqual({
      ratingValue: 4.3,
      reviewCount: 3,
    });
  });

  it('calcula promedio en escala de 1 a 7', () => {
    expect(computeAggregateRating([7, 7, 6])).toEqual({
      ratingValue: 6.7,
      reviewCount: 3,
    });
  });

  it('retorna null sin ratings', () => {
    expect(computeAggregateRating([])).toBeNull();
  });
});

describe('computeFloracionAggregate', () => {
  it('marca publicable = false si hay menos de 30 sesiones', () => {
    const res = computeFloracionAggregate({
      floracion_slug: 'ulmo',
      temporada: '2026-ulmo',
      sesiones: [
        {
          perc_chips: [{ bloque: 'aroma', chip: 'floral' }],
          perc_pares: [{ par: 'suave/intenso', valor: 2 }],
        },
      ],
      ratings: [{ rating: 7 }],
    });
    expect(res.publicable).toBe(false);
    expect(res.n_sesiones).toBe(1);
    expect(res.chips[0]?.chip).toBe('floral');
    expect(res.rating_promedio).toBe(7);
  });

  it('marca publicable = true cuando se alcanza el umbral de 30 sesiones', () => {
    const sesiones = Array.from({ length: 30 }, () => ({
      perc_chips: [{ bloque: 'aroma', chip: 'floral' }],
      perc_pares: [{ par: 'dulce/acido', valor: -1 }],
    }));
    const res = computeFloracionAggregate({
      floracion_slug: 'tiaca',
      temporada: null,
      sesiones,
      ratings: [{ rating: 6 }, { rating: 7 }],
    });
    expect(res.publicable).toBe(true);
    expect(res.n_sesiones).toBe(30);
    expect(res.rating_promedio).toBe(6.5);
    expect(res.review_count).toBe(2);
  });
});