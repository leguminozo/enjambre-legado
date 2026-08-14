import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { rpcLoose } from "@/api/lib/supabase-loose";

/**
 * Decremento de stock por línea de carrito (POS rep-ventas /quick).
 * Extraído del handler para poder testear el mapeo filas→ítems sin DB.
 */

export interface CartStockLine {
  producto_id: string;
  cantidad: number;
}

export interface StockRow {
  id?: string;
  stock?: number | null;
  lote_id?: string | null;
  traceability_hash?: string | null;
}

export interface DecrementRecord {
  productId: string;
  quantity: number;
}

export interface StockMapping<T extends CartStockLine> {
  /** Ítems enriquecidos con hash/lote, en el orden del carrito. */
  enriched: Array<T & { traceability_hash: string | null; lote_id: string | null }>;
  /** Ítems efectivamente descontados (para rollback). */
  decremented: DecrementRecord[];
  /** Ítems cuyo stock quedó negativo tras el decremento (sobregiro offline). */
  negativeStock: Array<{ productId: string; stock: number }>;
}

/** Payload del RPC batch: [{ id, qty }, ...] en el orden del carrito. */
export function buildBatchStockPayload(items: CartStockLine[]): Array<{ id: string; qty: number }> {
  return items.map((i) => ({ id: i.producto_id, qty: i.cantidad }));
}

/**
 * Mapea las filas devueltas por decrement_stock_force_batch a los ítems del
 * carrito. El RPC devuelve una fila por ítem, en el mismo orden (el bucle SQL
 * itera el array en orden), así que el índice es la correspondencia.
 * Filas faltantes → defaults defensivos (stock 0, sin hash/lote).
 */
export function mapStockRows<T extends CartStockLine>(
  items: T[],
  rows: StockRow[],
): StockMapping<T> {
  const enriched: StockMapping<T>["enriched"] = [];
  const decremented: DecrementRecord[] = [];
  const negativeStock: Array<{ productId: string; stock: number }> = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const row = rows[idx] ?? {};
    decremented.push({ productId: item.producto_id, quantity: item.cantidad });
    const stock = row.stock ?? 0;
    if (stock < 0) negativeStock.push({ productId: item.producto_id, stock });
    enriched.push({
      ...item,
      traceability_hash: row.traceability_hash ?? null,
      lote_id: row.lote_id ?? null,
    });
  }

  return { enriched, decremented, negativeStock };
}

/**
 * Reversa de un decremento: reutiliza la RPC single con qty negativa
 * (`stock = stock - (-qty) = stock + qty`), que es un UPDATE atómico — a
 * diferencia del read-modify-write anterior (select + update por ítem).
 * Ítems con el mismo producto suman en paralelo sin carrera (UPDATE atómico).
 */
export async function restaurarStock(
  supabase: SupabaseClient<Database>,
  decremented: DecrementRecord[],
): Promise<void> {
  await Promise.all(
    decremented.map((d) =>
      Promise.resolve(
        rpcLoose(supabase, "decrement_stock_force", { p_id: d.productId, p_qty: -d.quantity }),
      ).catch(() => {
        console.warn(`[rep-ventas] Restore de stock falló para ${d.productId}`);
      }),
    ),
  );
}

export interface DecrementoResult<T extends CartStockLine> {
  ok: boolean;
  error?: unknown;
  mapping?: StockMapping<T>;
}

/**
 * Fallback legacy: decrement_stock_force por línea (N RPCs seriales), usado
 * cuando la RPC batch aún no está desplegada en la DB (orden de despliegue:
 * migración 20260812100000_batch_stock_decrement puede aplicarse después del
 * código). Si una línea falla, restaura las ya descontadas — misma semántica
 * que el handler original.
 */
export async function decrementoSerialFallback<T extends CartStockLine>(
  supabase: SupabaseClient<Database>,
  items: T[],
): Promise<DecrementoResult<T>> {
  const rows: StockRow[] = [];
  const decremented: DecrementRecord[] = [];
  for (const item of items) {
    const { data, error } = await rpcLoose(supabase, "decrement_stock_force", {
      p_id: item.producto_id,
      p_qty: item.cantidad,
    });
    if (error || !data || (data as unknown[]).length === 0) {
      await restaurarStock(supabase, decremented);
      return { ok: false, error };
    }
    rows.push(((data as unknown[])[0] ?? {}) as StockRow);
    decremented.push({ productId: item.producto_id, quantity: item.cantidad });
  }
  return { ok: true, mapping: mapStockRows(items, rows) };
}
