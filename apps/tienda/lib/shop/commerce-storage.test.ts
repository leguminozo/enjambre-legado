import { describe, expect, it } from 'vitest';
import {
  isStaleLocalCart,
  parseCartStorage,
  serializeCartStorage,
} from './commerce-storage';

describe('commerce-storage cart v2', () => {
  it('lee carritos v1 planos sin inventar timestamp', () => {
    const parsed = parseCartStorage<{ productId: string }>(
      JSON.stringify([{ productId: 'p-1' }]),
    );

    expect(parsed).toEqual({ lines: [{ productId: 'p-1' }], updatedAt: 0 });
  });

  it('hace round-trip v2 con updatedAt', () => {
    const raw = serializeCartStorage([{ productId: 'p-1' }], 1234);

    expect(parseCartStorage<{ productId: string }>(raw)).toEqual({
      lines: [{ productId: 'p-1' }],
      updatedAt: 1234,
    });
  });

  it('descarta storage corrupto en vez de lanzar', () => {
    expect(parseCartStorage('{no-json')).toEqual({ lines: [], updatedAt: 0 });
  });

  it('considera stale solo si el carrito es posterior a un pago', () => {
    const clearedAt = '2026-10-22T12:00:00.000Z';
    const before = new Date('2026-10-22T11:59:00.000Z').getTime();
    const after = new Date('2026-10-22T12:01:00.000Z').getTime();

    expect(isStaleLocalCart(before, clearedAt)).toBe(true);
    expect(isStaleLocalCart(after, clearedAt)).toBe(false);
    expect(isStaleLocalCart(0, clearedAt)).toBe(false);
    expect(isStaleLocalCart(before, null)).toBe(false);
  });
});
