import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildBatchStockPayload,
  decrementoSerialFallback,
  mapStockRows,
  restaurarStock,
  type CartStockLine,
} from "../rep-ventas-stock";

function mockSupabase(rpcResult?: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult ?? { data: [], error: null });
  return { rpc } as unknown as SupabaseClient;
}

describe("buildBatchStockPayload", () => {
  it("mapea líneas del carrito a {id, qty} en orden", () => {
    const items: CartStockLine[] = [
      { producto_id: "a-1", cantidad: 2 },
      { producto_id: "b-2", cantidad: 1 },
    ];
    expect(buildBatchStockPayload(items)).toEqual([
      { id: "a-1", qty: 2 },
      { id: "b-2", qty: 1 },
    ]);
  });
});

describe("mapStockRows", () => {
  it("asocia filas por índice y enriquece con lote/hash", () => {
    const items: CartStockLine[] = [
      { producto_id: "a-1", cantidad: 2 },
      { producto_id: "b-2", cantidad: 1 },
    ];
    const rows = [
      { id: "a-1", stock: 8, lote_id: "l-1" },
      { id: "b-2", stock: 0, lote_id: null },
    ];
    const { enriched, decremented, negativeStock } = mapStockRows(items, rows);
    expect(enriched).toEqual([
      { producto_id: "a-1", cantidad: 2, traceability_hash: null, lote_id: "l-1" },
      { producto_id: "b-2", cantidad: 1, traceability_hash: null, lote_id: null },
    ]);
    expect(decremented).toEqual([
      { productId: "a-1", quantity: 2 },
      { productId: "b-2", quantity: 1 },
    ]);
    expect(negativeStock).toEqual([]);
  });

  it("marca sobregiro cuando el stock queda negativo", () => {
    const { negativeStock } = mapStockRows(
      [{ producto_id: "a-1", cantidad: 5 }],
      [{ id: "a-1", stock: -3 }],
    );
    expect(negativeStock).toEqual([{ productId: "a-1", stock: -3 }]);
  });

  it("usa defaults defensivos si faltan filas", () => {
    const { enriched, decremented } = mapStockRows(
      [{ producto_id: "a-1", cantidad: 1 }],
      [],
    );
    expect(enriched).toEqual([
      { producto_id: "a-1", cantidad: 1, traceability_hash: null, lote_id: null },
    ]);
    expect(decremented).toHaveLength(1);
  });

  it("conserva campos extra del ítem (qr_codes, precio_unitario)", () => {
    const items = [{ producto_id: "a-1", cantidad: 1, precio_unitario: 500, qr_codes: ["q1"] }];
    const { enriched } = mapStockRows(items, [{ id: "a-1", stock: 1 }]);
    expect(enriched[0]).toMatchObject({ precio_unitario: 500, qr_codes: ["q1"] });
  });
});

describe("restaurarStock", () => {
  it("llama decrement_stock_force con qty negativa por ítem (paralelo)", async () => {
    const supabase = mockSupabase();
    await restaurarStock(supabase, [
      { productId: "a-1", quantity: 2 },
      { productId: "b-2", quantity: 1 },
    ]);
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
    expect(supabase.rpc).toHaveBeenCalledWith("decrement_stock_force", { p_id: "a-1", p_qty: -2 });
    expect(supabase.rpc).toHaveBeenCalledWith("decrement_stock_force", { p_id: "b-2", p_qty: -1 });
  });

  it("no revienta si un rpc falla (los demás restauran)", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
      .mockResolvedValueOnce({ data: [], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;
    await expect(
      restaurarStock(supabase, [
        { productId: "a-1", quantity: 2 },
        { productId: "b-2", quantity: 1 },
      ]),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

describe("decrementoSerialFallback", () => {
  it("descuenta línea por línea (RPC single) y mapea filas", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "a-1", stock: 8, lote_id: "l-1" }], error: null })
      .mockResolvedValueOnce({ data: [{ id: "b-2", stock: 0, lote_id: null }], error: null });
    const supabase = { rpc } as unknown as SupabaseClient;
    const result = await decrementoSerialFallback(supabase, [
      { producto_id: "a-1", cantidad: 2 },
      { producto_id: "b-2", cantidad: 1 },
    ]);
    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith("decrement_stock_force", { p_id: "a-1", p_qty: 2 });
    expect(result.mapping?.enriched[1]).toMatchObject({ producto_id: "b-2", lote_id: null });
  });

  it("restaura las líneas ya descontadas si una falla (rollback parcial)", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "a-1", stock: 8 }], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "function not found" } });
    const supabase = { rpc } as unknown as SupabaseClient;
    const result = await decrementoSerialFallback(supabase, [
      { producto_id: "a-1", cantidad: 2 },
      { producto_id: "b-2", cantidad: 1 },
    ]);
    expect(result.ok).toBe(false);
    // 2 decrements + 1 restore (qty negativa)
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc).toHaveBeenLastCalledWith("decrement_stock_force", { p_id: "a-1", p_qty: -2 });
  });
});
