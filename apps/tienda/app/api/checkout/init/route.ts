import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getPaymentProvider, saveCheckoutSession, type CartLineInput, type ShippingInfo } from '@/lib/payments';
import { z } from 'zod';

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
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = InitBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { cart, shipping, returnUrl: rawReturnUrl } = parsed.data;
    const returnUrl = rawReturnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado`;

    const admin = createAdminClient();
    const productIds = cart.map((line) => line.productId);

    const { data: products, error: fetchError } = await admin
      .from('productos')
      .select('id, precio, stock, nombre, visible')
      .in('id', productIds);

    if (fetchError) {
      return NextResponse.json({ error: 'Error consultando productos' }, { status: 500 });
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

      const serverPrice = product.precio;
      if (line.unitPrice !== serverPrice) {
        errors.push(`Producto ${product.nombre}: precio cambió de $${line.unitPrice} a $${serverPrice}`);
        continue;
      }

      verifiedCart.push({
        productId: line.productId,
        slug: line.slug,
        name: product.nombre,
        unitPrice: serverPrice,
        quantity: line.quantity,
      });

      serverTotal += serverPrice * line.quantity;
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Algunos productos tienen problemas', details: errors, verifiedCart },
        { status: 409 },
      );
    }

    if (verifiedCart.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío después de verificación' }, { status: 400 });
    }

    const total = Math.max(1, Math.round(serverTotal));
    const buyOrder = `ORD-${Date.now()}`;
    const sessionId = `sess-${Date.now()}`;

    const provider = getPaymentProvider();
    const result = await provider.init(buyOrder, sessionId, total, returnUrl, shipping.email);

    saveCheckoutSession({
      buyOrder,
      sessionId,
      cart: verifiedCart,
      total,
      provider: provider.name,
      shipping,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      url: result.url,
      token: result.token,
      buyOrder: result.buyOrder,
      sessionId: result.sessionId,
      total,
      provider: provider.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
