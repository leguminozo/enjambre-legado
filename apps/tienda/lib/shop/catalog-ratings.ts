import { createAnonServerClient } from '@/utils/supabase/anon-server';
import { computeAggregateRating } from '@enjambre/resenas';

export type ProductRatingAggregate = {
  ratingValue: number;
  reviewCount: number;
};

/** Agregados de reseñas aprobadas por producto (catálogo / cards). */
export async function fetchRatingAggregatesByProduct(
  productIds: string[],
): Promise<Record<string, ProductRatingAggregate>> {
  if (productIds.length === 0) return {};

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('resenas_producto')
    .select('producto_id, rating')
    .in('producto_id', productIds)
    .eq('estado', 'aprobada');

  if (error || !data?.length) return {};

  const byProduct = new Map<string, number[]>();
  for (const row of data) {
    const pid = row.producto_id as string;
    const rating = Number(row.rating) || 0;
    const list = byProduct.get(pid) ?? [];
    list.push(rating);
    byProduct.set(pid, list);
  }

  const out: Record<string, ProductRatingAggregate> = {};
  for (const [pid, ratings] of byProduct) {
    const aggregate = computeAggregateRating(ratings);
    if (aggregate) out[pid] = aggregate;
  }
  return out;
}