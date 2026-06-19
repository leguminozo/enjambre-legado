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
    merged.set(item.product_id, current + item.quantity);
  }

  return Array.from(merged.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity: Math.min(quantity, 99),
  }));
}