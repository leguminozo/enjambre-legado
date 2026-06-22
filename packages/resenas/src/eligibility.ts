import { GUARDIAN_COOLDOWN_DAYS } from './constants';

export type VentaLine = {
  productId?: string;
  producto_id?: string;
  quantity?: number;
};

export function ventaContainsProduct(
  productos: unknown,
  productoId: string,
): boolean {
  if (!Array.isArray(productos)) return false;
  return productos.some((line) => {
    if (typeof line !== 'object' || line === null) return false;
    const record = line as VentaLine;
    const id = record.productId ?? record.producto_id;
    return id === productoId;
  });
}

export function isWithinCooldown(
  lastReviewAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!lastReviewAt) return false;
  const last = new Date(lastReviewAt);
  if (Number.isNaN(last.getTime())) return false;
  const diffMs = now.getTime() - last.getTime();
  const cooldownMs = GUARDIAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return diffMs < cooldownMs;
}

export function computeAggregateRating(
  ratings: number[],
): { ratingValue: number; reviewCount: number } | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  const avg = sum / ratings.length;
  return {
    ratingValue: Math.round(avg * 10) / 10,
    reviewCount: ratings.length,
  };
}