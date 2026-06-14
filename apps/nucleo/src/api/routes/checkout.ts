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
});

const CommitBodySchema = z.object({
  token_ws: z.string().min(1),
  buyOrder: z.string().min(1).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

export const checkoutRoutes = new Hono();

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createClient(url, key, { auth: { persistSession: false } });
}

checkoutRoutes.post("/init", zValidator("json", InitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { cart, shipping, returnUrl: rawReturnUrl, buyerMode, organizacionId } = c.req.valid("json");
    const admin = createAdminClient();
    const productIds = cart.map((line) => line.productId);

    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    let role = 'comprador';
    let userId: string | null = null;
    let pastOrdersCount = 0;

    if (token) {
      const { data: { user }, error: authErr } = await admin.auth.getUser(token);
      if (!authErr && user) {
        userId = user.id;
        role = user.app_metadata?.oyz_role || 'comprador';

        if (role === 'revendedor' || role === 'embajador') {
          const { count } = await admin
            .from('ventas')
            .select('id', { count: 'exact', head: true })
            .eq('cliente_id', user.id);
          pastOrdersCount = count ?? 0;
        }
      }
    }

    const effectiveBuyerMode = buyerMode === 'legado' && !userId ? 'privada' : buyerMode;
    const effectiveClienteId = effectiveBuyerMode === 'privada' ? null : userId;

    const { data: products, error: fetchError } = await admin
      .from('productos')
      .select('id, precio, stock, nombre, visible')
      .in('id', productIds);

    if (fetchError) {
      return c.json({ code: "fetch_error", message: 'Error consultando productos' }, 500);
    }

    let roleMultiplier = 1.0;
    if (role === 'embajador') roleMultiplier = 0.70;
    else if (role === 'revendedor') roleMultiplier = 0.80;
    else if (role === 'suscriptor') roleMultiplier = 0.90;

    let volumeMultiplier = 1.0;
    if ((role === 'revendedor' || role === 'embajador') && pastOrdersCount >= 10) {
      volumeMultiplier = 0.95;
    }
    const finalMultiplier = roleMultiplier * volumeMultiplier;

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
      const discountedPrice = Math.round(basePrice * finalMultiplier);

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

    const total = Math.max(1, Math.round(serverTotal));
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
      createdAt: Date.now(),
      buyerMode: effectiveBuyerMode,
      clienteId: effectiveClienteId,
      organizacionId: organizacionId ?? null,
    });

    return c.json({
      url: result.url,
      token: result.token,
      buyOrder: result.buyOrder,
      sessionId: result.sessionId,
      total,
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

    const buyOrder = clientBuyOrder || result.buyOrder;
    const session = buyOrder ? await getCheckoutSession(buyOrder) : undefined;

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
      return c.json({
        ok: false,
        authorized: true,
        error: 'Pago autorizado pero no se pudo registrar la venta. Contacta soporte con orden ' + buyOrder,
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
