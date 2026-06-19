'use server'

import type { CartLine } from '@/components/shop/cart-lines-context';
import { mergeCartQuantities, type CartQuantityItem } from '@/lib/cart/merge-lines';
import { CartLineInputSchema } from '@/lib/cart/schemas';
import { createClient } from '@/utils/supabase/server';

function validateCartItems(items: CartQuantityItem[]): CartQuantityItem[] {
  const valid: CartQuantityItem[] = [];
  for (const item of items) {
    const parsed = CartLineInputSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

async function enrichCartLines(items: CartQuantityItem[]): Promise<CartLine[]> {
  if (!items.length) return [];

  const supabase = await createClient();
  const productIds = items.map((item) => item.product_id);

  const { data: products, error } = await supabase
    .from('productos')
    .select('id, nombre, slug, precio, visible')
    .in('id', productIds)
    .eq('visible', true);

  if (error) {
    throw new Error('No se pudieron consultar los productos del carrito');
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const lines: CartLine[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product?.nombre || !product.slug || product.precio == null) continue;

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.nombre,
      unitPrice: product.precio,
      quantity: item.quantity,
    });
  }

  return lines;
}

async function replaceRemoteCartItems(items: CartQuantityItem[]): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const validItems = validateCartItems(items);

  const { error: deleteError } = await supabase
    .from('carrito_items')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    throw new Error('No se pudo limpiar el carrito remoto');
  }

  if (validItems.length > 0) {
    const { error: insertError } = await supabase.from('carrito_items').insert(
      validItems.map((item) => ({
        user_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    );

    if (insertError) {
      throw new Error('No se pudo guardar el carrito remoto');
    }
  }

  return enrichCartLines(validItems);
}

export async function getRemoteCartLines(): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('carrito_items')
    .select('product_id, quantity')
    .eq('user_id', user.id);

  if (error) {
    throw new Error('No se pudo cargar el carrito remoto');
  }

  const items = (data ?? []).map((row) => ({
    product_id: row.product_id,
    quantity: row.quantity,
  }));

  return enrichCartLines(items);
}

export async function syncRemoteCart(items: CartQuantityItem[]): Promise<CartLine[]> {
  return replaceRemoteCartItems(items);
}

export async function mergeCartOnLogin(localItems: CartQuantityItem[]): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return enrichCartLines(validateCartItems(localItems));

  const { data: remoteRows, error } = await supabase
    .from('carrito_items')
    .select('product_id, quantity')
    .eq('user_id', user.id);

  if (error) {
    throw new Error('No se pudo cargar el carrito remoto para fusionar');
  }

  const remoteItems = (remoteRows ?? []).map((row) => ({
    product_id: row.product_id,
    quantity: row.quantity,
  }));

  const merged = mergeCartQuantities(
    validateCartItems(localItems),
    remoteItems,
  );

  return replaceRemoteCartItems(merged);
}

export async function clearRemoteCart(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from('carrito_items').delete().eq('user_id', user.id);
  if (error) {
    throw new Error('No se pudo vaciar el carrito remoto');
  }
}