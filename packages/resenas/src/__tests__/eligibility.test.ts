import { describe, it, expect } from 'vitest';
import {
  computeAggregateRating,
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

  it('retorna null sin ratings', () => {
    expect(computeAggregateRating([])).toBeNull();
  });
});