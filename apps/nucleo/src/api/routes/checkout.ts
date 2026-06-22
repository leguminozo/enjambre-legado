import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getPaymentProvider,
  getPaymentProviderByName,
  saveCheckoutSession,
  getCheckoutSession,
} from "../lib/payments";
import type { CartLineInput } from "../lib/payments";
import { fulfillCheckout } from "../lib/payments/checkout-fulfill";
import { fulfillSubscriptionFromWebhook } from "./subscriptions-checkout";
import {
  previewCartPricing,
  resolveBuyerPricingContext,
} from "../lib/pricing/cart-pricing-service";
import { computeShippingCost, isCourierCode, resolveCourierCode } from "@enjambre/logistica";
import {
  computeDiscountClp,
  computePaidTotal,
  computeUnitPrice,
  isDiscountRowValid,
  validatePointsRedeemInput,
  type DiscountRow,
} from "@enjambre/pricing";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "../lib/ratelimit";

async function rateLimitMiddleware(
  c: { req: { header: (name: string) => string | undefined; ip?: string }; json: (data: unknown, status: number) => Response; header: (name: string, value: string) => void },
  config: { readonly limit: number; readonly window: `${number} ${"s" | "m" | "h" | "d"}` }
) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...config });

  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.reset));

  if (!result.success) {
    c.header("Retry-After", String(result.retryAfter || 60));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);
  }
  return null;
}

const CartLineSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const ShippingSchema = z.object({
  nombre: z.string().min(2).max(200),
  email: z.string().email(),
  telefono: z.string().min(8).max(20),
  direccion: z.string().min(5).max(300),
  comuna: z.string().min(2).max(100),
  ciudad: z.string().min(2).max(100),
  region: z.string().min(2).max(100),
  codigoPostal: z.string().max(20).optional(),
  instrucciones: z.string().max(500).optional(),
});

const InitBodySchema = z.object({
  cart: z.array(CartLineSchema).min(1),
  shipping: ShippingSchema,
  returnUrl: z.string().url().optional(),
  buyerMode: z.enum(['legado', 'privada', 'b2b']).optional().default('legado'),
  organizacionId: z.string().uuid().optional(),
  courierCode: z.string().optional(),
  puntosACanjear: z.number().int().nonnegative().optional().default(0),
  codigoDescuento: z.string().trim().min(2).max(40).optional(),
});

const QuoteBodySchema = z.object({
  subtotal: z.number().int().nonnegative(),
  region: z.string().min(2),
  courierCode: z.string().optional(),
  codigoDescuento: z.string().trim().optional(),
  puntosACanjear: z.number().int().nonnegative().optional().default(0),
});

const CommitBodySchema = z.object({
  token_ws: z.string().min(1),
  buyOrder: z.string().min(1).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

const PreviewBodySchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const checkoutRoutes = new Hono();

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveDiscountClp(
  admin: ReturnType<typeof createAdminClient>,
  codigo: string | undefined,
  subtotal: number,
): Promise<{ discountClp: number; discountCode: string | null; discountId: string | null; envioGratis: boolean }> {
  if (!codigo) {
    return { discountClp: 0, discountCode: null, discountId: null, envioGratis: false };
  }

  const { data: row, error } = await admin
    .from('descuentos')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle();

  if (error || !row) {
    throw new Error('Código no válido');
  }

  const discount = row as DiscountRow;
  const valid = isDiscountRowValid(discount, subtotal);
  if (!valid.ok) {
    throw new Error(`Código no aplicable (${valid.code})`);
  }

  const discountClp = computeDiscountClp(discount.tipo, Number(discount.valor), subtotal);
  return {
    discountClp,
    discountCode: discount.codigo,
    discountId: discount.id,
    envioGratis: discount.tipo === 'envio_gratis',
  };
}

checkoutRoutes.post("/quote", zValidator("json", QuoteBodySchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const admin = createAdminClient();
    const courierCode = resolveCourierCode(body.courierCode);
    let shippingCost = computeShippingCost({
      region: body.region,
      courierCode,
      subtotalClp: body.subtotal,
    });

    let discountClp = 0;
    if (body.codigoDescuento) {
      const d = await resolveDiscountClp(admin, body.codigoDescuento, body.subtotal);
      discountClp = d.discountClp;
      if (d.envioGratis) shippingCost = 0;
    }

    const netSubtotal = Math.max(0, body.subtotal - discountClp);
    let loyaltyDiscountClp = 0;
    if (body.puntosACanjear > 0) {
      const token = c.req.header("Authorization")?.replace("Bearer ", "") || null;
      const { userId } = await resolveBuyerPricingContext(admin, token);
      if (userId) {
        const { data: empresa } = await admin.from('empresas').select('id').limit(1).maybeSingle();
        const { data: puntosRow } = await admin
          .from('puntos_fidelizacion')
          .select('puntos')
          .eq('user_id', userId)
          .eq('empresa_id', empresa?.id ?? '')
          .maybeSingle();
        const validation = validatePointsRedeemInput(
          body.puntosACanjear,
          (puntosRow?.puntos as number) ?? 0,
          netSubtotal,
        );
        if (validation.ok) loyaltyDiscountClp = validation.discountClp;
      }
    }

    const total = computePaidTotal(netSubtotal, shippingCost, loyaltyDiscountClp);
    return c.json({
      subtotal: body.subtotal,
      discountClp,
      shippingCost,
      loyaltyDiscountClp,
      total,
      courierCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cotizar';
    return c.json({ code: 'quote_failed', message }, 400);
  }
});

checkoutRoutes.post("/preview", zValidator("json", PreviewBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { items } = c.req.valid("json");
    const admin = createAdminClient();
    const token = c.req.header("Authorization")?.replace("Bearer ", "") || null;
    const pricing = await previewCartPricing(admin, items, token);
    return c.json({ success: true, pricing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo calcular el preview";
    return c.json({ code: "preview_failed", message }, 500);
  }
});

checkoutRoutes.post("/init", zValidator("json", InitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const {
      cart,
      shipping,
      returnUrl: rawReturnUrl,
      buyerMode,
      organizacionId,
      courierCode: requestedCourier,
      puntosACanjear: requestedPoints,
      codigoDescuento,
    } = c.req.valid("json");
    const admin = createAdminClient();
    const productIds = cart.map((line) => line.productId);

    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    const { role, userId, pastOrdersCount } = await resolveBuyerPricingContext(admin, token);

    const effectiveBuyerMode = buyerMode === 'legado' && !userId ? 'privada' : buyerMode;
    const effectiveClienteId = effectiveBuyerMode === 'privada' ? null : userId;

    const { data: products, error: fetchError } = await admin
      .from('productos')
      .select('id, precio, stock, nombre, visible')
      .in('id', productIds);

    if (fetchError) {
      return c.json({ code: "fetch_error", message: 'Error consultando productos' }, 500);
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const verifiedCart: CartLineInput[] = [];
    let serverTotal = 0;
    const errors: string[] = [];

    for (const line of cart) {
      const product = productMap.get(line.productId);

      if (!product) {
        errors.push(`Producto ${line.name}: no encontrado`);
        continue;
      }

      if (!product.visible) {
        errors.push(`Producto ${product.nombre}: no disponible`);
        continue;
      }

      if (product.stock != null && product.stock < line.quantity) {
        errors.push(`Producto ${product.nombre}: stock insuficiente (${product.stock} disponible)`);
        continue;
      }

      const basePrice = product.precio;
      const discountedPrice = computeUnitPrice(basePrice, role, pastOrdersCount);

      if (line.unitPrice !== discountedPrice) {
        errors.push(`Producto ${product.nombre}: precio cambió de $${line.unitPrice} a $${discountedPrice}`);
        continue;
      }

      verifiedCart.push({
        productId: line.productId,
        slug: line.slug,
        name: product.nombre,
        unitPrice: discountedPrice,
        quantity: line.quantity,
      });

      serverTotal += discountedPrice * line.quantity;
    }

    if (errors.length > 0) {
      return c.json({ code: "invalid_cart", message: 'Algunos productos tienen problemas', details: errors, verifiedCart }, 409);
    }

    if (verifiedCart.length === 0) {
      return c.json({ code: "empty_cart", message: 'Carrito vacío después de verificación' }, 400);
    }

    if (requestedCourier && !isCourierCode(requestedCourier)) {
      return c.json({ code: 'invalid_courier', message: 'Courier no disponible' }, 400);
    }

    let courierCode = resolveCourierCode(requestedCourier);
    if (userId && !requestedCourier) {
      const { data: profile } = await admin
        .from('profiles')
        .select('courier_preferido')
        .eq('id', userId)
        .maybeSingle();
      courierCode = resolveCourierCode(profile?.courier_preferido as string | null | undefined);
    }

    const subtotal = Math.round(serverTotal);

    let discountClp = 0;
    let discountCode: string | null = null;
    let discountId: string | null = null;
    let envioGratis = false;

    if (codigoDescuento) {
      try {
        const d = await resolveDiscountClp(admin, codigoDescuento, subtotal);
        discountClp = d.discountClp;
        discountCode = d.discountCode;
        discountId = d.discountId;
        envioGratis = d.envioGratis;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Código inválido';
        return c.json({ code: 'invalid_discount', message }, 400);
      }
    }

    const netSubtotal = Math.max(0, subtotal - discountClp);
    let shippingCost = computeShippingCost({
      region: shipping.region,
      courierCode,
      subtotalClp: subtotal,
    });
    if (envioGratis) shippingCost = 0;

    let loyaltyPointsRedeemed = 0;
    let loyaltyDiscountClp = 0;

    if (requestedPoints > 0) {
      if (!userId || effectiveBuyerMode === 'privada') {
        return c.json({
          code: 'loyalty_auth_required',
          message: 'Inicia sesión para canjear puntos',
        }, 401);
      }

      const { data: defaultEmpresa } = await admin.from('empresas').select('id').limit(1).maybeSingle();
      if (!defaultEmpresa?.id) {
        return c.json({ code: 'empresa_missing', message: 'Configuración de empresa incompleta' }, 500);
      }

      const { data: puntosRow } = await admin
        .from('puntos_fidelizacion')
        .select('puntos')
        .eq('user_id', userId)
        .eq('empresa_id', defaultEmpresa.id)
        .maybeSingle();

      const balance = (puntosRow?.puntos as number | undefined) ?? 0;
      const validation = validatePointsRedeemInput(requestedPoints, balance, netSubtotal);

      if (!validation.ok) {
        return c.json({
          code: 'invalid_loyalty_redeem',
          message: 'Canje de puntos inválido',
          details: validation.code,
        }, 400);
      }

      loyaltyPointsRedeemed = requestedPoints;
      loyaltyDiscountClp = validation.discountClp;
    }

    const total = computePaidTotal(netSubtotal, shippingCost, loyaltyDiscountClp);
    const buyOrder = `ORD-${crypto.randomUUID()}`;
    const sessionId = `sess-${crypto.randomUUID()}`;

    const baseReturnUrl = rawReturnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado`;
    const returnUrl = `${baseReturnUrl}?buyOrder=${encodeURIComponent(buyOrder)}`;

    const provider = getPaymentProvider();
    const result = await provider.init(buyOrder, sessionId, total, returnUrl, shipping.email);

    await saveCheckoutSession({
      buyOrder,
      sessionId,
      cart: verifiedCart,
      total,
      provider: provider.name,
      shipping,
      courierCode,
      shippingCost,
      subtotal,
      discountCode,
      discountClp,
      discountId,
      loyaltyPointsRedeemed,
      loyaltyDiscountClp,
      createdAt: Date.now(),
      buyerMode: effectiveBuyerMode,
      clienteId: effectiveClienteId,
      organizacionId: organizacionId ?? null,
    });

    const { data: reserveResult, error: reserveError } = await admin.rpc('reserve_checkout_stock', {
      p_buy_order: buyOrder,
      p_cart: verifiedCart,
      p_ttl_minutes: 30,
    });

    const reserveOk =
      !reserveError &&
      reserveResult &&
      typeof reserveResult === 'object' &&
      (reserveResult as { success?: boolean }).success === true;

    if (!reserveOk) {
      await admin.from('checkout_sessions').delete().eq('buy_order', buyOrder);
      return c.json({
        code: 'stock_hold_failed',
        message: 'No hay stock suficiente para reservar tu pedido. Intenta de nuevo.',
      }, 409);
    }

    if (userId && requestedCourier && isCourierCode(requestedCourier)) {
      await admin
        .from('profiles')
        .update({ courier_preferido: requestedCourier })
        .eq('id', userId);
    }

    return c.json({
      url: result.url,
      token: result.token,
      buyOrder: result.buyOrder,
      sessionId: result.sessionId,
      total,
      subtotal,
      shippingCost,
      discountClp,
      discountCode,
      loyaltyDiscountClp,
      loyaltyPointsRedeemed,
      provider: provider.name,
      buyerMode: effectiveBuyerMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar checkout';
    return c.json({ code: "init_failed", message }, 500);
  }
});

checkoutRoutes.post("/commit", zValidator("json", CommitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { token_ws, buyOrder: clientBuyOrder } = c.req.valid("json");
    const provider = getPaymentProvider();
    const result = await provider.commit(token_ws);

    if (!result.authorized) {
      return c.json({ ok: false, authorized: false, result: result.raw }, 200);
    }

    const buyOrder = result.buyOrder?.trim();
    if (!buyOrder) {
      return c.json({ ok: false, authorized: true, error: 'Proveedor no devolvió buyOrder' }, 200);
    }

    if (clientBuyOrder && clientBuyOrder !== buyOrder) {
      console.warn(`[Checkout commit] buyOrder mismatch client=${clientBuyOrder} provider=${buyOrder}`);
      return c.json({ code: 'buy_order_mismatch', message: 'buyOrder no coincide con el proveedor de pago' }, 400);
    }

    const session = await getCheckoutSession(buyOrder);

    if (!session) {
      console.error(`Checkout session not found for buyOrder: ${buyOrder}. Payment authorized but order not persisted.`);
      return c.json({
        ok: false,
        authorized: true,
        error: 'Sesión de checkout expirada. Contacta soporte con orden ' + buyOrder,
        buyOrder,
      }, 200);
    }

    const admin = createAdminClient();
    const fulfilled = await fulfillCheckout(admin, {
      buyOrder,
      session,
      authorizationCode: result.authorizationCode,
      paymentProvider: session.provider,
    });

    if (!fulfilled.ok) {
      const stockDetail = fulfilled.stockErrors?.length
        ? ` Stock: ${fulfilled.stockErrors.join('; ')}.`
        : '';
      return c.json({
        ok: false,
        authorized: true,
        error:
          'Pago autorizado pero no se pudo registrar la venta.' +
          stockDetail +
          ' Contacta soporte con orden ' +
          buyOrder,
        stockErrors: fulfilled.stockErrors,
        buyOrder,
      }, 200);
    }

    return c.json({
      ok: true,
      authorized: true,
      buyOrder,
      total: session.total,
      cart: session.cart,
      ventaId: fulfilled.ventaId,
      alreadyProcessed: fulfilled.alreadyProcessed ?? false,
      result: result.raw,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar pago';
    return c.json({ code: "commit_failed", message }, 500);
  }
});

checkoutRoutes.post("/webhook/flow", async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.webhook);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await c.req.parseBody();
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) {
      return c.json({ error: 'Falta token' }, 400);
    }

    const provider = getPaymentProviderByName('flow');
    const result = await provider.commit(token);

    if (!result.authorized) {
      return c.json({ ok: true, status: 'not_paid' }, 200);
    }

    const buyOrder = result.buyOrder;
    if (!buyOrder) {
      return c.json({ error: 'Falta commerceOrder en respuesta Flow' }, 400);
    }

    if (buyOrder.startsWith('SUB-')) {
      const subResult = await fulfillSubscriptionFromWebhook(buyOrder, result.authorizationCode);
      if (!subResult.ok) {
        return c.json({ error: subResult.error }, (subResult.status ?? 500) as 500);
      }
      return c.json({ ok: true, status: subResult.status }, 200);
    }

    const session = await getCheckoutSession(buyOrder);
    if (!session) {
      console.error(`Flow webhook: session not found for buyOrder ${buyOrder}`);
      return c.json({ error: 'Sesión no encontrada' }, 404);
    }

    const admin = createAdminClient();
    const fulfilled = await fulfillCheckout(admin, {
      buyOrder,
      session,
      authorizationCode: result.authorizationCode,
      paymentProvider: 'flow',
    });

    if (!fulfilled.ok) {
      return c.json({ error: 'Error guardando venta' }, 500);
    }

    return c.json({ ok: true, status: fulfilled.alreadyProcessed ? 'already_processed' : 'confirmed' }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    console.error('Flow webhook error:', message);
    return c.json({ error: message }, 500);
  }
});
