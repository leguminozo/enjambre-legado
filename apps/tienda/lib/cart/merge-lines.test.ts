import { describe, it, expect } from 'vitest';
import { mergeCartQuantities } from './merge-lines';

describe('mergeCartQuantities', () => {
  it('takes the maximum quantity for the same product to prevent duplication on merge/refresh', () => {
    const merged = mergeCartQuantities(
      [{ product_id: 'p1', quantity: 2 }],
      [{ product_id: 'p1', quantity: 3 }],
    );
    expect(merged).toEqual([{ product_id: 'p1', quantity: 3 }]);
  });

  it('is idempotent when merging identical carts on page refresh', () => {
    const cart = [{ product_id: 'p1', quantity: 1 }];
    const mergedOnce = mergeCartQuantities(cart, cart);
    const mergedTwice = mergeCartQuantities(mergedOnce, cart);
    expect(mergedOnce).toEqual([{ product_id: 'p1', quantity: 1 }]);
    expect(mergedTwice).toEqual([{ product_id: 'p1', quantity: 1 }]);
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
      [{ product_id: 'p1', quantity: 120 }],
      [{ product_id: 'p1', quantity: 20 }],
    );
    expect(merged).toEqual([{ product_id: 'p1', quantity: 99 }]);
  });
});