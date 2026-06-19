import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { friendlySupabaseError } from '@enjambre/ui';

type ItemRow = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
};

type DecrementedEntry = {
  productId: string;
  quantity: number;
};

async function restoreStock(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  entries: DecrementedEntry[],
) {
  for (const entry of entries) {
    const { data: product } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', entry.productId)
      .maybeSingle();

    if (!product || product.stock == null) continue;

    await supabase
      .from('productos')
      .update({ stock: product.stock + entry.quantity })
      .eq('id', entry.productId);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'El sistema no está configurado' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión para registrar ventas' }, { status: 401 });
  }

  let body: {
    origen?: string;
    total?: number;
    items?: ItemRow[];
    metodo_pago?: string;
    estado?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch (error) {
    console.error('[pos/venta] JSON parse error:', error);
    return NextResponse.json({ error: 'Los datos enviados no son válidos' }, { status: 400 });
  }

  if (body.origen !== 'feria' && body.origen !== 'local') {
    return NextResponse.json({ error: 'El origen debe ser feria o local' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: 'No hay productos en la venta' }, { status: 400 });
  }

  const total = Math.max(0, Math.round(Number(body.total ?? 0)));
  if (total <= 0) {
    return NextResponse.json({ error: 'El total de la venta no es válido' }, { status: 400 });
  }

  const activeItems = items.filter((item) => Math.max(0, Number(item.cantidad || 0)) > 0);
  const productIds = activeItems.map((item) => item.producto_id);
  const { data: products, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, stock, visible')
    .in('id', productIds);

  if (productsError) {
    return NextResponse.json({ error: friendlySupabaseError(productsError) }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  const stockErrors: string[] = [];

  for (const item of activeItems) {
    const qty = Math.max(0, Number(item.cantidad || 0));
    const product = productMap.get(item.producto_id);
    if (!product) {
      stockErrors.push(`Producto ${item.nombre || item.producto_id}: no encontrado`);
      continue;
    }
    if (product.visible === false) {
      stockErrors.push(`Producto ${product.nombre ?? item.producto_id}: no disponible`);
      continue;
    }
    if (product.stock != null && product.stock < qty) {
      stockErrors.push(
        `Producto ${product.nombre ?? item.producto_id}: stock insuficiente (${product.stock} disponible)`,
      );
    }
  }

  if (stockErrors.length > 0) {
    return NextResponse.json({ error: stockErrors.join('; ') }, { status: 409 });
  }

  const decremented: DecrementedEntry[] = [];
  const enrichedItems = [];

  for (const item of items) {
    const qty = Math.max(0, Number(item.cantidad || 0));
    if (!qty) {
      enrichedItems.push(item);
      continue;
    }

    const { data: decrementedRows, error: rpcErr } = await supabase.rpc('decrement_stock', {
      p_id: item.producto_id,
      p_qty: qty,
    });

    if (rpcErr || !decrementedRows || (decrementedRows as unknown[]).length === 0) {
      await restoreStock(supabase, decremented);
      return NextResponse.json(
        {
          error: `Producto ${item.nombre || item.producto_id}: stock insuficiente o error al descontar`,
        },
        { status: 409 },
      );
    }

    const stockData = decrementedRows as Array<{
      traceability_hash?: string | null;
      lote_id?: string | null;
    }>;

    decremented.push({ productId: item.producto_id, quantity: qty });
    enrichedItems.push({
      ...item,
      traceability_hash: stockData[0]?.traceability_hash ?? null,
      lote_id: stockData[0]?.lote_id ?? null,
    });
  }

  const payload = {
    vendedor_id: user.id,
    origen: body.origen,
    estado: body.estado ?? 'confirmado',
    total,
    items: enrichedItems as unknown as Record<string, unknown>,
    metodo_pago: body.metodo_pago ?? 'efectivo',
  };

  const { data, error } = await supabase.from('ventas').insert(payload).select('id, claim_token').single();

  if (error) {
    await restoreStock(supabase, decremented);
    return NextResponse.json({ error: friendlySupabaseError(error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data?.id, claim_token: data?.claim_token });
}