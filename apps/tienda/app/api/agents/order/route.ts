import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AgentOrderSchema = z.object({
  product_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  shipping: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    region: z.string(),
    phone: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Agent unauthorized. Delegated auth required.' },
      { status: 401 },
    );
  }

  const delegation = request.headers.get('x-agent-delegation');
  if (!delegation) {
    return NextResponse.json(
      { error: 'Missing agent delegation header' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = AgentOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid order data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { product_slug, quantity, shipping } = parsed.data;

  const { data: product, error: productError } = await supabase
    .from('productos')
    .select('id, nombre, slug, precio, stock')
    .eq('slug', product_slug)
    .eq('visible', true)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json(
      { error: 'Product not found', slug: product_slug },
      { status: 404 },
    );
  }

  if (product.stock != null && product.stock < quantity) {
    return NextResponse.json(
      {
        error: 'Insufficient stock',
        available: product.stock,
        requested: quantity,
      },
      { status: 409 },
    );
  }

  const total = (product.precio ?? 0) * quantity;

  const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com'}/checkout?product=${product_slug}&qty=${quantity}`;

  return NextResponse.json({
    status: 'checkout_required',
    message:
      'Order validated. User confirmation required at checkout to complete payment.',
    product: {
      name: product.nombre,
      slug: product.slug,
      price: product.precio,
      quantity,
      total,
    },
    shipping,
    checkout_url: checkoutUrl,
  });
}
