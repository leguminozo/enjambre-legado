import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getPaymentProvider,
  getPaymentProviderByName,
  saveCheckoutSession,
  getCheckoutSessionByBuyOrder,
  expireStaleCheckoutSessions,
  lookupCheckoutAttempt,
  detachCheckoutAttemptKey,
} from "../lib/payments";
import type { CartLineInput, CheckoutAttemptReplay } from "../lib/payments";
import { settleCheckout } from "../lib/payments/settle-checkout";
import { enforceCostFloor } from "../lib/payments/cost-floor";
import { fetchBloqueadosPorProducto } from "../lib/stock/cart-stock";
import { resolveCheckoutReturnUrl } from "../lib/payments/safe-return-url";
import { buildPagosGoLiveChecklist } from "../lib/payments/go-live-checklist";
import { fulfillSubscriptionFromWebhook } from "./subscriptions-checkout";
import {
  previewCartPricing,
  resolveBuyerPricingContext,
} from "../lib/pricing/cart-pricing-service";
import {
  computeShippingCostWithRates,
  isCourierCode,
  resolveCourierCode,
  shippingRatesConfigFromRaw,
  DEFAULT_SHIPPING_RATES_CONFIG,
  type ShippingRatesConfig,
} from "@enjambre/logistica";
import {
  calculateJarReturnReward,
  computeDiscountClp,
  computePaidTotal,
  computeUnitPrice,
  isDiscountRowValid,
  validatePointsRedeemInput,
  type DiscountRow,
} from "@enjambre/pricing";
import { createAdminClient } from "@enjambre/auth/server-index";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "../lib/ratelimit";
import { getCafMinFolios, getFoliosRestantes } from "@/api/lib/fiscal/caf-guard";
import { DTE_TIPO } from "@enjambre/contable";
import { isAutoEmitBoletaEnabled } from "@/lib/fiscal/checkout-dte";
import { loadLoyaltyConfig } from "@/api/lib/loyalty/loyalty-config";
import {
  authMiddleware,
  requireProfileRole,
  tenantMiddleware,
  type AppVariables,
} from "@/api/lib/middleware";

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

const UtmSchema = z.object({
  source: z.string().max(120).optional(),
  medium: z.string().max(120).optional(),
  campaign: z.string().max(120).optional(),
  term: z.string().max(120).optional(),
  content: z.string().max(120).optional(),
  fbclid: z.string().max(250).optional(),
  gclid: z.string().max(250).optional(),
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
  utm: UtmSchema.optional(),
});

const BillingSchema = z.object({
  tipoDte: z.enum(['boleta', 'factura']).default('boleta'),
  rut: z.string().optional(),
  razonSocial: z.string().optional(),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  comuna: z.string().optional(),
});

const InitBodySchema = z.object({
  cart: z.array(CartLineSchema).min(1),
  shipping: ShippingSchema,
  billing: BillingSchema.optional(),
  returnUrl: z.string().url().optional(),
  buyerMode: z.enum(['legado', 'privada', 'b2b']).optional().default('legado'),
  organizacionId: z.string().uuid().optional(),
  courierCode: z.string().optional(),
  puntosACanjear: z.number().int().nonnegative().optional().default(0),
  codigoDescuento: z.string().trim().min(2).max(40).optional(),
  codigoCreador: z.string().trim().min(2).max(40).optional(),
  retornoFrascosDeclarados: z.number().int().min(0).max(50).optional().default(0),
  weightGrams: z.number().int().nonnegative().max(60000).optional().default(0),
  utm: UtmSchema.optional(),
  attemptKey: z.string().trim().min(8).max(80).optional(),
});

const QuoteBodySchema = z.object({
  subtotal: z.number().int().nonnegative(),
  region: z.string().min(2),
  courierCode: z.string().optional(),
  codigoDescuento: z.string().trim().optional(),
  puntosACanjear: z.number().int().nonnegative().optional().default(0),
  codigoCreador: z.string().trim().optional(),
  retornoFrascosDeclarados: z.number().int().min(0).max(50).optional().default(0),
  weightGrams: z.number().int().nonnegative().max(60000).optional().default(0),
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

/** Respuesta de un init reanudado: mismos datos de redirección, sin re-crear pago ni hold. */
function checkoutAttemptReplayJson(replay: CheckoutAttemptReplay) {
  return {
    url: replay.url,
    token: replay.token,
    buyOrder: replay.buyOrder,
    sessionId: replay.sessionId,
    total: replay.total,
    subtotal: replay.subtotal,
    shippingCost: replay.shippingCost,
    discountClp: replay.discountClp,
    discountCode: replay.discountCode,
    loyaltyDiscountClp: replay.loyaltyDiscountClp,
    loyaltyPointsRedeemed: replay.loyaltyPointsRedeemed,
    provider: replay.provider,
    buyerMode: replay.buyerMode,
    replayed: true,
  };
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

/**
 * Descuento del código de creador: % sobre la base neta (después de códigos).
 * Lanza si el código no existe o está inactivo — el checkout debe fallar claro.
 */
async function resolveCreadorDiscountClp(
  admin: ReturnType<typeof createAdminClient>,
  codigo: string | undefined,
  baseClp: number,
): Promise<number> {
  if (!codigo) return 0;
  const { data, error } = await admin
    .from('creadores')
    .select('descuento_cliente')
    .ilike('codigo_ref', codigo)
    .eq('estado', 'activo')
    .maybeSingle();
  if (error || !data) {
    throw new Error('Código de creador no válido o inactivo');
  }
  return Math.floor(baseClp * Number(data.descuento_cliente) / 100);
}

async function resolveCartFreeShipping(admin: ReturnType<typeof createAdminClient> | null): Promise<{ freeShipping: boolean; thresholdClp: number }> {
  try {
    const client = admin ?? createAdminClient({ persistSession: false });
    const { data } = await client
      .from('site_content')
      .select('content')
      .eq('section_key', 'cart_settings')
      .limit(1)
      .maybeSingle();

    if (data?.content && typeof data.content === 'object') {
      const content = data.content as Record<string, unknown>;
      const enabled = content.free_shipping_enabled !== false;
      const threshold = typeof content.free_shipping_threshold_clp === 'number' && Number.isFinite(content.free_shipping_threshold_clp)
        ? content.free_shipping_threshold_clp
        : 45000;
      return { freeShipping: enabled, thresholdClp: threshold };
    }
  } catch {
    // fallback a defaults
  }
  return { freeShipping: true, thresholdClp: 45000 };
}

/**
 * Tarifas de despacho del CMS (`shipping_settings`, editable en el Editor de
 * Tienda). Lectura fresca en cada quote/confirm — fallback a valores base del
 * código si la sección no existe o el JSON viene dañado.
 */
async function resolveShippingRates(
  admin: ReturnType<typeof createAdminClient> | null,
): Promise<ShippingRatesConfig> {
  try {
    const client = admin ?? createAdminClient({ persistSession: false });
    const { data } = await client
      .from("site_content")
      .select("content")
      .eq("section_key", "shipping_settings")
      .limit(1)
      .maybeSingle();

    if (data?.content && typeof data.content === "object") {
      return shippingRatesConfigFromRaw(data.content as Record<string, unknown>);
    }
  } catch {
    // fallback a defaults
  }
  return DEFAULT_SHIPPING_RATES_CONFIG;
}

checkoutRoutes.post("/quote", zValidator("json", QuoteBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;
  try {
    const body = c.req.valid("json");
    const courierCode = resolveCourierCode(body.courierCode);
    const { freeShipping: fsEnabled, thresholdClp } = await resolveCartFreeShipping(null);
    const shippingRates = await resolveShippingRates(null);
    let shippingCost = computeShippingCostWithRates(
      {
        region: body.region,
        courierCode,
        subtotalClp: body.subtotal,
        freeShipping: fsEnabled,
        freeShippingSubtotal: thresholdClp,
        weightGrams: body.weightGrams ?? 0,
      },
      shippingRates,
    );

    const needsAdmin =
      Boolean(body.codigoDescuento?.trim()) || (body.puntosACanjear ?? 0) > 0;
    const admin = needsAdmin ? createAdminClient({ persistSession: false }) : null;

    // Economía de lealtad vigente (bloques de canje + recompensa por frascos)
    const needsLoyaltyConfig =
      (body.puntosACanjear ?? 0) > 0 || (body.retornoFrascosDeclarados ?? 0) > 0;
    const loyaltyConfig = needsLoyaltyConfig
      ? await loadLoyaltyConfig(admin ?? createAdminClient({ persistSession: false }))
      : null;

    let discountClp = 0;
    if (body.codigoDescuento && admin) {
      const d = await resolveDiscountClp(admin, body.codigoDescuento, body.subtotal);
      discountClp = d.discountClp;
      if (d.envioGratis) shippingCost = 0;
    }

    const netSubtotal = Math.max(0, body.subtotal - discountClp);
    let loyaltyDiscountClp = 0;
    if (body.puntosACanjear > 0 && admin) {
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
          loyaltyConfig?.redemption,
        );
        if (validation.ok) loyaltyDiscountClp = validation.discountClp;
      }
    }

    let descuentoCreadorClp = 0;
    if (body.codigoCreador) {
      const adminC = admin ?? createAdminClient({ persistSession: false });
      try {
        descuentoCreadorClp = await resolveCreadorDiscountClp(adminC, body.codigoCreador, netSubtotal);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Código inválido';
        return c.json({ code: 'invalid_creador_code', message }, 400);
      }
    }

    const total = Math.max(0, computePaidTotal(netSubtotal, shippingCost, loyaltyDiscountClp) - descuentoCreadorClp);
    const retornoReward = calculateJarReturnReward(
      body.retornoFrascosDeclarados ?? 0,
      loyaltyConfig?.engine,
    );
    return c.json({
      subtotal: body.subtotal,
      discountClp,
      shippingCost,
      loyaltyDiscountClp,
      descuentoCreadorClp,
      total,
      courierCode,
      retornoReward,
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
    const admin = createAdminClient({ persistSession: false });
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
      shipping: rawShipping,
      billing,
      returnUrl: rawReturnUrl,
      buyerMode,
      organizacionId,
      courierCode: requestedCourier,
      puntosACanjear: requestedPoints,
      codigoDescuento,
      codigoCreador,
      retornoFrascosDeclarados,
      weightGrams: requestedWeightGrams,
      utm,
      attemptKey,
    } = c.req.valid("json");
    const shipping = {
      ...rawShipping,
      utm: rawShipping.utm ?? utm,
    };
    const admin = createAdminClient({ persistSession: false });
    const productIds = cart.map((line) => line.productId);

    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    const { role, userId, pastOrdersCount } = await resolveBuyerPricingContext(admin, token);

    const effectiveBuyerMode = buyerMode === 'legado' && !userId ? 'privada' : buyerMode;
    // El id de cuenta se conserva incluso en compra privada para limpiar el
    // carrito remoto; la venta no se vincula si buyerMode es 'privada'.
    const effectiveClienteId = userId;
    const attemptClienteId = effectiveClienteId ?? null;

    if (attemptKey) {
      const lookup = await lookupCheckoutAttempt(attemptKey, attemptClienteId);
      if (lookup.kind === 'replay') {
        return c.json(checkoutAttemptReplayJson(lookup.replay));
      }
      if (lookup.kind === 'conflict') {
        return c.json(
          {
            code: 'attempt_conflict',
            message:
              'El intento de pago anterior no coincide con esta compra. Recarga la página e intenta de nuevo.',
          },
          409,
        );
      }
      if (lookup.kind === 'stale') {
        await detachCheckoutAttemptKey(lookup.buyOrder);
      }
    }

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

      const basePrice = Number(product.precio);
      if (!Number.isFinite(basePrice)) {
        errors.push(`Producto ${product.nombre}: precio inválido`);
        continue;
      }
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

    // Bloqueo de calidad: lotes observados (HMF sobre Codex) no se venden.
    const bloqueados = await fetchBloqueadosPorProducto(admin, verifiedCart.map((l) => l.productId));
    if (bloqueados.size > 0) {
      return c.json({
        code: "calidad_bloqueada",
        message: 'Uno o más productos están bloqueados por control de calidad. Quítalos del carrito para continuar.',
      }, 409);
    }

    // CAF: fail-closed para ventas legales Chile.
    // Opt-out explícito: SII_ENFORCE_CAF_ON_CHECKOUT=false
    // Default enforce: auto-emit boleta, flag true, o Vercel production.
    const cafEnv = process.env.SII_ENFORCE_CAF_ON_CHECKOUT;
    const enforceCaf =
      cafEnv === 'false'
        ? false
        : cafEnv === 'true' ||
          isAutoEmitBoletaEnabled() ||
          process.env.VERCEL_ENV === 'production';
    if (enforceCaf) {
      const { data: empresa } = await admin.from('empresas').select('id').limit(1).maybeSingle();
      if (!empresa?.id) {
        return c.json(
          {
            code: 'empresa_missing',
            message: 'Configuración de empresa incompleta para fiscalización',
          },
          500,
        );
      }
      const minFolios = getCafMinFolios();
      const restantes = await getFoliosRestantes(
        admin,
        empresa.id,
        DTE_TIPO.BOLETA_ELECTRONICA,
      );
      if (restantes < minFolios) {
        return c.json(
          {
            code: 'folios_exhausted',
            message:
              'El sistema de pagos se encuentra en mantenimiento (código: folios). Por favor intenta más tarde.',
            error:
              'El sistema de pagos se encuentra temporalmente en mantenimiento. Por favor intenta más tarde.',
            foliosRestantes: restantes,
            minFolios,
          },
          503,
        );
      }
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
    const { freeShipping: fsEnabled, thresholdClp } = await resolveCartFreeShipping(admin);
    const shippingRates = await resolveShippingRates(admin);
    let shippingCost = computeShippingCostWithRates(
      {
        region: shipping.region,
        courierCode,
        subtotalClp: subtotal,
        freeShipping: fsEnabled,
        freeShippingSubtotal: thresholdClp,
        weightGrams: requestedWeightGrams ?? 0,
      },
      shippingRates,
    );
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
      // Mismos bloques de canje que el /quote: la config vigente del panel Enjambre.
      const { redemption } = await loadLoyaltyConfig(admin);
      const validation = validatePointsRedeemInput(requestedPoints, balance, netSubtotal, redemption);

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

    // Código de creador: valida aquí (descuento al comprador) y se registra
    // uso + comisión en fulfill — el circuito de dinero cierra post-pago.
    let descuentoCreadorClp = 0;
    if (codigoCreador) {
      try {
        descuentoCreadorClp = await resolveCreadorDiscountClp(admin, codigoCreador, netSubtotal);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Código inválido';
        return c.json({ code: 'invalid_creador_code', message }, 400);
      }
    }

    const total = Math.max(
      0,
      computePaidTotal(netSubtotal, shippingCost, loyaltyDiscountClp) - descuentoCreadorClp,
    );

    // Piso de costo: ningún descuento (código, puntos o creador) vende bajo costo.
    const floor = await enforceCostFloor(
      admin,
      verifiedCart,
      discountClp + loyaltyDiscountClp + descuentoCreadorClp,
    );
    if (!floor.ok) {
      return c.json({
        code: 'below_cost',
        message: `Este descuento deja el pedido bajo su costo de producción (faltan $${floor.faltante.toLocaleString('es-CL')}). Ajusta el código o el carrito.`,
      }, 400);
    }

    const buyOrder = `ORD-${crypto.randomUUID()}`;
    const sessionId = `sess-${crypto.randomUUID()}`;

    const provider = getPaymentProvider();

    // Never trust arbitrary client returnUrl (open redirect post-pago).
    const returnUrl = resolveCheckoutReturnUrl(
      rawReturnUrl,
      buyOrder,
      '/checkout/resultado',
      provider.name,
    );
    const result = await provider.init(buyOrder, sessionId, total, returnUrl, shipping.email);

    try {
      await saveCheckoutSession({
        buyOrder,
        sessionId,
        cart: verifiedCart,
        total,
        provider: provider.name,
        shipping,
        billing: billing ?? null,
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
        codigoCreador: codigoCreador ?? null,
        retornoFrascosDeclarados: retornoFrascosDeclarados ?? 0,
        attemptKey: attemptKey ?? null,
        pspUrl: result.url,
        pspToken: result.token,
      });
    } catch (saveError) {
      // Carrera de doble clic: otro request con la misma clave ya creó la sesión.
      if (attemptKey && saveError instanceof Error && /duplicate key/i.test(saveError.message)) {
        const raced = await lookupCheckoutAttempt(attemptKey, attemptClienteId);
        if (raced.kind === 'replay') return c.json(checkoutAttemptReplayJson(raced.replay));
      }
      throw saveError;
    }

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
      descuentoCreadorClp,
      loyaltyPointsRedeemed,
      provider: provider.name,
      buyerMode: effectiveBuyerMode,
    });
  } catch (error) {
    console.error('[Checkout init] Error inesperado al iniciar pago:', error);
    return c.json({
      code: "init_failed",
      message: "No fue posible iniciar el proceso de pago. Intenta de nuevo en unos minutos.",
    }, 500);
  }
});

checkoutRoutes.post("/commit", zValidator("json", CommitBodySchema), async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.checkout);
  if (rateLimitResult) return rateLimitResult;

  try {
    const { token_ws, buyOrder: clientBuyOrder, provider: requestedProvider } = c.req.valid("json");
    const provider = requestedProvider
      ? getPaymentProviderByName(requestedProvider)
      : getPaymentProvider();
    const result = await provider.commit(token_ws);

    if (!result.authorized) {
      const isCanceled = Boolean(result.raw?.canceled || result.raw?.status === 4);
      return c.json({
        ok: false,
        authorized: false,
        canceled: isCanceled,
        code: isCanceled ? 'payment_canceled' : 'payment_not_authorized',
        message: isCanceled
          ? 'El pago fue cancelado en la pasarela.'
          : 'El pago no fue autorizado por la pasarela.',
        result: result.raw,
      }, 200);
    }

    const buyOrder = result.buyOrder?.trim();
    if (!buyOrder) {
      return c.json({ ok: false, authorized: true, error: 'Proveedor no devolvió buyOrder' }, 200);
    }

    if (clientBuyOrder && clientBuyOrder !== buyOrder) {
      console.warn(`[Checkout commit] buyOrder mismatch client=${clientBuyOrder} provider=${buyOrder}`);
      return c.json({ code: 'buy_order_mismatch', message: 'buyOrder no coincide con el proveedor de pago' }, 400);
    }

    const admin = createAdminClient({ persistSession: false });
    const session = await getCheckoutSessionByBuyOrder(buyOrder);
    const settled = await settleCheckout(admin, {
      buyOrder,
      session,
      authorizationCode: result.authorizationCode,
      paymentProvider: provider.name,
      allowForceStock: true, // Pago autorizado en pasarela: asentar la venta siempre
    });

    if (settled.notFound) {
      console.error(`Checkout session not found for buyOrder: ${buyOrder}. Payment authorized but order not persisted.`);
      return c.json({
        ok: false,
        authorized: true,
        error: 'Sesión de checkout expirada. Contacta soporte con orden ' + buyOrder,
        buyOrder,
      }, 200);
    }

    if (settled.processing) {
      return c.json({
        ok: true,
        authorized: true,
        buyOrder,
        total: session?.total,
        cart: session?.cart,
        processing: true,
        result: result.raw,
      }, 200);
    }

    if (!settled.ok) {
      const stockDetail = settled.stockErrors?.length
        ? ` Stock: ${settled.stockErrors.join('; ')}.`
        : '';
      return c.json({
        ok: false,
        authorized: true,
        error:
          'Pago autorizado pero no se pudo registrar la venta.' +
          stockDetail +
          ' Contacta soporte con orden ' +
          buyOrder,
        stockErrors: settled.stockErrors,
        buyOrder,
      }, 200);
    }

    return c.json({
      ok: true,
      authorized: true,
      buyOrder,
      total: session?.total,
      cart: session?.cart,
      ventaId: settled.ventaId,
      alreadyProcessed: settled.alreadyProcessed ?? false,
      result: result.raw,
    }, 200);
  } catch (error) {
    console.error('[Checkout commit] Error inesperado:', error);
    return c.json({
      code: "commit_failed",
      message: "No fue posible verificar el pago con la pasarela. Por favor intenta nuevamente.",
    }, 500);
  }
});

checkoutRoutes.get("/webhook/flow", (c) => {
  return c.json({ ok: true, service: "flow-webhook" }, 200);
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
      // Cargo recurrente fallido: marcar past_due de inmediato (el cron de 7
      // días es el backstop) para que el cliente vea "Regularizar pago" pronto.
      const failedBuyOrder = result.buyOrder?.trim();
      if (failedBuyOrder?.startsWith('SUB-')) {
        try {
          const admin = createAdminClient({ persistSession: false });
          const { data: subRow } = await admin
            .from('subscriptions')
            .select('id')
            .eq('flow_inscription_buy_order', failedBuyOrder)
            .maybeSingle();
          if (subRow) {
            await admin.from('subscriptions').update({ status: 'past_due' }).eq('id', subRow.id);
            console.warn(`[webhook/flow] cargo recurrente fallido → past_due (${failedBuyOrder})`);
          }
        } catch (err) {
          console.error('[webhook/flow] failed recurring charge handling:', err);
        }
      }
      return c.json({ ok: true, status: 'not_paid' }, 200);
    }

    const buyOrder = result.buyOrder;
    if (!buyOrder) {
      return c.json({ error: 'Falta commerceOrder en respuesta Flow' }, 400);
    }

    if (buyOrder.startsWith('SUB-')) {
      // Primer pago (sesión pending) o cargo recurrente (mismo commerceOrder).
      // amount opcional → auditoría; el roll de período es por flow_order.
      const raw = result.raw as { paymentData?: { amount?: number } } | undefined;
      const rawAmount = Number(raw?.paymentData?.amount);
      const subResult = await fulfillSubscriptionFromWebhook(
        buyOrder,
        result.authorizationCode,
        Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : undefined,
      );
      if (subResult.ok) {
        return c.json({ ok: true, status: subResult.status }, 200);
      }
      console.error(`[webhook/flow] SUB fulfill failed: ${subResult.error}`);
      return c.json({ error: subResult.error }, (subResult.status ?? 500) as 400 | 404 | 500);
    }

    const admin = createAdminClient({ persistSession: false });
    const session = await getCheckoutSessionByBuyOrder(buyOrder);
    const settled = await settleCheckout(admin, {
      buyOrder,
      session,
      authorizationCode: result.authorizationCode,
      paymentProvider: 'flow',
      allowForceStock: true, // Pago autorizado en pasarela: asentar la venta siempre
    });

    if (settled.notFound) {
      console.error(`Flow webhook: session and venta not found for buyOrder ${buyOrder}`);
      return c.json({ error: 'Sesión no encontrada' }, 404);
    }

    if (settled.processing) {
      return c.json({ ok: true, status: 'processing' }, 200);
    }

    if (!settled.ok) {
      return c.json({ error: 'Error guardando venta' }, 500);
    }

    return c.json({
      ok: true,
      status: settled.alreadyProcessed ? 'already_processed' : 'confirmed',
      ventaId: settled.ventaId,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    console.error('Flow webhook error:', message);
    return c.json({ error: message }, 500);
  }
});

// ---------------------------------------------------------------------------
// Admin go-live (config-en-UI: estado visible; secretos permanecen en Vercel)
// ---------------------------------------------------------------------------

const adminCheckout = new Hono<{ Variables: AppVariables }>();
adminCheckout.use("*", authMiddleware, tenantMiddleware, requireProfileRole("admin"));

adminCheckout.get("/checklist", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const minFolios = getCafMinFolios();

  let cafFoliosRestantes: number | null = null;
  try {
    cafFoliosRestantes = await getFoliosRestantes(
      supabase,
      empresaId,
      DTE_TIPO.BOLETA_ELECTRONICA,
    );
  } catch {
    // Keep null fallback on error
  }

  let stalePendingSessions: number | null = null;
  try {
    const admin = createAdminClient({ persistSession: false });
    const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
    const { count } = await admin
      .from("checkout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", cutoff);
    stalePendingSessions = count ?? 0;
  } catch {
    // Keep null fallback on error
  }

  const status = buildPagosGoLiveChecklist({
    cafFoliosRestantes,
    cafMinFolios: minFolios,
    stalePendingSessions,
  });

  return c.json({ data: status });
});

adminCheckout.get("/sessions", async (c) => {
  const admin = createAdminClient({ persistSession: false });
  const limit = Math.min(Number(c.req.query("limit") ?? 30), 100);
  const statusFilter = c.req.query("status"); // pending | completed | expired

  let q = admin
    .from("checkout_sessions")
    .select("id, buy_order, provider, status, total, created_at, completed_at, buyer_mode")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter) {
    q = q.eq("status", statusFilter);
  }

  const { data, error } = await q;

  if (error) {
    return c.json({ code: "sessions_query_failed", message: error.message }, 500);
  }

  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  const pending = (data ?? []).filter((s) => s.status === "pending").length;
  const completed = (data ?? []).filter((s) => s.status === "completed").length;
  const expired = (data ?? []).filter((s) => s.status === "expired").length;
  const stalePending = (data ?? []).filter(
    (s) => s.status === "pending" && s.created_at < cutoff,
  ).length;

  // Global pending count (not limited to page)
  const { count: pendingGlobal } = await admin
    .from("checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: staleGlobal } = await admin
    .from("checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", cutoff);

  return c.json({
    data: {
      sessions: data ?? [],
      counts: {
        pending,
        completed,
        expired,
        stalePending,
        total: data?.length ?? 0,
        pendingGlobal: pendingGlobal ?? 0,
        staleGlobal: staleGlobal ?? 0,
      },
    },
  });
});

/**
 * Expire abandoned pending sessions (>30m) and release stock holds.
 * Safe ops action for go-live: does not invent payments.
 */
adminCheckout.post("/sessions/expire-stale", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as {
      olderThanMinutes?: number;
      limit?: number;
    };
    const result = await expireStaleCheckoutSessions({
      olderThanMinutes: body.olderThanMinutes,
      limit: body.limit,
    });
    const healed = result.skippedPaid?.length ?? 0;
    return c.json({
      data: result,
      message:
        healed > 0
          ? `${result.expired} expirada(s); ${healed} pagada(s) cerrada(s) a completed; stock liberado`
          : `${result.expired} sesión(es) expirada(s); stock liberado`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "expire failed";
    return c.json({ code: "expire_failed", message }, 500);
  }
});

/**
 * Movimiento 1 — integridad de pagos web: cruza checkout_sessions con ventas
 * para detectar brechas del ciclo dinero:
 * - sesiones completed SIN venta (pago cobrado y no registrado → dinero perdido)
 * - sesiones pending antiguas (webhook perdido o pago no completado)
 * - ventas web SIN sesión completed (anomalía o canal distinto)
 */
adminCheckout.get("/integrity", async (c) => {
  try {
    const admin = createAdminClient({ persistSession: false });
    const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();

    const { data: completedSessions } = await admin
      .from("checkout_sessions")
      .select("buy_order, total, provider, created_at, completed_at")
      .eq("status", "completed")
      .limit(200);

    const completedOrders = ((completedSessions ?? []) as Array<{ buy_order: string }>).map((s) => s.buy_order);
    const { data: ventasCompleted } = completedOrders.length
      ? await admin.from("ventas").select("buy_order").in("buy_order", completedOrders)
      : { data: [] };

    const ventaOrders = new Set(
      ((ventasCompleted ?? []) as Array<{ buy_order: string | null }>)
        .map((v) => v.buy_order)
        .filter((b): b is string => Boolean(b)),
    );
    const sessionsSinVenta = ((completedSessions ?? []) as Array<Record<string, unknown>>).filter(
      (s) => !ventaOrders.has(s.buy_order as string),
    );

    const { data: stalePending } = await admin
      .from("checkout_sessions")
      .select("buy_order, total, created_at")
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .limit(100);

    const { data: ventasWeb } = await admin
      .from("ventas")
      .select("id, buy_order, total, created_at")
      .eq("origen", "web")
      .limit(200);

    const ventasWebOrders = ((ventasWeb ?? []) as Array<{ buy_order: string | null }>)
      .map((v) => v.buy_order)
      .filter((b): b is string => Boolean(b));
    const { data: sessionsMatched } = ventasWebOrders.length
      ? await admin.from("checkout_sessions").select("buy_order").in("buy_order", ventasWebOrders)
      : { data: [] };

    const sessionOrders = new Set(
      ((sessionsMatched ?? []) as Array<{ buy_order: string }>).map((s) => s.buy_order),
    );
    const ventasSinSesion = ((ventasWeb ?? []) as Array<Record<string, unknown>>).filter(
      (v) => !v.buy_order || !sessionOrders.has(v.buy_order as string),
    );

    return c.json({
      data: {
        sessionsSinVenta: sessionsSinVenta.map((s) => ({
          buyOrder: s.buy_order,
          total: s.total,
          completedAt: s.completed_at,
        })),
        stalePending: ((stalePending ?? []) as Array<Record<string, unknown>>).map((s) => ({
          buyOrder: s.buy_order,
          total: s.total,
          createdAt: s.created_at,
        })),
        ventasSinSesionCompletada: ventasSinSesion.map((v) => ({
          ventaId: v.id,
          buyOrder: v.buy_order ?? null,
          total: v.total,
        })),
        totales: {
          sesionesCompletadas: (completedSessions ?? []).length,
          sesionesCompletadasSinVenta: sessionsSinVenta.length,
          pendingStale: (stalePending ?? []).length,
          ventasWeb: (ventasWeb ?? []).length,
          ventasWebSinSesion: ventasSinSesion.length,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "integrity check failed";
    console.error("[checkout/integrity]", message);
    return c.json({ code: "integrity_failed", message }, 500);
  }
});

/**
 * Ops: if payment authorized but fulfill never ran, session still pending —
 * re-run fulfill from stored session. Does NOT call payment provider again.
 * Requires venta not already present (fulfillCheckout is idempotent on buy_order).
 */
adminCheckout.post("/sessions/:buyOrder/retry-fulfill", async (c) => {
  try {
    const buyOrder = c.req.param("buyOrder");
    const body = await c.req.json().catch(() => ({})) as {
      authorizationCode?: string;
    };
    const authCode = body.authorizationCode?.trim() || "ADMIN_RETRY";

    const admin = createAdminClient({ persistSession: false });
    const session = await getCheckoutSessionByBuyOrder(buyOrder);
    const settled = await settleCheckout(admin, {
      buyOrder,
      session,
      authorizationCode: authCode,
      paymentProvider: session?.provider,
    });

    if (settled.notFound) {
      return c.json(
        {
          code: "session_not_found",
          message:
            "No hay sesión ni venta registrada para esa orden (buy_order inválido)",
        },
        404,
      );
    }

    if (settled.processing) {
      return c.json(
        {
          code: "fulfill_in_progress",
          message: "Otra liquidación está en curso; reintenta en unos segundos",
        },
        202,
      );
    }

    if (!settled.ok) {
      return c.json(
        {
          code: "fulfill_failed",
          message: "Fulfill falló",
          stockErrors: settled.stockErrors,
        },
        409,
      );
    }

    return c.json({
      data: {
        ventaId: settled.ventaId,
        alreadyProcessed: settled.alreadyProcessed ?? false,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "retry fulfill failed";
    return c.json({ code: "retry_failed", message }, 500);
  }
});

checkoutRoutes.route("/admin", adminCheckout);
