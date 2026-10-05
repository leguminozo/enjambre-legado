import type { SupabaseClient } from '@supabase/supabase-js';
import { decrementCartStock } from '@/api/lib/stock/cart-stock';
import { rpcLoose } from '@/api/lib/supabase-loose';
import { markCartAbandonmentConverted } from '@/lib/notifications/cart-abandonment-worker';
import { notifyCheckoutConfirmed, notifyReviewInvitation } from '@/lib/notifications/enqueue-transactional';
import { maybeEmitBoletaPostCheckout, maybeEmitFacturaPostCheckout } from '@/lib/fiscal/checkout-dte';
import {
  buildCourierTrackingUrl,
  getCourierLabel,
  resolveCourierCode,
} from '@enjambre/logistica';
import { applyCheckoutLoyalty } from './loyalty-fulfill';
import { applyGuardianStamps, enqueueWalletPassUpdate } from '@/api/lib/wallet/stamp-fulfill';
import { revalidateTiendaLayout } from '@/lib/revalidate-tienda';
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

function formatEnvioItems(cart: CartLineInput[], retornoFrascos?: number): string {
  const base = cart.map((line) => `${line.quantity}x ${line.name}`).join(', ');
  if (retornoFrascos && retornoFrascos > 0) {
    return `${base} [Retorno Circular: ${retornoFrascos} frasco(s) de vidrio limpios]`;
  }
  return base;
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
    // Heal lag: venta exists but session may still be pending / holds open
    try {
      await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
    } catch (err) {
      console.warn('[checkout-fulfill] release holds on alreadyProcessed:', err);
    }
    try {
      await completeCheckoutSession(buyOrder);
    } catch (err) {
      console.warn('[checkout-fulfill] complete session on alreadyProcessed:', err);
    }
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
      retorno_frascos_declarados: session.retornoFrascosDeclarados ?? 0,
      retorno_frascos_estado: (session.retornoFrascosDeclarados && session.retornoFrascosDeclarados > 0)
        ? 'pendiente_retiro'
        : 'ninguno',
    })
    .select('id')
    .single();

  if (ventaError || !venta) {
    // Idempotencia segura ante carreras de webhook y redirect simultáneo
    if (
      ventaError?.code === '23505' ||
      ventaError?.message?.includes('duplicate key') ||
      ventaError?.message?.includes('idx_ventas_buy_order')
    ) {
      const { data: raceVenta } = await admin
        .from('ventas')
        .select('id')
        .eq('buy_order', buyOrder)
        .maybeSingle();

      if (raceVenta) {
        try {
          await admin.rpc('release_checkout_stock', { p_buy_order: buyOrder });
        } catch {
          /* ignore */
        }
        try {
          await completeCheckoutSession(buyOrder);
        } catch {
          /* ignore */
        }
        return { ok: true, alreadyProcessed: true, ventaId: raceVenta.id as string };
      }
    }

    console.error('[checkout-fulfill] venta insert error:', ventaError?.message);
    return { ok: false };
  }

  const ventaId = venta.id as string;

  // Código de creador: registra uso + comisión (el descuento ya se aplicó en init).
  // Fire-and-forget con try/catch: un fallo aquí nunca bloquea el fulfill del pedido.
  if (session.codigoCreador) {
    try {
      const { data: applyResult } = await rpcLoose(admin, 'aplicar_codigo_creador_admin', {
        p_codigo: session.codigoCreador,
        p_venta_id: ventaId,
        p_cliente_id: ventaClienteId ?? null,
        p_monto_venta: serverTotal,
      });
      const applied = Array.isArray(applyResult) ? (applyResult[0] as { valido?: boolean; creador_nombre?: string; comision?: number } | undefined) : undefined;
      if (applied?.valido) {
        console.info(
          `[checkout-fulfill] creador ${applied.creador_nombre} comisión $${applied.comision} (${buyOrder})`,
        );
      } else {
        console.warn(
          `[checkout-fulfill] código de creador no aplicado: ${applied?.creador_nombre ?? 'inválido o inactivo'} (${buyOrder})`,
        );
      }
    } catch (err) {
      console.warn('[checkout-fulfill] creador code apply failed:', err);
    }
  }

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
    items: formatEnvioItems(cart, session.retornoFrascosDeclarados),
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
    try {
      const loyaltyResult = await applyCheckoutLoyalty(admin, {
        buyOrder,
        ventaId,
        userId: authUserId,
        empresaId: defaultEmpresa.id as string,
        paidTotalClp: serverTotal,
        pointsRedeemed: session.loyaltyPointsRedeemed ?? 0,
        userRole: buyerMode === 'b2b' ? 'revendedor' : 'comprador',
      });
      if (!loyaltyResult.ok) {
        console.warn(
          '[checkout-fulfill] loyalty apply warning (no bloquea fulfill de venta ya capturada):',
          loyaltyResult.error,
        );
      }
    } catch (loyaltyErr) {
      console.warn('[checkout-fulfill] loyalty apply unexpected error:', loyaltyErr);
    }

    try {
      const stampResult = await applyGuardianStamps(admin, {
        userId: authUserId,
        ventaId,
        channel: 'web',
        lines: enrichedCart,
      });
      if (!stampResult.ok) {
        console.warn('[checkout-fulfill] stamp apply failed:', stampResult.error);
      } else {
        await enqueueWalletPassUpdate(admin, authUserId);
      }
    } catch (stampErr) {
      console.warn('[checkout-fulfill] stamp apply unexpected error:', stampErr);
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

  // El stock de la tienda bajó con la venta: invalidar ISR del catálogo.
  // Fail-open: una falla aquí nunca revierte el pago.
  await revalidateTiendaLayout().catch(() => undefined);

  const montoNeto = Math.round(serverTotal / 1.19);
  const montoIva = serverTotal - montoNeto;

  const isFactura = session.billing?.tipoDte === 'factura' && Boolean(session.billing?.rut);
  let terceroId: string | null = null;

  if (isFactura && defaultEmpresa && session.billing?.rut) {
    const rutClean = session.billing.rut.replace(/[^0-9kK]/g, '').toUpperCase();
    const { data: existingTercero } = await admin
      .from('terceros')
      .select('id')
      .eq('empresa_id', defaultEmpresa.id)
      .eq('rut', rutClean)
      .maybeSingle();

    if (existingTercero) {
      terceroId = existingTercero.id as string;
    } else {
      const { data: newTercero, error: newTerceroErr } = await admin
        .from('terceros')
        .insert({
          empresa_id: defaultEmpresa.id,
          rut: rutClean,
          nombre: session.billing.razonSocial || shipping?.nombre || 'Empresa B2B',
          giro: session.billing.giro || 'Comercio',
          direccion: session.billing.direccion || shipping?.direccion || null,
          email: shipping?.email || null,
          telefono: shipping?.telefono || null,
        })
        .select('id')
        .single();

      if (!newTerceroErr && newTercero) {
        terceroId = newTercero.id as string;
      }
    }
  }

  let facturaEmitidaId: string | null = null;
  const fechaEmision = new Date().toISOString().split('T')[0]!;

  const tipoDoc = isFactura ? 'Factura' : 'Boleta';
  const tipoDte = isFactura ? 33 : 39;
  const docPrefix = isFactura ? 'FWEB' : 'BWEB';

  if (defaultEmpresa) {
    const { data: facturaRow, error: facturaError } = await admin
      .from('facturas_emitidas')
      .insert({
        empresa_id: defaultEmpresa.id,
        tercero_id: terceroId,
        numero: `${docPrefix}-${buyOrder}`,
        fecha_emision: fechaEmision,
        monto_neto: montoNeto,
        monto_iva: montoIva,
        monto_total: serverTotal,
        monto_exento: 0,
        monto_iva_usado: 0,
        tipo_documento: tipoDoc,
        tipo_dte: tipoDte,
        descripcion: isFactura ? `Factura Venta Web B2B - ${buyOrder}` : `Venta Web - ${buyOrder}`,
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

    try {
      const productIds = enrichedCart
        .map((line) => {
          const p = line as { productId?: string; producto_id?: string };
          return p.productId ?? p.producto_id ?? '';
        })
        .filter(Boolean);
      if (productIds.length > 0) {
        await notifyReviewInvitation(admin, {
          ventaId,
          email: recipientEmail,
          userId: authUserId,
          productIds,
        });
      }
    } catch (reviewErr) {
      console.error('[checkout-fulfill] review invitation enqueue failed:', reviewErr);
    }
  }

  let dteResult: FulfillCheckoutResult['dte'];

  if (defaultEmpresa?.id && facturaEmitidaId) {
    const emission = isFactura
      ? await maybeEmitFacturaPostCheckout(admin, {
          empresaId: defaultEmpresa.id,
          facturaEmitidaId,
          ventaId,
          buyOrder,
          terceroRut: session.billing?.rut ?? '',
          terceroNombre: session.billing?.razonSocial ?? shipping?.nombre ?? 'Empresa B2B',
          terceroGiro: session.billing?.giro,
          terceroDireccion: session.billing?.direccion,
          cart: enrichedCart,
          fechaEmision,
        })
      : await maybeEmitBoletaPostCheckout(admin, {
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