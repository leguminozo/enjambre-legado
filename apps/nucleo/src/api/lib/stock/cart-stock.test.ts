import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decrementCartStock, validateCartStock } from './cart-stock';

function makeAdmin(handlers: Record<string, () => unknown>) {
  const from = vi.fn((table: string) => {
    const handler = handlers[table];
    if (!handler) throw new Error(`Unexpected table: ${table}`);
    return handler();
  });

  const rpc = vi.fn(async (fn: string) => {
    if (fn !== 'decrement_stock' && fn !== 'decrement_stock_force') {
      throw new Error(`Unexpected rpc: ${fn}`);
    }
    return handlers[fn]?.();
  });

  return { from, rpc } as any;
}

function makeProductsChain(finalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockResolvedValue(finalValue);
  return chain;
}

describe('cart-stock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validateCartStock rejects insufficient stock', async () => {
    const productsChain = makeProductsChain({
      data: [{ id: 'p1', nombre: 'Ulmo', stock: 1, visible: true }],
      error: null,
    });

    const admin = makeAdmin({
      productos: () => productsChain,
    });

    const errors = await validateCartStock(admin, [{ productId: 'p1', quantity: 3 }]);
    expect(errors[0]).toContain('stock insuficiente');
  });

  it('decrementCartStock aborts venta when decrement fails and rolls back', async () => {
    const productsChain = makeProductsChain({
      data: [
        { id: 'p1', nombre: 'Ulmo', stock: 5, visible: true },
        { id: 'p2', nombre: 'Tiaca', stock: 5, visible: true },
      ],
      error: null,
    });

    let decrementCalls = 0;

    const admin = makeAdmin({
      productos: () => productsChain,
      decrement_stock: () => {
        decrementCalls += 1;
        if (decrementCalls === 1) {
          return { data: [{ traceability_hash: 'hash-1', lote_id: 'lote-1' }], error: null };
        }
        return { data: [], error: null };
      },
      decrement_stock_force: () => ({ data: [], error: null }),
    });

    const result = await decrementCartStock(admin, [
      { productId: 'p1', quantity: 2, name: 'Ulmo' },
      { productId: 'p2', quantity: 1, name: 'Tiaca' },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.enrichedLines).toEqual([]);
    // Rollback atómico solo de la línea ya descontada (p_qty negativa).
    expect(admin.rpc).toHaveBeenCalledTimes(3);
    expect(admin.rpc).toHaveBeenCalledWith('decrement_stock_force', { p_id: 'p1', p_qty: -2 });
  });
});