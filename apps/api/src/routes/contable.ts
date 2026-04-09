import { calcularIVA, calcularTotal, FacturaEmitidaInputSchema } from "@enjambre/contable";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "../types/hono";
import { authMiddleware } from "../middleware/auth";
import { tenantMiddleware } from "../middleware/tenant";

export const contableRoutes = new Hono<{
  Variables: AppVariables;
}>();

contableRoutes.use("*", authMiddleware, tenantMiddleware);

contableRoutes.get("/dashboard", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [facturasRes, gastosRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
    supabase
      .from("gastos")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
  ]);

  if (facturasRes.error || gastosRes.error) {
    return c.json(
      {
        code: "dashboard_query_failed",
        message: "No fue posible calcular el dashboard",
        details: {
          facturas: facturasRes.error?.message,
          gastos: gastosRes.error?.message,
        },
      },
      500,
    );
  }

  const ingresosNetos = (facturasRes.data ?? []).reduce(
    (acc: number, item: { monto_neto: number | null }) => acc + Number(item.monto_neto ?? 0),
    0,
  );
  const gastosNetos = (gastosRes.data ?? []).reduce(
    (acc: number, item: { monto_neto: number | null }) => acc + Number(item.monto_neto ?? 0),
    0,
  );
  const utilidadNeta = ingresosNetos - gastosNetos;

  return c.json({
    data: {
      empresaId,
      ingresosNetos,
      gastosNetos,
      utilidadNeta,
      totalFacturas: facturasRes.data?.length ?? 0,
      totalGastos: gastosRes.data?.length ?? 0,
    },
  });
});

contableRoutes.post(
  "/facturas-emitidas",
  zValidator("json", FacturaEmitidaInputSchema),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const montoIva = calcularIVA(input.monto_neto);
    const montoTotal = calcularTotal(input.monto_neto, montoIva);

    const payload = {
      empresa_id: empresaId,
      tercero_id: input.tercero_id,
      numero: input.numero,
      fecha_emision: input.fecha_emision,
      monto_neto: input.monto_neto,
      monto_iva: montoIva,
      monto_total: montoTotal,
      descripcion: input.descripcion ?? null,
      idempotency_key: input.idempotency_key ?? null,
    };

    const { data, error } = await supabase
      .from("facturas_emitidas")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return c.json(
        {
          code: "factura_create_failed",
          message: "No fue posible crear la factura",
          details: error.message,
        },
        400,
      );
    }

    return c.json({ data }, 201);
  },
);
