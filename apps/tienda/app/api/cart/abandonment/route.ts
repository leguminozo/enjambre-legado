import { createClient } from '@/utils/supabase/server';
import { CartAbandonmentBodySchema } from '@/lib/cart/schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CartAbandonmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const productIds = parsed.data.items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, precio, slug')
    .in('id', productIds);

  if (productsError) {
    console.error('[cart/abandonment] productos query failed:', productsError);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const cartItems = parsed.data.items
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) return null;
      return {
        producto_id: product.id,
        nombre: product.nombre ?? '',
        precio: product.precio ?? 0,
        slug: product.slug ?? '',
        cantidad: item.quantity,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (cartItems.length === 0) {
    return NextResponse.json({ status: 'empty_cart' });
  }

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );

  const { data: existing, error: existingError } = await supabase
    .from('cart_abandonment_events')
    .select('id, email_sent_at')
    .eq('user_id', user.id)
    .is('email_sent_at', null)
    .eq('converted', false)
    .maybeSingle();

  if (existingError) {
    console.error('[cart/abandonment] idempotency check failed:', existingError);
    return NextResponse.json({ error: 'Failed to check abandonment' }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ status: 'already_tracked' });
  }

  const { error } = await supabase
    .from('cart_abandonment_events')
    .insert({
      user_id: user.id,
      email: user.email,
      cart_items: cartItems,
      cart_total: cartTotal,
    });

  if (error) {
    console.error('[cart/abandonment] insert failed:', error);
    return NextResponse.json(
      { error: 'Failed to track abandonment' },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: 'tracked' }, { status: 201 });
}