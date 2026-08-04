'use server'

import {
  computeCartPricing,
  normalizeCommercialRole,
  type CartPricing,
  type ComputedLineItem,
  type PricingCartItemInput,
  type PricingProductRow,
} from '@enjambre/pricing'
import { resolveOyzRole } from '@/lib/shop/role'
import { createClient } from '@/utils/supabase/server'

export type CartItemInput = PricingCartItemInput
export type { CartPricing, ComputedLineItem }

export async function calculateCartPricing(items: CartItemInput[]): Promise<CartPricing> {
  if (!items.length) {
    return { subtotal: 0, discount_amount: 0, total: 0, line_items: [] }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = normalizeCommercialRole(await resolveOyzRole(user));

  const productIds = items.map((i) => i.product_id);

  const productsPromise = supabase
    .from('productos')
    .select('id, nombre, slug, precio')
    .in('id', productIds);

  let pastOrdersCount = 0;
  if (user && (role === 'revendedor' || role === 'embajador')) {
    const { count } = await supabase
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    pastOrdersCount = count ?? 0;
  }

  const { data: products, error: productsError } = await productsPromise;
  if (productsError) {
    throw new Error('No se pudieron consultar los productos');
  }

  // slug/precio nulos o string → checkout init Zod 400 / precios fantasma
  const rows: PricingProductRow[] = (products ?? []).map((p) => {
    const id = String(p.id);
    const precioRaw = p.precio;
    const precio =
      typeof precioRaw === 'number'
        ? precioRaw
        : typeof precioRaw === 'string'
          ? Number(precioRaw)
          : 0;
    return {
      id,
      nombre: p.nombre ?? 'Producto',
      slug: (typeof p.slug === 'string' && p.slug.trim()) || id,
      precio: Number.isFinite(precio) ? precio : 0,
    };
  });

  return computeCartPricing(items, rows, role, pastOrdersCount);
}