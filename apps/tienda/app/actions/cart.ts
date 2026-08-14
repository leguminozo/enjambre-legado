'use server'

import {
  computeCartPricing,
  normalizeCommercialRole,
  type CartPricing,
  type ComputedLineItem,
  type PricingCartItemInput,
  type PricingProductRow,
} from '@enjambre/pricing'
import { createClient } from '@/utils/supabase/server'
// Solo exportar la función acción: los type-only exports en archivos "use
// server" se registran como server references por el Flight loader de Next y
// explotan en runtime (ReferenceError: CartPricing is not defined) al no
// existir binding. Los tipos se importan directo de @enjambre/pricing.
type CartItemInput = PricingCartItemInput

export async function calculateCartPricing(items: CartItemInput[]): Promise<CartPricing> {
  if (!items.length) {
    return { subtotal: 0, discount_amount: 0, total: 0, line_items: [] }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // El rol de PRICING sale SOLO del JWT (app_metadata.oyz_role, puesto por el
  // hook custom_access_token): el fallback por header x-oyz-role de
  // resolveOyzRole sirve para render, pero en server actions el cliente puede
  // enviar headers custom y autodeclararse embajador (30% off). Un carrito
  // anónimo (sin JWT) siempre es comprador.
  const role = normalizeCommercialRole(
    user?.app_metadata?.oyz_role as string | undefined,
  );

  // Multiplicadores desde la config central (beneficios_enjambre): el admin
  // de núcleo los corrige sin deploy; la fila ausente cae al default histórico.
  const { data: configRows } = await supabase
    .from('beneficios_enjambre')
    .select('clave, valor_numerico');
  const config = new Map(
    (configRows ?? []).map((r) => [String(r.clave), Number(r.valor_numerico)]),
  );
  const multipliers = {
    embajador: config.get('mult_embajador') ?? 0.7,
    revendedor: config.get('mult_revendedor') ?? 0.8,
    suscriptor: config.get('mult_suscriptor') ?? 0.9,
    volumen: config.get('mult_volumen') ?? 0.95,
    volumenPedidos: config.get('volumen_pedidos') ?? 10,
  };

  const productIds = items.map((i) => i.product_id);

  const productsPromise = supabase
    .from('productos')
    .select('id, nombre, slug, precio')
    .in('id', productIds);

  let pastOrdersCount = 0;
  if (user && (role === 'revendedor' || role === 'embajador')) {
    const { count } = await supabase
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    pastOrdersCount = count ?? 0;
  }

  const { data: products, error: productsError } = await productsPromise;
  if (productsError) {
    throw new Error('No se pudieron consultar los productos');
  }

  // slug/precio nulos o string → checkout init Zod 400 / precios fantasma
  const rows: PricingProductRow[] = (products ?? []).map((p) => {
    const id = String(p.id);
    const precioRaw = p.precio;
    const precio =
      typeof precioRaw === 'number'
        ? precioRaw
        : typeof precioRaw === 'string'
          ? Number(precioRaw)
          : 0;
    return {
      id,
      nombre: p.nombre ?? 'Producto',
      slug: (typeof p.slug === 'string' && p.slug.trim()) || id,
      precio: Number.isFinite(precio) ? precio : 0,
    };
  });

  return computeCartPricing(items, rows, role, pastOrdersCount, multipliers);
}