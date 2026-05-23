import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

export const facturasEmitidasRoutes = new Hono<{
  Variables: AppVariables;
}>();

facturasEmitidasRoutes.use("*", authMiddleware, tenantMiddleware);

facturasEmitidasRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodoId = c.req.query("periodoId");

  let query = supabase
    .from("facturas_emitidas")
.select("*, tercero:terceros!facturas_emitidas_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
      .eq("empresa_id", empresaId)
      .order("fecha_emision", { ascending: false });

  if (periodoId) {
    query = query.eq("periodo_id", periodoId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json(data ?? []);
});

facturasEmitidasRoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const body = await c.req.json();

  const {
    numero,
    fecha,
    fechaVencimiento,
    montoTotal,
    montoNeto,
    montoIva,
    montoExento = 0,
    montoIvaUsado = 0,
    descripcion,
    tipoDocumento = "Factura",
    clienteId,
  } = body;

  const fechaDate = new Date(fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  let { data: periodo, error: periodoError } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("mes", mes)
    .eq("anio", anio)
    .maybeSingle();

  if (periodoError) {
    return c.json({ code: "periodo_lookup_failed", message: periodoError.message }, 500);
  }

  const periodoDefaults = {
    ingresos_netos: 0, egresos_netos: 0, utilidad_bruta: 0,
    utilidad_neta: 0, iva_debito: 0, iva_credito: 0, iva_pagar: 0, ppm_calculado: 0,
  };

  if (!periodo) {
    const { data: newPeriodo, error: createError } = await supabase
      .from("periodos_contables")
      .insert({ empresa_id: empresaId, mes, anio, estado: "abierto", ...periodoDefaults })
      .select("id")
      .single();

    if (createError) {
      return c.json({ code: "periodo_create_failed", message: createError.message }, 500);
    }
    periodo = newPeriodo;
  }

  const payload = {
    empresa_id: empresaId,
    tercero_id: clienteId ?? null,
    periodo_id: periodo.id,
    numero,
    fecha_emision: fecha,
    fecha_vencimiento: fechaVencimiento ?? null,
    monto_neto: montoNeto,
    monto_iva: montoIva,
    monto_total: montoTotal,
    monto_exento: montoExento,
    monto_iva_usado: montoIvaUsado,
    descripcion: descripcion ?? null,
    tipo_documento: tipoDocumento,
    estado: "pendiente",
  };

  const { data, error } = await supabase
    .from("facturas_emitidas")
    .insert(payload)
    .select("*, tercero:terceros!facturas_emitidas_tercero_id_fkey(id, nombre, rut), periodo:periodos_contables(nombre)")
    .single();

  if (error) {
    return c.json({ code: "factura_create_failed", message: error.message }, 400);
  }

  return c.json(data, 201);
});
