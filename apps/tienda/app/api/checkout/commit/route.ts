import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { getPaymentProvider, getCheckoutSession, deleteCheckoutSession } from '@/lib/payments';
import { z } from 'zod';

const CommitBodySchema = z.object({
  token_ws: z.string().min(1),
  buyOrder: z.string().min(1).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = CommitBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { token_ws, buyOrder: clientBuyOrder, provider: clientProvider } = parsed.data;

    const provider = getPaymentProvider();
    const result = await provider.commit(token_ws);

    if (!result.authorized) {
      return NextResponse.json({ ok: false, authorized: false, result: result.raw }, { status: 200 });
    }

    const buyOrder = clientBuyOrder || result.buyOrder;
    const session = buyOrder ? getCheckoutSession(buyOrder) : undefined;

    if (!session) {
      console.error(`Checkout session not found for buyOrder: ${buyOrder}. Payment authorized but order not persisted.`);
      return NextResponse.json(
        {
          ok: false,
          authorized: true,
          error: 'Sesión de checkout expirada. Contacta soporte con orden ' + buyOrder,
          buyOrder,
        },
        { status: 200 },
      );
    }

    const serverTotal = session.total;
    const cart = session.cart;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const clienteId = user?.id ?? null;

    const admin = createAdminClient();

    const { error: ventaError } = await admin.from('ventas').insert({
      origen: 'web',
      estado: 'pagado',
      total: serverTotal,
      items: cart,
      metodo_pago: session.provider,
      buy_order: buyOrder,
      auth_code: result.authorizationCode,
      cliente_id: clienteId,
      buyer_email: session.shipping?.email ?? null,
      direccion_envio: session.shipping ?? null,
    });

    if (ventaError) {
      console.error('Error persistiendo venta (pago autorizado):', ventaError.message);
    }

    const stockErrors: string[] = [];
    for (const line of cart) {
      const qty = Math.max(0, Number(line.quantity || 0));
      if (!qty) continue;

      const { data: decremented, error: rpcErr } = await admin.rpc('decrement_stock', {
        p_id: line.productId,
        p_qty: qty,
      });

      if (rpcErr || !decremented || (decremented as unknown[]).length === 0) {
        stockErrors.push(`Producto ${line.productId}: stock insuficiente o error al descontar`);
      }
    }

    if (stockErrors.length > 0) {
      console.error('Stock update errors (pago autorizado):', stockErrors);
    }

    deleteCheckoutSession(buyOrder);

    return NextResponse.json({
      ok: true,
      authorized: true,
      buyOrder,
      total: serverTotal,
      cart,
      result: result.raw,
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
