import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { calcularIVA } from "@enjambre/contable";

const CreateGastoSchema = z.strictObject({
  fecha: z.string().min(1),
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  montoIva: z.number().nonnegative().optional(),
  montoNeto: z.number().nonnegative().optional(),
  categoria: z.string().min(1),
  tipoComprobante: z.enum(["Boleta", "Factura", "Nota de Crédito", "Otro"]).default("Boleta"),
  numeroComprobante: z.string().optional(),
  proveedorId: z.string().uuid().optional(),
  estado: z.enum(["pendiente", "pagado", "anulado"]).default("pendiente"),
});

export const gastosRoutes = new Hono<{
  Variables: AppVariables;
}>();

gastosRoutes.use("*", authMiddleware, tenantMiddleware);

gastosRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodoId = c.req.query("periodoId");

  let query = supabase
    .from("gastos")
    .select("*, proveedor:terceros!gastos_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  if (periodoId) {
    query = query.eq("periodo_id", periodoId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

gastosRoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const parsed = CreateGastoSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const computedIva = body.montoIva ?? calcularIVA(body.monto);
  const computedNeto = body.montoNeto ?? (body.monto - computedIva);

  const fechaDate = new Date(body.fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  let { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("mes", mes)
    .eq("anio", anio)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriodo } = await supabase
      .from("periodos_contables")
      .insert({
        empresa_id: empresaId, mes, anio, estado: "abierto",
        ingresos_netos: 0, egresos_netos: 0, utilidad_bruta: 0,
        utilidad_neta: 0, iva_debito: 0, iva_credito: 0, iva_pagar: 0, ppm_calculado: 0,
      })
      .select("id")
      .single();
    periodo = newPeriodo;
  }

  const payload = {
    empresa_id: empresaId,
    tercero_id: body.proveedorId ?? null,
    periodo_id: periodo?.id,
    fecha: body.fecha,
    descripcion: body.descripcion,
    monto: body.monto,
    monto_total: body.monto,
    monto_iva: computedIva,
    monto_neto: computedNeto,
    categoria: body.categoria,
    tipo_comprobante: body.tipoComprobante,
    numero_comprobante: body.numeroComprobante ?? null,
    estado: body.estado,
  };

  const { data, error } = await supabase
    .from("gastos")
    .insert(payload)
    .select("*, proveedor:terceros!gastos_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .single();

  if (error) {
    return c.json({ code: "gasto_create_failed", message: error.message }, 400);
  }

  return c.json(data, 201);
});
