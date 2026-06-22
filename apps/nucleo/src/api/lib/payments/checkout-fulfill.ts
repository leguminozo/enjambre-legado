import type { SupabaseClient } from '@supabase/supabase-js';
import { decrementCartStock } from '@/api/lib/stock/cart-stock';
import { markCartAbandonmentConverted } from '@/lib/notifications/cart-abandonment-worker';
import { notifyCheckoutConfirmed } from '@/lib/notifications/enqueue-transactional';
import { maybeEmitBoletaPostCheckout } from '@/lib/fiscal/checkout-dte';
import {
  buildCourierTrackingUrl,
  getCourierLabel,
  resolveCourierCode,
} from '@enjambre/logistica';
import { applyCheckoutLoyalty } from './loyalty-fulfill';
import { applyGuardianStamps, enqueueWalletPassUpdate } from '@/api/lib/wallet/stamp-fulfill';
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
  dte?: {
    folio?: number;
    trackId?: string;
    estadoSii?: string;
    skipped?: boolean;
    error?: string;
  };
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

  const stockResult = await decrementCartStock(
    admin,
    cart.map((line) => ({
      ...line,
      productId: line.productId,
      quantity: line.quantity,
      name: line.name,
    })),
  );

  if (!stockResult.ok) {
    console.error('[checkout-fulfill] stock gate failed:', stockResult.errors);
    return { ok: false, stockErrors: stockResult.errors };
  }

  const enrichedCart = stockResult.enrichedLines;

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
  const courierCode = resolveCourierCode(session.courierCode);
  const courierLabel = getCourierLabel(courierCode);
  const courierTrackingUrl = buildCourierTrackingUrl(courierCode, trackingCode);
  const shippingCost = session.shippingCost ?? 0;

  const { error: envioError } = await admin.from('logistica_envios').insert({
    venta_id: ventaId,
    empresa_id: defaultEmpresa?.id ?? null,
    user_id: authUserId,
    tracking_code: trackingCode,
    destino: formatDestino(shipping),
    items: formatEnvioItems(cart),
    status: 'pendiente',
    via: courierLabel,
    courier_code: courierCode,
    courier_tracking_url: courierTrackingUrl,
    shipping_cost: shippingCost,
    eta: null,
  });

  if (envioError) {
    console.error('[checkout-fulfill] logistica_envios insert error:', envioError.message);
  }

  if (!isGuest && authUserId && defaultEmpresa?.id) {
    const loyaltyResult = await applyCheckoutLoyalty(admin, {
      buyOrder,
      ventaId,
      userId: authUserId,
      empresaId: defaultEmpresa.id as string,
      paidTotalClp: serverTotal,
      pointsRedeemed: session.loyaltyPointsRedeemed ?? 0,
    });
    if (!loyaltyResult.ok) {
      console.error('[checkout-fulfill] loyalty apply failed:', loyaltyResult.error);
      return { ok: false, stockErrors: [`Loyalty: ${loyaltyResult.error ?? 'unknown'}`] };
    }

    const stampResult = await applyGuardianStamps(admin, {
      userId: authUserId,
      ventaId,
      channel: 'web',
      lines: enrichedCart,
    });
    if (!stampResult.ok) {
      console.error('[checkout-fulfill] stamp apply failed:', stampResult.error);
    } else {
      await enqueueWalletPassUpdate(admin, authUserId);
    }
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

  if (session.discountId) {
    const { error: discountUseError } = await admin.rpc('incrementar_usos_descuento', {
      p_descuento_id: session.discountId,
    });
    if (discountUseError) {
      console.error('[checkout-fulfill] incrementar_usos_descuento failed:', discountUseError.message);
    }
  }

  await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
  await completeCheckoutSession(buyOrder);

  const montoNeto = Math.round(serverTotal / 1.19);
  const montoIva = serverTotal - montoNeto;

  let facturaEmitidaId: string | null = null;
  const fechaEmision = new Date().toISOString().split('T')[0]!;

  if (defaultEmpresa) {
    const { data: facturaRow, error: facturaError } = await admin
      .from('facturas_emitidas')
      .insert({
        empresa_id: defaultEmpresa.id,
        numero: `BWEB-${buyOrder}`,
        fecha_emision: fechaEmision,
        monto_neto: montoNeto,
        monto_iva: montoIva,
        monto_total: serverTotal,
        monto_exento: 0,
        monto_iva_usado: 0,
        tipo_documento: 'Boleta',
        tipo_dte: 39,
        descripcion: `Venta Web - ${buyOrder}`,
        estado: 'pendiente',
        estado_sii: 'pendiente',
        idempotency_key: `venta:${ventaId}`,
      })
      .select('id')
      .single();

    if (facturaError) {
      console.error('[checkout-fulfill] facturas_emitidas insert error:', facturaError.message);
    } else {
      facturaEmitidaId = (facturaRow?.id as string | undefined) ?? null;
    }
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

  let dteResult: FulfillCheckoutResult['dte'];

  if (defaultEmpresa?.id && facturaEmitidaId) {
    const emission = await maybeEmitBoletaPostCheckout(admin, {
      empresaId: defaultEmpresa.id,
      facturaEmitidaId,
      ventaId,
      buyOrder,
      receptorNombre: shipping?.nombre ?? 'Consumidor Final',
      cart: enrichedCart,
      fechaEmision,
    });

    if (emission.skipped) {
      dteResult = { skipped: true };
    } else if (emission.ok) {
      dteResult = {
        folio: emission.folio,
        trackId: emission.trackId,
        estadoSii: emission.estadoSii,
      };
    } else {
      dteResult = { error: emission.message };
    }
  }

  return { ok: true, ventaId, dte: dteResult };
}