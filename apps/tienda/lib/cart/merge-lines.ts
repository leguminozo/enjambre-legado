export type CartQuantityItem = {
  product_id: string;
  quantity: number;
};

export function mergeCartQuantities(
  local: CartQuantityItem[],
  remote: CartQuantityItem[],
): CartQuantityItem[] {
  const merged = new Map<string, number>();

  for (const item of remote) {
    if (item.quantity < 1) continue;
    merged.set(item.product_id, item.quantity);
  }

  for (const item of local) {
    if (item.quantity < 1) continue;
    const current = merged.get(item.product_id) ?? 0;
    // Idempotencia: si el producto ya existe en local y remoto (ej. recarga de página),
    // se toma el valor máximo en vez de sumarlos para evitar duplicación exponencial.
    merged.set(item.product_id, Math.max(current, item.quantity));
  }

  return Array.from(merged.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity: Math.min(quantity, 99),
  }));
}