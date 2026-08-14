export type OyzCommercialRole = "comprador" | "suscriptor" | "revendedor" | "embajador";

export type PricingCartItemInput = {
  product_id: string;
  quantity: number;
};

export type PricingProductRow = {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
};

export type ComputedLineItem = {
  product_id: string;
  name: string;
  slug: string;
  unit_price: number;
  base_price: number;
  quantity: number;
  line_total: number;
};

export type CartPricing = {
  subtotal: number;
  discount_amount: number;
  total: number;
  line_items: ComputedLineItem[];
};

const COMMERCIAL_ROLES = new Set<OyzCommercialRole>([
  "comprador",
  "suscriptor",
  "revendedor",
  "embajador",
]);

// Valores de negocio configurables desde núcleo (tabla beneficios_enjambre).
// Defaults = valores históricos hardcodeados; los apps pueden pasar los suyos
// desde la config central para que el hub y el checkout nunca diverjan.
export type PricingMultipliers = {
  embajador: number;
  revendedor: number;
  suscriptor: number;
  volumen: number;
  volumenPedidos: number;
};

export const DEFAULT_MULTIPLIERS: PricingMultipliers = {
  embajador: 0.70,
  revendedor: 0.80,
  suscriptor: 0.90,
  volumen: 0.95,
  volumenPedidos: 10,
};

export function normalizeCommercialRole(value: string | undefined | null): OyzCommercialRole {
  if (value && COMMERCIAL_ROLES.has(value as OyzCommercialRole)) {
    return value as OyzCommercialRole;
  }
  return "comprador";
}

export function resolvePricingMultipliers(
  role: OyzCommercialRole,
  pastOrdersCount: number,
  multipliers: PricingMultipliers = DEFAULT_MULTIPLIERS,
): { roleMultiplier: number; volumeMultiplier: number; finalMultiplier: number } {
  let roleMultiplier = 1.0;
  if (role === "embajador") roleMultiplier = multipliers.embajador;
  else if (role === "revendedor") roleMultiplier = multipliers.revendedor;
  else if (role === "suscriptor") roleMultiplier = multipliers.suscriptor;

  let volumeMultiplier = 1.0;
  if (
    (role === "revendedor" || role === "embajador") &&
    pastOrdersCount >= multipliers.volumenPedidos
  ) {
    volumeMultiplier = multipliers.volumen;
  }

  return {
    roleMultiplier,
    volumeMultiplier,
    finalMultiplier: roleMultiplier * volumeMultiplier,
  };
}

export function computeUnitPrice(
  basePrice: number,
  role: OyzCommercialRole,
  pastOrdersCount: number,
  multipliers: PricingMultipliers = DEFAULT_MULTIPLIERS,
): number {
  const { finalMultiplier } = resolvePricingMultipliers(role, pastOrdersCount, multipliers);
  return Math.round(basePrice * finalMultiplier);
}

export function computeCartPricing(
  items: PricingCartItemInput[],
  products: PricingProductRow[],
  role: OyzCommercialRole,
  pastOrdersCount: number,
  multipliers: PricingMultipliers = DEFAULT_MULTIPLIERS,
): CartPricing {
  if (!items.length) {
    return { subtotal: 0, discount_amount: 0, total: 0, line_items: [] };
  }

  const { finalMultiplier } = resolvePricingMultipliers(role, pastOrdersCount, multipliers);
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let total = 0;
  const lineItems: ComputedLineItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) continue;

    const basePrice = product.precio;
    const discountedPrice = Math.round(basePrice * finalMultiplier);
    const lineTotal = discountedPrice * item.quantity;

    subtotal += basePrice * item.quantity;
    total += lineTotal;

    lineItems.push({
      product_id: product.id,
      name: product.nombre,
      slug: product.slug,
      unit_price: discountedPrice,
      base_price: basePrice,
      quantity: item.quantity,
      line_total: lineTotal,
    });
  }

  return {
    subtotal,
    discount_amount: subtotal - total,
    total,
    line_items: lineItems,
  };
}