import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getCheckoutSession, completeCheckoutSession } from '@/lib/payments';

async function verifyFlowSignature(params: Record<string, string>): Promise<boolean> {
  const signature = params.s;
  if (!signature) return false;

  const sorted = Object.keys(params)
    .filter((k) => k !== 's')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const secret = process.env.FLOW_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json() as Record<string, string>;

    const isValid = await verifyFlowSignature(raw);
    if (!isValid) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 403 });
    }

    const status = Number(raw.status);
    const FLOW_PAID = 2;

    if (status !== FLOW_PAID) {
      return NextResponse.json({ ok: true, status: 'ignored', message: `Estado Flow: ${status}` }, { status: 200 });
    }

    const buyOrder = raw.commerceOrder;
    if (!buyOrder) {
      return NextResponse.json({ error: 'Falta commerceOrder' }, { status: 400 });
    }

    const session = await getCheckoutSession(buyOrder);
    if (!session) {
      console.error(`Flow webhook: session not found for buyOrder ${buyOrder}`);
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (session.provider !== 'flow') {
      return NextResponse.json({ error: 'Provider mismatch' }, { status: 400 });
    }

    const serverTotal = session.total;
    const cart = session.cart;
    const flowAmount = Number(raw.amount ?? 0);

    if (flowAmount > 0 && Math.round(flowAmount) !== serverTotal) {
      console.error(`Flow webhook: amount mismatch. Expected ${serverTotal}, got ${flowAmount}`);
      return NextResponse.json({ error: 'Monto no coincide' }, { status: 409 });
    }

    const admin = createAdminClient();

    const { error: ventaError } = await admin.from('ventas').insert({
      origen: 'web',
      estado: 'pagado',
      total: serverTotal,
      items: cart,
      metodo_pago: 'flow',
      buy_order: buyOrder,
      auth_code: raw.flowOrder ?? '',
      buyer_email: session.shipping?.email ?? null,
      direccion_envio: session.shipping ?? null,
    });

    if (ventaError) {
      console.error('Flow webhook: error persistiendo venta:', ventaError.message);
      return NextResponse.json({ error: 'Error guardando venta' }, { status: 500 });
    }

    for (const line of cart) {
      const qty = Math.max(0, Number(line.quantity || 0));
      if (!qty) continue;

      await admin.rpc('decrement_stock', { p_id: line.productId, p_qty: qty });
    }

    await completeCheckoutSession(buyOrder);

    return NextResponse.json({ ok: true, status: 'confirmed' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    console.error('Flow webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const isValid = await verifyFlowSignature(params);
    if (!isValid) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
      );
    }

    const status = Number(params.status);
    const FLOW_PAID = 2;

    if (status !== FLOW_PAID) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
      );
    }

    const buyOrder = params.commerceOrder;
    const token = params.token || '';

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?token_ws=${token}&buyOrder=${buyOrder}&provider=flow`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando retorno';
    console.error('Flow return error:', message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado?status=failed`
    );
  }
}
