import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeCartPricing,
  normalizeCommercialRole,
  type CartPricing,
  type OyzCommercialRole,
  type PricingCartItemInput,
  type PricingProductRow,
} from "@enjambre/pricing";

export type BuyerPricingContext = {
  role: OyzCommercialRole;
  userId: string | null;
  pastOrdersCount: number;
};

export async function resolveBuyerPricingContext(
  admin: SupabaseClient,
  token?: string | null,
): Promise<BuyerPricingContext> {
  let role: OyzCommercialRole = "comprador";
  let userId: string | null = null;
  let pastOrdersCount = 0;

  if (token) {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
      role = normalizeCommercialRole(user.app_metadata?.oyz_role as string | undefined);

      if (role === "revendedor" || role === "embajador") {
        const { count } = await admin
          .from("ventas")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        pastOrdersCount = count ?? 0;
      }
    }
  }

  return { role, userId, pastOrdersCount };
}

export async function previewCartPricing(
  admin: SupabaseClient,
  items: PricingCartItemInput[],
  token?: string | null,
): Promise<CartPricing> {
  if (!items.length) {
    return { subtotal: 0, discount_amount: 0, total: 0, line_items: [] };
  }

  const { role, pastOrdersCount } = await resolveBuyerPricingContext(admin, token);
  const productIds = items.map((item) => item.product_id);

  const { data: products, error } = await admin
    .from("productos")
    .select("id, nombre, slug, precio")
    .in("id", productIds);

  if (error) {
    throw new Error("Error consultando productos");
  }

  return computeCartPricing(items, (products ?? []) as PricingProductRow[], role, pastOrdersCount);
}