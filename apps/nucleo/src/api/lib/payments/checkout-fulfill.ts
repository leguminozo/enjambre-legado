import type { SupabaseClient } from '@supabase/supabase-js';
import { markCartAbandonmentConverted } from '@/lib/notifications/cart-abandonment-worker';
import { notifyCheckoutConfirmed } from '@/lib/notifications/enqueue-transactional';
import type { CartLineInput, CheckoutSession, ShippingInfo } from './types';
import { completeCheckoutSession } from './types';

export type BuyerMode = 'legado' | 'privada' | 'b2b';

export interface FulfillCheckoutInput {
  buyOrder: string;
  session: CheckoutSession;
  authorizationCode: string;
  paymentProvider: string;
}

export interface FulfillCheckoutResult {
  ok: boolean;
  ventaId?: string;
  alreadyProcessed?: boolean;
  stockErrors?: string[];
}

function formatEnvioItems(cart: CartLineInput[]): string {
  return cart.map((line) => `${line.quantity}x ${line.name}`).join(', ');
}

function formatDestino(shipping: ShippingInfo | null): string {
  if (!shipping) return 'Sin dirección';
  return `${shipping.direccion}, ${shipping.comuna}, ${shipping.region}`;
}

export async function fulfillCheckout(
  admin: SupabaseClient,
  input: FulfillCheckoutInput,
): Promise<FulfillCheckoutResult> {
  const { buyOrder, session, authorizationCode, paymentProvider } = input;
  const { cart, total: serverTotal, shipping } = session;
  const buyerMode = session.buyerMode ?? 'legado';
  const isGuest = buyerMode === 'privada';
  const authUserId = isGuest ? null : session.clienteId ?? null;

  let ventaClienteId: string | null = null;
  if (authUserId) {
    const { data: clienteRow } = await admin
      .from('clientes')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    ventaClienteId = (clienteRow?.id as string | undefined) ?? null;
  }

  const { data: existingVenta } = await admin
    .from('ventas')
    .select('id')
    .eq('buy_order', buyOrder)
    .maybeSingle();

  if (existingVenta) {
    return { ok: true, alreadyProcessed: true, ventaId: existingVenta.id as string };
  }

  const stockErrors: string[] = [];
  const enrichedCart = [];

  for (const line of cart) {
    const qty = Math.max(0, Number(line.quantity || 0));
    if (!qty) {
      enrichedCart.push(line);
      continue;
    }

    const { data: decremented, error: rpcErr } = await admin.rpc('decrement_stock', {
      p_id: line.productId,
      p_qty: qty,
    });

    if (rpcErr || !decremented || (decremented as any[]).length === 0) {
      stockErrors.push(`Producto ${line.productId}: stock insuficiente o error al descontar`);
      enrichedCart.push(line);
    } else {
      const stockData = decremented as any[];
      enrichedCart.push({
        ...line,
        traceability_hash: stockData[0]?.traceability_hash || null,
        lote_id: stockData[0]?.lote_id || null,
      });
    }
  }

  if (stockErrors.length > 0) {
    console.error('[checkout-fulfill] stock errors:', stockErrors);
  }

  const { data: venta, error: ventaError } = await admin
    .from('ventas')
    .insert({
      origen: 'web',
      estado: 'paid',
      total: serverTotal,
      productos: enrichedCart,
      channel: 'web',
      metodo_pago: paymentProvider,
      buy_order: buyOrder,
      auth_code: authorizationCode,
      buyer_email: shipping?.email ?? null,
      direccion_envio: shipping ?? null,
      user_id: authUserId,
      cliente_id: ventaClienteId,
      buyer_mode: buyerMode,
      is_guest: isGuest,
      organizacion_id: session.organizacionId ?? null,
    })
    .select('id')
    .single();

  if (ventaError || !venta) {
    console.error('[checkout-fulfill] venta insert error:', ventaError?.message);
    return { ok: false };
  }

  const ventaId = venta.id as string;

  const trackingCode = `OYZ-${buyOrder.replace(/^ORD-/, '').slice(0, 8).toUpperCase()}`;
  const { data: defaultEmpresa } = await admin.from('empresas').select('id').limit(1).maybeSingle();

  const { error: envioError } = await admin.from('logistica_envios').insert({
    venta_id: ventaId,
    empresa_id: defaultEmpresa?.id ?? null,
    user_id: authUserId,
    tracking_code: trackingCode,
    destino: formatDestino(shipping),
    items: formatEnvioItems(cart),
    status: 'pendiente',
    via: null,
    eta: null,
  });

  if (envioError) {
    console.error('[checkout-fulfill] logistica_envios insert error:', envioError.message);
  }

  if (!isGuest && authUserId && shipping) {
    const { data: existingAddr } = await admin
      .from('cliente_direcciones')
      .select('id')
      .eq('user_id', authUserId)
      .eq('es_predeterminada', true)
      .maybeSingle();

    if (!existingAddr) {
      const { error: addrError } = await admin.from('cliente_direcciones').insert({
        user_id: authUserId,
        etiqueta: 'Principal',
        nombre: shipping.nombre,
        telefono: shipping.telefono,
        direccion: shipping.direccion,
        comuna: shipping.comuna,
        ciudad: shipping.ciudad,
        region: shipping.region,
        codigo_postal: shipping.codigoPostal ?? null,
        pais: 'CL',
        instrucciones: shipping.instrucciones ?? null,
        es_predeterminada: true,
      });
      if (addrError) {
        console.error('[checkout-fulfill] cliente_direcciones insert error:', addrError.message);
      }
    }
  }

  await completeCheckoutSession(buyOrder);

  const montoNeto = Math.round(serverTotal / 1.19);
  const montoIva = serverTotal - montoNeto;

  if (defaultEmpresa) {
    await admin.from('facturas_emitidas').insert({
      empresa_id: defaultEmpresa.id,
      numero: `BWEB-${buyOrder}`,
      fecha_emision: new Date().toISOString().split('T')[0],
      monto_neto: montoNeto,
      monto_iva: montoIva,
      monto_total: serverTotal,
      monto_exento: 0,
      monto_iva_usado: 0,
      tipo_documento: 'Boleta',
      descripcion: `Venta Web - ${buyOrder}`,
      estado: 'pendiente',
    });
  }

  if (authUserId) {
    await markCartAbandonmentConverted(admin, authUserId);
  }

  const recipientEmail = shipping?.email ?? null;
  if (recipientEmail || authUserId) {
    try {
      await notifyCheckoutConfirmed(admin, {
        buyOrder,
        ventaId,
        total: serverTotal,
        trackingCode,
        email: recipientEmail,
        userId: authUserId,
        empresaId: defaultEmpresa?.id ?? null,
      });
    } catch (notifErr) {
      console.error('[checkout-fulfill] post-pago notification failed:', notifErr);
    }
  }

  return { ok: true, ventaId, stockErrors: stockErrors.length > 0 ? stockErrors : undefined };
}
