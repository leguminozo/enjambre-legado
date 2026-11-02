import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { CartAbandonmentBodySchema } from '@/lib/cart/schemas';
import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/api-guard';
import { createRouteRateLimiter } from '@/lib/ratelimit-route';

const abandonmentLimiter = createRouteRateLimiter({ windowMs: 60 * 1000, maxRequests: 30 });

export async function POST(request: NextRequest) {
  const rateLimitBlock = abandonmentLimiter(request);
  if (rateLimitBlock) return rateLimitBlock;
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Permite registrar abandono para usuarios autenticados o visitantes anónimos que ingresaron correo en checkout
  const targetEmail = (user?.email ?? parsed.data.email)?.toLowerCase().trim();
  if (!targetEmail) {
    return NextResponse.json(
      { error: 'Email requerido para registrar abandono' },
      { status: 401 },
    );
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

  // Admin client para permitir inserts de visitantes anónimos de pauta/checkout
  const admin = createAdminClient();
  const db = admin ?? supabase;

  let query = db
    .from('cart_abandonment_events')
    .select('id, email_sent_at')
    .is('email_sent_at', null)
    .eq('converted', false);

  if (user?.id) {
    query = query.eq('user_id', user.id);
  } else {
    query = query.eq('email', targetEmail);
  }

  const { data: existing, error: existingError } = await query.maybeSingle();

  if (existingError) {
    console.error('[cart/abandonment] idempotency check failed:', existingError);
    return NextResponse.json({ error: 'Failed to check abandonment' }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ status: 'already_tracked' });
  }

  const { error } = await db
    .from('cart_abandonment_events')
    .insert({
      user_id: user?.id ?? null,
      email: targetEmail,
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