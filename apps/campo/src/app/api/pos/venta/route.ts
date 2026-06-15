import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { friendlySupabaseError, friendlyApiError } from '@enjambre/ui';

type ItemRow = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
};

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

  // Descontar stock y capturar trazabilidad antes de insertar la venta
  const stockErrors: string[] = [];
  const enrichedItems = [];
  for (const item of items) {
    const qty = Math.max(0, Number(item.cantidad || 0));
    if (!qty) {
      enrichedItems.push(item);
      continue;
    }

    const { data: decremented, error: rpcErr } = await supabase.rpc('decrement_stock', {
      p_id: item.producto_id,
      p_qty: qty,
    });

    if (rpcErr || !decremented || (decremented as any[]).length === 0) {
      stockErrors.push(`Producto ${item.producto_id}: stock insuficiente o error`);
      enrichedItems.push(item);
    } else {
      const stockData = decremented as any[];
      const hash = stockData[0]?.traceability_hash || null;
      const lote_id = stockData[0]?.lote_id || null;
      enrichedItems.push({
        ...item,
        traceability_hash: hash,
        lote_id: lote_id
      });
    }
  }

  if (stockErrors.length > 0) {
    console.error('[pos/venta] stock errors:', stockErrors);
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
		return NextResponse.json({ error: friendlySupabaseError(error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data?.id, claim_token: data?.claim_token });
}

