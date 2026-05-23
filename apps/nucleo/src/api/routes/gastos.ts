import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { calcularIVA } from "@enjambre/contable";

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
  const body = await c.req.json();

  const {
    fecha,
    descripcion,
    monto,
    montoIva,
    montoNeto,
    categoria,
    tipoComprobante = "Boleta",
    numeroComprobante,
    proveedorId,
    estado = "pendiente",
  } = body;

  const computedIva = montoIva ?? calcularIVA(monto);
  const computedNeto = montoNeto ?? (monto - computedIva);

  const fechaDate = new Date(fecha);
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
    tercero_id: proveedorId ?? null,
    periodo_id: periodo?.id,
    fecha,
    descripcion,
    monto,
    monto_total: monto,
    monto_iva: computedIva,
    monto_neto: computedNeto,
    categoria,
    tipo_comprobante: tipoComprobante,
    numero_comprobante: numeroComprobante ?? null,
    estado,
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
