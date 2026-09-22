import type { SupabaseClient } from '@supabase/supabase-js';

export type StockLine = {
  productId: string;
  quantity: number;
  name?: string;
};

export type StockDecrementResult<T extends StockLine> = {
  ok: boolean;
  errors: string[];
  enrichedLines: Array<T & { traceability_hash?: string | null; lote_id?: string | null }>;
};

type DecrementedEntry = {
  productId: string;
  quantity: number;
};

async function restoreStock(admin: SupabaseClient, entries: DecrementedEntry[]): Promise<void> {
  for (const entry of entries) {
    const { data: product } = await admin
      .from('productos')
      .select('stock')
      .eq('id', entry.productId)
      .maybeSingle();

    if (!product || product.stock == null) continue;

    const { error } = await admin
      .from('productos')
      .update({ stock: product.stock + entry.quantity })
      .eq('id', entry.productId);

    if (error) {
      console.error('[cart-stock] rollback failed:', entry.productId, error.message);
    }
  }
}

/**
 * Productos cuyo lote está bloqueado por control de calidad
 * (HMF sobre el límite Codex en analisis_laboratorio).
 * Fail-open: sin columna o ante error, no bloquea (el panel lo evidencia).
 */
export async function fetchBloqueadosPorProducto(
  admin: SupabaseClient,
  productIds: string[],
): Promise<Set<string>> {
  const unicos = [...new Set(productIds.filter(Boolean))];
  if (unicos.length === 0) return new Set();
  try {
    const { data: prods, error: prodError } = await admin
      .from('productos')
      .select('id, lote_id')
      .in('id', unicos);
    if (prodError || !prods) return new Set();

    const loteIds = [...new Set(
      (prods as Array<{ id: string; lote_id: string | null }>)
        .map((p) => p.lote_id)
        .filter((id): id is string => Boolean(id)),
    )];
    if (loteIds.length === 0) return new Set();

    const { data: lotes, error: loteError } = await admin
      .from('lotes')
      .select('id')
      .eq('bloqueado_calidad', true)
      .in('id', loteIds);
    if (loteError || !lotes) return new Set();

    const bloqueados = new Set((lotes as Array<{ id: string }>).map((l) => l.id));
    return new Set(
      (prods as Array<{ id: string; lote_id: string | null }>)
        .filter((p) => p.lote_id && bloqueados.has(p.lote_id))
        .map((p) => p.id),
    );
  } catch (err) {
    console.warn('[cart-stock] quality block check failed, venta continúa:', err);
    return new Set();
  }
}

export async function validateCartStock(
  admin: SupabaseClient,
  lines: StockLine[],
): Promise<string[]> {
  const activeLines = lines.filter((line) => Math.max(0, Number(line.quantity || 0)) > 0);
  if (!activeLines.length) return [];

  const productIds = activeLines.map((line) => line.productId);
  const { data: products, error } = await admin
    .from('productos')
    .select('id, nombre, stock, visible')
    .in('id', productIds);

  if (error) {
    return [`No se pudo validar stock: ${error.message}`];
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const bloqueados = await fetchBloqueadosPorProducto(admin, productIds);
  const errors: string[] = [];

  for (const line of activeLines) {
    const qty = Math.max(0, Number(line.quantity || 0));
    const product = productMap.get(line.productId);

    if (!product) {
      errors.push(`Producto ${line.name ?? line.productId}: no encontrado`);
      continue;
    }

    if (product.visible === false) {
      errors.push(`Producto ${product.nombre ?? line.productId}: no disponible`);
      continue;
    }

    if (bloqueados.has(line.productId)) {
      errors.push(
        `Producto ${product.nombre ?? line.productId}: bloqueado por control de calidad (lote observado)`,
      );
      continue;
    }

    if (product.stock != null && product.stock < qty) {
      errors.push(
        `Producto ${product.nombre ?? line.productId}: stock insuficiente (${product.stock} disponible)`,
      );
    }
  }

  return errors;
}

export async function decrementCartStock<T extends StockLine>(
  admin: SupabaseClient,
  lines: T[],
): Promise<StockDecrementResult<T>> {
  const validationErrors = await validateCartStock(admin, lines);
  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors, enrichedLines: [] };
  }

  const decremented: DecrementedEntry[] = [];
  const enrichedLines: StockDecrementResult<T>['enrichedLines'] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const qty = Math.max(0, Number(line.quantity || 0));
    if (!qty) {
      enrichedLines.push({ ...line });
      continue;
    }

    const { data: decrementedRows, error: rpcErr } = await admin.rpc('decrement_stock', {
      p_id: line.productId,
      p_qty: qty,
    });

    if (rpcErr || !decrementedRows || (decrementedRows as unknown[]).length === 0) {
      errors.push(`Producto ${line.name ?? line.productId}: stock insuficiente o error al descontar`);
      await restoreStock(admin, decremented);
      return { ok: false, errors, enrichedLines: [] };
    }

    const stockData = decrementedRows as Array<{
      traceability_hash?: string | null;
      lote_id?: string | null;
    }>;

    decremented.push({ productId: line.productId, quantity: qty });
    enrichedLines.push({
      ...line,
      traceability_hash: stockData[0]?.traceability_hash ?? null,
      lote_id: stockData[0]?.lote_id ?? null,
    });
  }

  return { ok: true, errors: [], enrichedLines };
}