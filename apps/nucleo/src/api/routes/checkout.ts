import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getPaymentProvider, saveCheckoutSession, getCheckoutSession, completeCheckoutSession } from "../lib/payments";
import type { CartLineInput } from "../lib/payments";
import { createClient } from "@supabase/supabase-js";

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

const WebhookBodySchema = z.record(z.string(), z.string());

const InitBodySchema = z.object({
  cart: z.array(CartLineSchema).min(1),
  shipping: ShippingSchema,
  returnUrl: z.string().url().optional(),
});

const CommitBodySchema = z.object({
  token_ws: z.string().min(1),
  buyOrder: z.string().min(1).optional(),
  provider: z.enum(['transbank', 'flow']).optional(),
});

export const checkoutRoutes = new Hono();

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

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for admin client');
  return createClient(url, key, { auth: { persistSession: false } });
}

checkoutRoutes.post("/init", zValidator("json", InitBodySchema), async (c) => {
  try {
    const { cart, shipping, returnUrl: rawReturnUrl } = c.req.valid("json");
    const admin = createAdminClient();
    const productIds = cart.map((line) => line.productId);

    // 1. Verify user and role from Authorization header securely
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
          const { data: pastOrders } = await admin.from('pedidos').select('id').eq('user_id', user.id);
          pastOrdersCount = pastOrders?.length || 0;
        }
      }
    }

    // 2. Fetch products
    const { data: products, error: fetchError } = await admin
      .from('productos')
      .select('id, precio, stock, nombre, visible')
      .in('id', productIds);

    if (fetchError) {
      return c.json({ code: "fetch_error", message: 'Error consultando productos' }, 500);
    }

    // 3. Compute multipliers
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

      // Compute discounted price server-side
      const basePrice = product.precio;
      const discountedPrice = Math.round(basePrice * finalMultiplier);

      if (line.unitPrice !== discountedPrice) {
        // Only error if the client submitted a mismatch against the DISCOUNTED price
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
    });

    return c.json({
      url: result.url,
      token: result.token,
      buyOrder: result.buyOrder,
      sessionId: result.sessionId,
      total,
      provider: provider.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar checkout';
    return c.json({ code: "init_failed", message }, 500);
  }
});

checkoutRoutes.post("/commit", zValidator("json", CommitBodySchema), async (c) => {
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

    const serverTotal = session.total;
    const cart = session.cart;
    const admin = createAdminClient();

    const { data: existingVenta } = await admin.from('ventas').select('id').eq('buy_order', buyOrder).maybeSingle();
    if (existingVenta) {
      return c.json({ ok: true, authorized: true, buyOrder, message: 'Venta ya procesada' }, 200);
    }

    const { error: ventaError } = await admin.from('ventas').insert({
      origen: 'web',
      estado: 'pagado',
      total: serverTotal,
      items: cart,
      metodo_pago: session.provider,
      buy_order: buyOrder,
      auth_code: result.authorizationCode,
      buyer_email: session.shipping?.email ?? null,
      direccion_envio: session.shipping ?? null,
    });

    if (ventaError) {
      console.error('Error persistiendo venta:', ventaError.message);
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
      console.error('Stock update errors:', stockErrors);
    }

    await completeCheckoutSession(buyOrder);

    // Contable Integration - Create Boleta Automáticamente
    const montoNeto = Math.round(serverTotal / 1.19);
    const montoIva = serverTotal - montoNeto;

    const { data: defaultEmpresa } = await admin.from('empresas').select('id').limit(1).single();
    if (defaultEmpresa) {
       await admin.from("facturas_emitidas").insert({
        empresa_id: defaultEmpresa.id,
        numero: `BWEB-${buyOrder}`,
        fecha_emision: new Date().toISOString().split('T')[0],
        monto_neto: montoNeto,
        monto_iva: montoIva,
        monto_total: serverTotal,
        monto_exento: 0,
        monto_iva_usado: 0,
        tipo_documento: "Boleta",
        descripcion: `Venta Web - ${buyOrder}`,
        estado: "pendiente",
      });
    }

    return c.json({
      ok: true,
      authorized: true,
      buyOrder,
      total: serverTotal,
      cart,
      result: result.raw,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar pago';
    return c.json({ code: "commit_failed", message }, 500);
  }
});

checkoutRoutes.post("/webhook/flow", zValidator("json", WebhookBodySchema), async (c) => {
  try {
    const raw = c.req.valid("json");
    const isValid = await verifyFlowSignature(raw);
    if (!isValid) {
      return c.json({ error: 'Firma inválida' }, 403);
    }

    const status = Number(raw.status);
    const FLOW_PAID = 2;

    if (status !== FLOW_PAID) {
      return c.json({ ok: true, status: 'ignored', message: `Estado Flow: ${status}` }, 200);
    }

    const buyOrder = raw.commerceOrder;
    if (!buyOrder) {
      return c.json({ error: 'Falta commerceOrder' }, 400);
    }

    const session = await getCheckoutSession(buyOrder);
    if (!session) {
      console.error(`Flow webhook: session not found for buyOrder ${buyOrder}`);
      return c.json({ error: 'Sesión no encontrada' }, 404);
    }

    if (session.provider !== 'flow') {
      return c.json({ error: 'Provider mismatch' }, 400);
    }

    const serverTotal = session.total;
    const cart = session.cart;
    const flowAmount = Number(raw.amount ?? 0);

    if (flowAmount > 0 && Math.round(flowAmount) !== serverTotal) {
      console.error(`Flow webhook: amount mismatch. Expected ${serverTotal}, got ${flowAmount}`);
      return c.json({ error: 'Monto no coincide' }, 409);
    }

    const admin = createAdminClient();
    
    const { data: existingVenta } = await admin.from('ventas').select('id').eq('buy_order', buyOrder).maybeSingle();
    if (existingVenta) {
      return c.json({ ok: true, status: 'already_processed' }, 200);
    }

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
      return c.json({ error: 'Error guardando venta' }, 500);
    }

    for (const line of cart) {
      const qty = Math.max(0, Number(line.quantity || 0));
      if (!qty) continue;
      await admin.rpc('decrement_stock', { p_id: line.productId, p_qty: qty });
    }

    await completeCheckoutSession(buyOrder);
    
    // Contable Integration
    const montoNeto = Math.round(serverTotal / 1.19);
    const montoIva = serverTotal - montoNeto;
    const { data: defaultEmpresa } = await admin.from('empresas').select('id').limit(1).single();
    if (defaultEmpresa) {
       await admin.from("facturas_emitidas").insert({
        empresa_id: defaultEmpresa.id,
        numero: `BWEB-${buyOrder}`,
        fecha_emision: new Date().toISOString().split('T')[0],
        monto_neto: montoNeto,
        monto_iva: montoIva,
        monto_total: serverTotal,
        monto_exento: 0,
        monto_iva_usado: 0,
        tipo_documento: "Boleta",
        descripcion: `Venta Web - ${buyOrder}`,
        estado: "pendiente",
      });
    }

    return c.json({ ok: true, status: 'confirmed' }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook';
    console.error('Flow webhook error:', message);
    return c.json({ error: message }, 500);
  }
});
