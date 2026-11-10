import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';
import { createAdminClient } from '@enjambre/auth/server-index';
import { settleCheckout } from '@/api/lib/payments/settle-checkout';
import { getCheckoutSessionByBuyOrder } from '@/api/lib/payments/types';
import {
  DEFAULT_COURIER,
  getCourierLabel,
  buildCourierTrackingUrl,
  resolveCourierCode,
} from '@enjambre/logistica';
import { notifyShipmentDispatched } from '@/lib/notifications/enqueue-transactional';

export const pedidosRoutes = new Hono<{ Variables: AppVariables }>();

pedidosRoutes.use('*', authMiddleware);
pedidosRoutes.use('*', requireProfileRole('admin'));

const ConciliarPedidoSchema = z.object({
  authorizationCode: z.string().optional(),
  flowOrder: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(500).optional(),
});

const DespachoPedidoSchema = z.object({
  status: z.enum(['pendiente', 'empaquetado', 'en_transito', 'entregado', 'fallido']),
  courier_code: z.string().max(40).optional(),
  tracking_code: z.string().max(120).optional(),
  courier_tracking_url: z.string().url().optional().or(z.literal('')),
  eta: z.string().max(80).nullable().optional(),
  notificarCliente: z.boolean().optional().default(false),
});

const RetornoFrascosSchema = z.object({
  status: z.enum([
    'ninguno',
    'pendiente_retiro',
    'recibido_conforme',
    'rechazado',
    'recibido_en_taller',
    'higienizado',
    'cancelado',
  ]),
  notes: z.string().max(500).optional(),
});

/** Normaliza ventas.productos (Json) al formato estándar de líneas del pedido */
function parseOrderProducts(productos: unknown): Array<{
  productId?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  slug?: string;
}> {
  if (!Array.isArray(productos)) return [];
  return productos.flatMap((linea) => {
    if (typeof linea !== 'object' || linea === null || Array.isArray(linea)) return [];
    const l = linea as Record<string, unknown>;
    const quantity = Number(l.cantidad ?? l.quantity ?? 0);
    const name = String(l.nombre ?? l.name ?? 'Producto');
    const unitPrice = typeof l.unitPrice === 'number' ? l.unitPrice : (typeof l.precio === 'number' ? l.precio : undefined);
    const productId = typeof l.productId === 'string' ? l.productId : (typeof l.producto_id === 'string' ? l.producto_id : undefined);
    const slug = typeof l.slug === 'string' ? l.slug : undefined;
    if (quantity <= 0) return [];
    return [{ productId, name, quantity, unitPrice, slug }];
  });
}

/** Extrae y normaliza la atribución de tráfico (Instagram, Google, orgánico, embajador, pauta) */
export function parseAtribucion(
  shippingObj: Record<string, unknown>,
  codigoCreador?: string | null,
) {
  const utm = (typeof shippingObj.utm === 'object' && shippingObj.utm !== null)
    ? (shippingObj.utm as Record<string, unknown>)
    : {};

  const source = typeof utm.source === 'string' ? utm.source.toLowerCase().trim() : undefined;
  const medium = typeof utm.medium === 'string' ? utm.medium.toLowerCase().trim() : undefined;
  const campaign = typeof utm.campaign === 'string' ? utm.campaign.trim() : undefined;
  const term = typeof utm.term === 'string' ? utm.term.trim() : undefined;
  const content = typeof utm.content === 'string' ? utm.content.trim() : undefined;
  const fbclid = typeof utm.fbclid === 'string' && utm.fbclid.trim() ? utm.fbclid.trim() : undefined;
  const gclid = typeof utm.gclid === 'string' && utm.gclid.trim() ? utm.gclid.trim() : undefined;

  let canal = 'Orgánico / Directo';
  let canalKey: 'instagram' | 'facebook' | 'google' | 'whatsapp' | 'email' | 'creador' | 'organico' = 'organico';

  if (codigoCreador) {
    canal = `Embajador (@${codigoCreador})`;
    canalKey = 'creador';
  } else if (source?.includes('instagram') || medium?.includes('instagram') || (fbclid && !source?.includes('facebook'))) {
    canal = 'Instagram';
    canalKey = 'instagram';
  } else if (source?.includes('facebook') || medium?.includes('facebook') || fbclid) {
    canal = 'Facebook / Meta';
    canalKey = 'facebook';
  } else if (source?.includes('google') || medium?.includes('cpc') || gclid) {
    canal = gclid ? 'Google Ads' : 'Google Orgánico';
    canalKey = 'google';
  } else if (source?.includes('whatsapp') || medium?.includes('whatsapp')) {
    canal = 'WhatsApp';
    canalKey = 'whatsapp';
  } else if (source?.includes('email') || source?.includes('newsletter')) {
    canal = 'Boletín / Correo';
    canalKey = 'email';
  } else if (source) {
    canal = source.charAt(0).toUpperCase() + source.slice(1);
  }

  return {
    canal,
    canalKey,
    source: source ?? null,
    medium: medium ?? null,
    campaign: campaign ?? null,
    term: term ?? null,
    content: content ?? null,
    codigoCreador: codigoCreador ?? null,
    esPauta: Boolean(fbclid || gclid || medium?.includes('cpc') || medium?.includes('ads')),
  };
}

// GET / - List all orders with enriched shipping, vouchers, and pending gateway sessions
pedidosRoutes.get('/', async (c) => {
  const admin = createAdminClient();

  // 1. Obtener ventas web o con buy_order
  const { data: rawVentas, error: ventasErr } = await admin
    .from('ventas')
    .select(`
      id,
      buy_order,
      created_at,
      total,
      estado,
      metodo_pago,
      auth_code,
      productos,
      buyer_email,
      direccion_envio,
      retorno_frascos_declarados,
      retorno_frascos_estado,
      cliente_id,
      channel,
      origen
    `)
    .or('channel.eq.web,origen.eq.web,buy_order.not.is.null')
    .order('created_at', { ascending: false })
    .limit(100);

  if (ventasErr) {
    console.error('[pedidos] Error al consultar ventas:', ventasErr.message);
    return c.json({ ok: false, error: 'No se pudieron consultar los pedidos.' }, 500);
  }

  const ventas = rawVentas ?? [];
  const ventaIds = ventas.map((v) => v.id).filter(Boolean);
  const buyOrders = ventas.map((v) => v.buy_order).filter((bo): bo is string => Boolean(bo));

  // 2. Consultar logística de envíos para estas ventas
  const { data: rawEnvios } = ventaIds.length > 0
    ? await admin
        .from('logistica_envios')
        .select('id, venta_id, tracking_code, status, via, courier_code, courier_tracking_url, destino, items, created_at, eta')
        .in('venta_id', ventaIds)
    : { data: [] };

  const enviosByVentaId = new Map<string, Record<string, unknown>>();
  (rawEnvios ?? []).forEach((envio) => {
    if (envio.venta_id) {
      enviosByVentaId.set(envio.venta_id, envio);
    }
  });

  // 3. Consultar documentos tributarios / facturas emitidas
  const { data: rawFacturas } = ventaIds.length > 0
    ? await admin
        .from('facturas_emitidas')
        .select('id, venta_id, numero, tipo_documento, tipo_dte, estado, estado_sii, monto_total')
        .in('venta_id', ventaIds)
    : { data: [] };

  const facturasByVentaId = new Map<string, Record<string, unknown>>();
  (rawFacturas ?? []).forEach((f) => {
    if (f.venta_id) {
      facturasByVentaId.set(f.venta_id, f);
    }
  });

  // 4. Buscar checkout_sessions pendientes (ej. Flow 404 inicial o reintentos)
  const { data: rawSessions } = await admin
    .from('checkout_sessions')
    .select('id, buy_order, session_id, provider, total, shipping, cart, status, created_at, codigo_creador')
    .in('status', ['pending', 'expired'])
    .order('created_at', { ascending: false })
    .limit(30);

  // Filtrar solo las sesiones cuyo buy_order no está liquidado en ventas
  const settledBuyOrders = new Set(buyOrders);
  const porConciliar = (rawSessions ?? [])
    .filter((s) => !settledBuyOrders.has(s.buy_order))
    .map((s) => {
      const shippingObj = (typeof s.shipping === 'object' && s.shipping !== null)
        ? (s.shipping as Record<string, unknown>)
        : {};
      const codigoCreador = (s.codigo_creador as string | undefined) ?? (shippingObj.codigoCreador as string | undefined) ?? null;
      return {
        id: s.id,
        buyOrder: s.buy_order,
        sessionId: s.session_id,
        provider: s.provider,
        total: s.total,
        status: s.status,
        createdAt: s.created_at,
        shipping: {
          nombre: String(shippingObj.nombre ?? 'Cliente Tienda'),
          email: String(shippingObj.email ?? ''),
          telefono: String(shippingObj.telefono ?? ''),
          direccion: String(shippingObj.direccion ?? ''),
          comuna: String(shippingObj.comuna ?? ''),
          ciudad: String(shippingObj.ciudad ?? ''),
          region: String(shippingObj.region ?? ''),
          depto: (shippingObj.depto as string | undefined) || (shippingObj.departamento as string | undefined) || null,
          rut: (shippingObj.rut as string | undefined) || null,
          indicaciones: (shippingObj.indicaciones as string | undefined) || (shippingObj.instrucciones as string | undefined) || null,
        },
        items: parseOrderProducts(s.cart),
        atribucion: parseAtribucion(shippingObj, codigoCreador),
      };
    });

  // 5. Normalizar pedidos consolidados
  const pedidos = ventas.map((v) => {
    const envio = enviosByVentaId.get(v.id);
    const factura = facturasByVentaId.get(v.id);
    const items = parseOrderProducts(v.productos);
    const direccionEnvio = (typeof v.direccion_envio === 'object' && v.direccion_envio !== null)
      ? (v.direccion_envio as Record<string, unknown>)
      : {};

    const shippingStatus = (envio?.status as string | undefined) ?? 'pendiente';
    const codigoCreador = (direccionEnvio.codigoCreador as string | undefined) ?? null;

    return {
      id: v.id,
      buyOrder: v.buy_order,
      createdAt: v.created_at,
      total: v.total,
      estadoPago: v.estado,
      metodoPago: v.metodo_pago,
      authCode: v.auth_code,
      buyerEmail: v.buyer_email || String(direccionEnvio.email ?? ''),
      cliente: {
        nombre: String(direccionEnvio.nombre ?? 'Cliente Web'),
        telefono: String(direccionEnvio.telefono ?? ''),
        direccion: String(direccionEnvio.direccion ?? ''),
        comuna: String(direccionEnvio.comuna ?? ''),
        ciudad: String(direccionEnvio.ciudad ?? ''),
        region: String(direccionEnvio.region ?? ''),
        depto: (direccionEnvio.depto as string | undefined) || (direccionEnvio.departamento as string | undefined) || null,
        rut: (direccionEnvio.rut as string | undefined) || null,
        indicaciones: (direccionEnvio.indicaciones as string | undefined) || (direccionEnvio.instrucciones as string | undefined) || null,
      },
      items,
      atribucion: parseAtribucion(direccionEnvio, codigoCreador),
      retornoFrascos: {
        declarados: Number(v.retorno_frascos_declarados ?? 0),
        estado: String(v.retorno_frascos_estado ?? 'ninguno'),
      },
      logistica: {
        envioId: (envio?.id as string | undefined) ?? null,
        status: shippingStatus,
        courierCode: (envio?.courier_code as string | undefined) ?? DEFAULT_COURIER,
        via: (envio?.via as string | undefined) ?? getCourierLabel(envio?.courier_code as string),
        trackingCode: (envio?.tracking_code as string | undefined) ?? null,
        courierTrackingUrl: (envio?.courier_tracking_url as string | undefined) ?? null,
        eta: (envio?.eta as string | undefined) ?? null,
        destino: (envio?.destino as string | undefined) ?? null,
      },
      tributario: factura ? {
        id: factura.id,
        numero: factura.numero,
        tipoDocumento: factura.tipo_documento,
        tipoDte: factura.tipo_dte,
        estadoSii: factura.estado_sii,
      } : null,
    };
  });

  // 6. Métricas y KPIs de la mesa de despacho
  const stats = {
    total: pedidos.length,
    porPreparar: pedidos.filter((p) => p.logistica.status === 'pendiente').length,
    empaquetados: pedidos.filter((p) => p.logistica.status === 'empaquetado').length,
    enTransito: pedidos.filter((p) => p.logistica.status === 'en_transito').length,
    entregados: pedidos.filter((p) => p.logistica.status === 'entregado').length,
    porConciliar: porConciliar.length,
    ingresosTotalesClp: pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0),
    frascosRetornoPendientes: pedidos.reduce(
      (acc, p) => acc + (p.retornoFrascos.estado === 'pendiente_retiro' ? p.retornoFrascos.declarados : 0),
      0
    ),
  };

  return c.json({
    ok: true,
    data: {
      pedidos,
      porConciliar,
      stats,
    },
  });
});

// GET /:buyOrder - Single order detail
pedidosRoutes.get('/:buyOrder', async (c) => {
  const buyOrder = c.req.param('buyOrder');
  const admin = createAdminClient();

  const { data: venta, error } = await admin
    .from('ventas')
    .select('*')
    .eq('buy_order', buyOrder)
    .maybeSingle();

  if (error || !venta) {
    // Si no está en ventas, buscar en checkout_sessions pendientes
    const session = await getCheckoutSessionByBuyOrder(buyOrder);
    if (!session) {
      return c.json({ ok: false, error: 'Pedido no encontrado' }, 404);
    }
    return c.json({
      ok: true,
      data: {
        isPendingSession: true,
        session,
      },
    });
  }

  const [envioRes, facturaRes] = await Promise.all([
    admin.from('logistica_envios').select('*').eq('venta_id', venta.id).maybeSingle(),
    admin.from('facturas_emitidas').select('*').eq('venta_id', venta.id).maybeSingle(),
  ]);

  return c.json({
    ok: true,
    data: {
      isPendingSession: false,
      venta,
      envio: envioRes.data,
      factura: facturaRes.data,
    },
  });
});

// POST /:buyOrder/conciliar - 1-click settlement for gateway discrepancies
pedidosRoutes.post('/:buyOrder/conciliar', zValidator('json', ConciliarPedidoSchema), async (c) => {
  const buyOrder = c.req.param('buyOrder');
  const body = c.req.valid('json');
  const admin = createAdminClient();

  // Verificar si la sesión existe
  const session = await getCheckoutSessionByBuyOrder(buyOrder);
  if (!session) {
    return c.json({ ok: false, error: `No existe sesión de checkout para la orden ${buyOrder}` }, 404);
  }

  const authCode = String(body.flowOrder || body.authorizationCode || session.sessionId || 'CONCILIACION_MANUAL');

  try {
    const settleResult = await settleCheckout(admin, {
      buyOrder,
      authorizationCode: authCode,
      paymentProvider: session.provider,
      session,
      forceClaim: true,
      allowForceStock: true, // Conciliación manual: el pago ya fue recaudado por Flow
    });

    if (!settleResult.ok && !settleResult.alreadyProcessed) {
      const errorMsg =
        settleResult.errorMessage ||
        settleResult.stockErrors?.join('; ') ||
        (settleResult.processing
          ? 'El pedido se está procesando en este momento. Espere unos segundos y reintente.'
          : 'No se pudo liquidar el pedido. Verifique el estado en la pasarela.');

      return c.json({
        ok: false,
        error: errorMsg,
        details: settleResult.stockErrors,
      }, 422);
    }

    return c.json({
      ok: true,
      message: 'Pedido conciliado y registrado exitosamente.',
      ventaId: settleResult.ventaId,
      alreadyProcessed: settleResult.alreadyProcessed,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al conciliar pedido';
    console.error('[pedidos] Error en conciliación manual:', msg);
    return c.json({ ok: false, error: msg }, 500);
  }
});

// PATCH /:buyOrder/despacho - Update dispatch & courier tracking
pedidosRoutes.patch('/:buyOrder/despacho', zValidator('json', DespachoPedidoSchema), async (c) => {
  const buyOrder = c.req.param('buyOrder');
  const body = c.req.valid('json');
  const admin = createAdminClient();

  // Buscar venta
  const { data: venta, error: ventaErr } = await admin
    .from('ventas')
    .select('id, buyer_email, direccion_envio, user_id, empresa_id')
    .eq('buy_order', buyOrder)
    .maybeSingle();

  if (ventaErr || !venta) {
    return c.json({ ok: false, error: 'Pedido no encontrado' }, 404);
  }

  // Buscar o crear registro de logistica_envios
  const { data: existingEnvio } = await admin
    .from('logistica_envios')
    .select('*')
    .eq('venta_id', venta.id)
    .maybeSingle();

  const courierCode = body.courier_code ? resolveCourierCode(body.courier_code) : (existingEnvio?.courier_code || DEFAULT_COURIER);
  const trackingCode = body.tracking_code || existingEnvio?.tracking_code || `OYZ-${buyOrder.replace(/^ORD-/, '').slice(0, 8).toUpperCase()}`;
  const courierTrackingUrl = body.courier_tracking_url
    ? body.courier_tracking_url
    : buildCourierTrackingUrl(courierCode, trackingCode);
  const via = getCourierLabel(courierCode);

  let envioId = existingEnvio?.id as string | undefined;

  if (existingEnvio) {
    const { error: updateErr } = await admin
      .from('logistica_envios')
      .update({
        status: body.status,
        courier_code: courierCode,
        tracking_code: trackingCode,
        courier_tracking_url: courierTrackingUrl,
        via,
        eta: body.eta !== undefined ? body.eta : existingEnvio.eta,
      })
      .eq('id', existingEnvio.id);

    if (updateErr) {
      return c.json({ ok: false, error: updateErr.message }, 500);
    }
  } else {
    const { data: newEnvio, error: insertErr } = await admin
      .from('logistica_envios')
      .insert({
        venta_id: venta.id,
        empresa_id: venta.empresa_id ?? null,
        user_id: venta.user_id ?? null,
        status: body.status,
        courier_code: courierCode,
        tracking_code: trackingCode,
        courier_tracking_url: courierTrackingUrl,
        via,
        eta: body.eta ?? null,
        items: 'Pedido Web',
        destino: typeof venta.direccion_envio === 'object' && venta.direccion_envio !== null
          ? `${(venta.direccion_envio as Record<string, string>).direccion || ''}, ${(venta.direccion_envio as Record<string, string>).comuna || ''}`
          : 'Destino nacional',
      })
      .select('id')
      .single();

    if (insertErr || !newEnvio) {
      return c.json({ ok: false, error: insertErr?.message || 'Error al crear envío' }, 500);
    }
    envioId = newEnvio.id;
  }

  // Notificar al cliente si pasó a en_transito y se solicitó notificación
  if (body.status === 'en_transito' && body.notificarCliente && envioId && venta.buyer_email) {
    try {
      const direccionObj = (typeof venta.direccion_envio === 'object' && venta.direccion_envio !== null)
        ? (venta.direccion_envio as Record<string, string>)
        : {};
      const destinoStr = direccionObj.direccion ? `${direccionObj.direccion}, ${direccionObj.comuna || ''}` : 'Tu dirección registrada';

      await notifyShipmentDispatched(admin, {
        envioId,
        trackingCode,
        status: 'En tránsito',
        destino: destinoStr,
        email: venta.buyer_email,
        userId: venta.user_id ?? undefined,
        empresaId: venta.empresa_id ?? undefined,
        buyOrder,
      });
    } catch (notifErr) {
      console.warn('[pedidos] Aviso de despacho en camino falló (no bloquea el update):', notifErr);
    }
  }

  return c.json({
    ok: true,
    message: 'Estado de despacho actualizado.',
    trackingCode,
    courierTrackingUrl,
    status: body.status,
  });
});

// PATCH /:buyOrder/retorno-frascos - Update circular jar return status
pedidosRoutes.patch('/:buyOrder/retorno-frascos', zValidator('json', RetornoFrascosSchema), async (c) => {
  const buyOrder = c.req.param('buyOrder');
  const body = c.req.valid('json');
  const admin = createAdminClient();

  // Mapear hacia la restricción CHECK de Postgres: ('ninguno', 'pendiente_retiro', 'recibido_conforme', 'rechazado')
  let dbStatus: 'ninguno' | 'pendiente_retiro' | 'recibido_conforme' | 'rechazado' = 'ninguno';
  if (body.status === 'pendiente_retiro') {
    dbStatus = 'pendiente_retiro';
  } else if (body.status === 'recibido_conforme' || body.status === 'recibido_en_taller' || body.status === 'higienizado') {
    dbStatus = 'recibido_conforme';
  } else if (body.status === 'rechazado' || body.status === 'cancelado') {
    dbStatus = 'rechazado';
  }

  const { error } = await admin
    .from('ventas')
    .update({
      retorno_frascos_estado: dbStatus,
    })
    .eq('buy_order', buyOrder);

  if (error) {
    return c.json({ ok: false, error: error.message }, 500);
  }

  return c.json({
    ok: true,
    message: 'Estado de retorno circular actualizado.',
    status: dbStatus,
  });
});
