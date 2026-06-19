import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decrementCartStock, validateCartStock } from './cart-stock';

function makeAdmin(handlers: Record<string, () => unknown>) {
  const from = vi.fn((table: string) => {
    const handler = handlers[table];
    if (!handler) throw new Error(`Unexpected table: ${table}`);
    return handler();
  });

  const rpc = vi.fn(async (fn: string) => {
    if (fn !== 'decrement_stock') throw new Error(`Unexpected rpc: ${fn}`);
    return handlers.decrement_stock?.();
  });

  return { from, rpc } as any;
}

function makeProductsChain(finalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockResolvedValue(finalValue);
  return chain;
}

function makeRollbackChain(
  selectResult: unknown,
  updateResult: unknown = { error: null },
) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: unknown) => void) => void;
  } = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(selectResult);
  chain.then = (resolve) => resolve(updateResult);
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

    const rollbackChain = makeRollbackChain({ data: { stock: 3 }, error: null });
    let productosCalls = 0;
    let decrementCalls = 0;

    const admin = makeAdmin({
      productos: () => {
        productosCalls += 1;
        return productosCalls === 1 ? productsChain : rollbackChain;
      },
      decrement_stock: () => {
        decrementCalls += 1;
        if (decrementCalls === 1) {
          return { data: [{ traceability_hash: 'hash-1', lote_id: 'lote-1' }], error: null };
        }
        return { data: [], error: null };
      },
    });

    const result = await decrementCartStock(admin, [
      { productId: 'p1', quantity: 2, name: 'Ulmo' },
      { productId: 'p2', quantity: 1, name: 'Tiaca' },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.enrichedLines).toEqual([]);
    expect(rollbackChain.update).toHaveBeenCalled();
  });
});