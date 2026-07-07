'use server'

import type { CartLine } from '@/lib/cart/types';
import { mergeCartQuantities, type CartQuantityItem } from '@/lib/cart/merge-lines';
import { CartLineInputSchema } from '@/lib/cart/schemas';
import { createClient } from '@/utils/supabase/server';

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

function isCartTableUnavailable(error: SupabaseErrorLike): boolean {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (message.includes('carrito_items') &&
      (message.includes('does not exist') || message.includes('not found') || message.includes('schema cache')))
  );
}

function logCartSyncWarning(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[cart-sync] ${context}`, error);
  }
}

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

  try {
    const supabase = await createClient();
    const productIds = items.map((item) => item.product_id);

    const { data: products, error } = await supabase
      .from('productos')
      .select('id, nombre, slug, precio, visible')
      .in('id', productIds)
      .eq('visible', true);

    if (error) {
      logCartSyncWarning('product lookup failed', error);
      return [];
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
  } catch (error) {
    logCartSyncWarning('enrichCartLines failed', error);
    return [];
  }
}

async function replaceRemoteCartItems(items: CartQuantityItem[]): Promise<CartLine[]> {
  const validItems = validateCartItems(items);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return enrichCartLines(validItems);

    const { error: deleteError } = await supabase
      .from('carrito_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      if (isCartTableUnavailable(deleteError)) {
        logCartSyncWarning('carrito_items table unavailable on delete', deleteError);
        return enrichCartLines(validItems);
      }
      logCartSyncWarning('remote cart delete failed', deleteError);
      return enrichCartLines(validItems);
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
        if (isCartTableUnavailable(insertError)) {
          logCartSyncWarning('carrito_items table unavailable on insert', insertError);
          return enrichCartLines(validItems);
        }
        logCartSyncWarning('remote cart insert failed', insertError);
        return enrichCartLines(validItems);
      }
    }

    return enrichCartLines(validItems);
  } catch (error) {
    logCartSyncWarning('replaceRemoteCartItems failed', error);
    return enrichCartLines(validItems);
  }
}

async function getRemoteCartLinesImpl(): Promise<CartLine[]> {
  try {
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
      if (isCartTableUnavailable(error)) {
        logCartSyncWarning('carrito_items table unavailable on read', error);
        return [];
      }
      logCartSyncWarning('remote cart read failed', error);
      return [];
    }

    const items = (data ?? []).map((row) => ({
      product_id: row.product_id,
      quantity: row.quantity,
    }));

    return enrichCartLines(items);
  } catch (error) {
    logCartSyncWarning('getRemoteCartLines failed', error);
    return [];
  }
}

async function syncRemoteCartImpl(items: CartQuantityItem[]): Promise<CartLine[]> {
  return replaceRemoteCartItems(items);
}

async function mergeCartOnLoginImpl(localItems: CartQuantityItem[]): Promise<CartLine[]> {
  const validatedLocal = validateCartItems(localItems);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return enrichCartLines(validatedLocal);

    const { data: remoteRows, error } = await supabase
      .from('carrito_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (error) {
      if (isCartTableUnavailable(error)) {
        logCartSyncWarning('carrito_items table unavailable on merge', error);
        return enrichCartLines(validatedLocal);
      }
      logCartSyncWarning('remote cart merge read failed', error);
      return enrichCartLines(validatedLocal);
    }

    const remoteItems = (remoteRows ?? []).map((row) => ({
      product_id: row.product_id,
      quantity: row.quantity,
    }));

    const merged = mergeCartQuantities(validatedLocal, remoteItems);

    return replaceRemoteCartItems(merged);
  } catch (error) {
    logCartSyncWarning('mergeCartOnLogin failed', error);
    return enrichCartLines(validatedLocal);
  }
}

async function clearRemoteCartImpl(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from('carrito_items').delete().eq('user_id', user.id);
    if (error && !isCartTableUnavailable(error)) {
      logCartSyncWarning('remote cart clear failed', error);
    }
  } catch (error) {
    logCartSyncWarning('clearRemoteCart failed', error);
  }
}

/** Nunca lanza — evita errores genéricos de Server Actions en consola post-login. */
export async function getRemoteCartLines(): Promise<CartLine[]> {
  try {
    return await getRemoteCartLinesImpl();
  } catch (error) {
    logCartSyncWarning('getRemoteCartLines outer failed', error);
    return [];
  }
}

export async function syncRemoteCart(items: CartQuantityItem[]): Promise<CartLine[]> {
  try {
    return await syncRemoteCartImpl(items);
  } catch (error) {
    logCartSyncWarning('syncRemoteCart outer failed', error);
    return [];
  }
}

export async function mergeCartOnLogin(localItems: CartQuantityItem[]): Promise<CartLine[]> {
  try {
    return await mergeCartOnLoginImpl(localItems);
  } catch (error) {
    logCartSyncWarning('mergeCartOnLogin outer failed', error);
    return [];
  }
}

export async function clearRemoteCart(): Promise<void> {
  try {
    await clearRemoteCartImpl();
  } catch (error) {
    logCartSyncWarning('clearRemoteCart outer failed', error);
  }
}