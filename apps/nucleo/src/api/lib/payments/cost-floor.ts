import type { SupabaseClient } from "@supabase/supabase-js";
import { validateTotalAboveCost } from "@enjambre/pricing";
import type { CartLineInput } from "./types";

/**
 * Piso de costo en checkout: el neto (precios verificados menos todos los
 * descuentos) nunca queda bajo el costo de receta conocido.
 * Fail-open: sin recetas o si falla la consulta, la venta continúa y se
 * registra advertencia (el Tablero de Salud/Costeo evidencia la cobertura).
 */
export async function enforceCostFloor(
  admin: SupabaseClient,
  cart: CartLineInput[],
  descuentoTotalClp: number,
): Promise<{ ok: true } | { ok: false; faltante: number }> {
  if (cart.length === 0) return { ok: true };

  const ids = [...new Set(cart.map((line) => line.productId))];
  try {
    const { data, error } = await admin
      .from("recipe_costing_view")
      .select("producto_id, costo_frasco")
      .in("producto_id", ids);

    if (error || !data) {
      console.warn("[cost-floor] sin datos de costeo, venta continúa:", error?.message ?? "sin filas");
      return { ok: true };
    }

    const costos = new Map(
      (data as Array<{ producto_id: string; costo_frasco: string | number | null }>).map((row) => [
        row.producto_id,
        Number(row.costo_frasco),
      ]),
    );

    const resultado = validateTotalAboveCost(
      cart.map((line) => {
        const costo = costos.get(line.productId);
        return {
          costoUnitario: costo != null && Number.isFinite(costo) && costo > 0 ? costo : null,
          cantidad: line.quantity,
          precioUnitario: line.unitPrice,
        };
      }),
      descuentoTotalClp,
    );

    if (!resultado.ok) return { ok: false, faltante: resultado.faltante };
    if (resultado.cobertura < 1) {
      console.warn(`[cost-floor] cobertura parcial de recetas: ${resultado.cobertura * 100}%`);
    }
    return { ok: true };
  } catch (err) {
    console.warn("[cost-floor] error consultando costeo, venta continúa:", err);
    return { ok: true };
  }
}
