import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: items } = await supabase
    .from('carrito_items')
    .select('producto_id, cantidad, productos(id, nombre, precio, slug, fotos)')
    .eq('user_id', user.id);

  if (!items || items.length === 0) {
    return NextResponse.json({ status: 'empty_cart' });
  }

  const cartItems = items.map((item) => {
    const producto = Array.isArray(item.productos) && item.productos.length > 0
      ? item.productos[0]
      : null;
    return {
      producto_id: item.producto_id,
      nombre: producto?.nombre ?? '',
      precio: producto?.precio ?? 0,
      slug: producto?.slug ?? '',
      cantidad: item.cantidad,
    };
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );

  const { data: existing } = await supabase
    .from('cart_abandonment_events')
    .select('id, email_sent_at')
    .eq('user_id', user.id)
    .is('email_sent_at', null)
    .eq('converted', false)
    .maybeSingle();

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
    return NextResponse.json(
      { error: 'Failed to track abandonment' },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: 'tracked' }, { status: 201 });
}
