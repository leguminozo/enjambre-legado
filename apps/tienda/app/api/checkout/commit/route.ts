import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

type CommitBody = {
  token_ws: string;
  cart?: Array<{
    productId: string;
    slug: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }>;
  total?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CommitBody;
    if (!body?.token_ws) {
      return NextResponse.json({ error: 'Falta token_ws' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebpayPlus } = require('transbank-sdk');
    const tx = new WebpayPlus.Transaction();
    const result = await tx.commit(body.token_ws);

    const authorized = result?.status === 'AUTHORIZED';
    if (!authorized) {
      return NextResponse.json({ ok: false, authorized: false, result }, { status: 200 });
    }

    const total = Math.max(0, Math.round(Number(body.total || 0)));
    const cart = Array.isArray(body.cart) ? body.cart : [];

    // Persiste venta + descuenta stock si está disponible el service role.
    try {
      const admin = createAdminClient();

      await admin.from('ventas').insert({
        origen: 'web',
        estado: 'pagado',
        total,
        items: cart,
        metodo_pago: 'transbank',
      });

      for (const line of cart) {
        const qty = Math.max(0, Number(line.quantity || 0));
        if (!qty) continue;
        const { data: current } = await admin
          .from('productos')
          .select('id, stock')
          .eq('id', line.productId)
          .maybeSingle();
        if (!current || current.stock == null) continue;
        const nextStock = Math.max(0, Number(current.stock) - qty);
        await admin.from('productos').update({ stock: nextStock }).eq('id', line.productId);
      }
    } catch {
      // Si falta service role, no rompemos la confirmación de pago.
    }

    return NextResponse.json({ ok: true, authorized: true, result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

