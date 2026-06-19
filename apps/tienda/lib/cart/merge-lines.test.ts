import { describe, it, expect } from 'vitest';
import { mergeCartQuantities } from './merge-lines';

describe('mergeCartQuantities', () => {
  it('sums quantities for the same product', () => {
    const merged = mergeCartQuantities(
      [{ product_id: 'p1', quantity: 2 }],
      [{ product_id: 'p1', quantity: 3 }],
    );
    expect(merged).toEqual([{ product_id: 'p1', quantity: 5 }]);
  });

  it('keeps distinct products from both carts', () => {
    const merged = mergeCartQuantities(
      [{ product_id: 'p1', quantity: 1 }],
      [{ product_id: 'p2', quantity: 4 }],
    );
    expect(merged).toEqual([
      { product_id: 'p2', quantity: 4 },
      { product_id: 'p1', quantity: 1 },
    ]);
  });

  it('caps merged quantity at 99', () => {
    const merged = mergeCartQuantities(
      [{ product_id: 'p1', quantity: 60 }],
      [{ product_id: 'p1', quantity: 60 }],
    );
    expect(merged).toEqual([{ product_id: 'p1', quantity: 99 }]);
  });
});