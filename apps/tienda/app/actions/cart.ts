'use server'

import { createClient } from '@/utils/supabase/server'
import { getOyzRole } from '@/lib/shop/role'

export type CartItemInput = {
  product_id: string;
  quantity: number;
}

export type ComputedLineItem = {
  product_id: string;
  name: string;
  slug: string;
  unit_price: number; // Discounted unit price
  base_price: number; // Original unit price without discounts
  quantity: number;
  line_total: number;
}

export type CartPricing = {
  subtotal: number;
  discount_amount: number;
  total: number;
  line_items: ComputedLineItem[];
}

export async function calculateCartPricing(items: CartItemInput[]): Promise<CartPricing> {
  if (!items.length) {
    return { subtotal: 0, discount_amount: 0, total: 0, line_items: [] }
  }

  const supabase = await createClient();
  const role = await getOyzRole(); // derived exclusively from headers, NO client input
  
  const productIds = items.map(i => i.product_id);
  
  // Prepare parallel queries
  const productsPromise = supabase
    .from('productos')
    .select('id, nombre, slug, precio')
    .in('id', productIds);
    
  let pastOrdersPromise: Promise<any> = Promise.resolve({ data: null });
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Volume multiplier logic requires historical data for B2B roles
  if (user && (role === 'revendedor' || role === 'embajador')) {
    pastOrdersPromise = supabase
      .from('pedidos')
      .select('id')
      .eq('user_id', user.id);
  }

  // Execute queries batched
  const [productsRes, ordersRes] = await Promise.all([productsPromise, pastOrdersPromise]);
  const products = productsRes.data || [];
  const pastOrdersCount = ordersRes.data?.length || 0;

  // Base role multiplier logic (Hardcoded server-side constraints per Option B)
  let roleMultiplier = 1.0;
  if (role === 'embajador') roleMultiplier = 0.70; // 30% off base
  else if (role === 'revendedor') roleMultiplier = 0.80; // 20% off base
  else if (role === 'suscriptor') roleMultiplier = 0.90; // 10% off base

  // Volume multiplier mechanic (cumulative)
  let volumeMultiplier = 1.0;
  if ((role === 'revendedor' || role === 'embajador') && pastOrdersCount >= 10) {
    volumeMultiplier = 0.95; // Extra 5% volume discount for frequent buyers
  }

  const finalMultiplier = roleMultiplier * volumeMultiplier;

  let subtotal = 0;
  let total = 0;
  const lineItems: ComputedLineItem[] = [];

  for (const item of items) {
    const product = products.find((p: any) => p.id === item.product_id);
    if (!product) continue;

    const basePrice = product.precio;
    // Price must remain an integer (CLP)
    const discountedPrice = Math.round(basePrice * finalMultiplier);
    const lineTotal = discountedPrice * item.quantity;
    
    subtotal += basePrice * item.quantity;
    total += lineTotal;
    
    lineItems.push({
      product_id: item.product_id,
      name: product.nombre,
      slug: product.slug,
      unit_price: discountedPrice,
      base_price: basePrice,
      quantity: item.quantity,
      line_total: lineTotal
    });
  }

  return {
    subtotal,
    discount_amount: subtotal - total,
    total,
    line_items: lineItems
  };
}
