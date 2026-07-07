import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import {
  assessFacturaDteReadiness,
  triggerFacturaDteEmission,
} from "@/api/lib/fiscal/trigger-factura-dte";
import { emitFacturaDteFromRow } from "@/api/lib/fiscal/emit-factura-dte-from-row";

const CreateFacturaEmitidaSchema = z.strictObject({
  numero: z.string().min(1),
  fecha: z.string().min(1),
  fechaVencimiento: z.string().optional(),
  montoTotal: z.number().positive(),
  montoNeto: z.number().nonnegative(),
  montoIva: z.number().nonnegative(),
  montoExento: z.number().nonnegative().default(0),
  montoIvaUsado: z.number().nonnegative().default(0),
  descripcion: z.string().optional(),
  tipoDocumento: z.enum(["Factura", "Nota de Crédito", "Nota de Débito", "Boleta", "Otro"]).default("Factura"),
  clienteId: z.string().uuid().optional(),
});

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
  const parsed = CreateFacturaEmitidaSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const fechaDate = new Date(body.fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  const periodoResult = await supabase
  .from("periodos_contables")
  .select("id")
  .eq("empresa_id", empresaId)
  .eq("mes", mes)
  .eq("anio", anio)
  .maybeSingle();

  const { error: periodoError } = periodoResult;
  let { data: periodo } = periodoResult;

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
    tercero_id: body.clienteId ?? null,
    periodo_id: periodo.id,
    numero: body.numero,
    fecha_emision: body.fecha,
    fecha_vencimiento: body.fechaVencimiento ?? null,
    monto_neto: body.montoNeto,
    monto_iva: body.montoIva,
    monto_total: body.montoTotal,
    monto_exento: body.montoExento,
    monto_iva_usado: body.montoIvaUsado,
    descripcion: body.descripcion ?? null,
    tipo_documento: body.tipoDocumento,
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

  if (['Factura', 'Nota de Crédito', 'Nota de Débito'].includes(body.tipoDocumento)) {
    void triggerFacturaDteEmission(supabase, empresaId, data.id as string);
  }

  return c.json(data, 201);
});

facturasEmitidasRoutes.post("/:id/emitir-dte", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const readiness = await assessFacturaDteReadiness(supabase, empresaId, facturaId);
  if (!readiness.tipoDte) {
    return c.json({ code: "tipo_sin_dte", message: "Este tipo de documento no admite DTE automático" }, 400);
  }
  if (!readiness.ready) {
    return c.json({
      code: "dte_no_listo",
      message: "Faltan requisitos SII (CAF, certificado o datos del tercero)",
      reasons: readiness.reasons,
    }, 400);
  }

  const result = await emitFacturaDteFromRow(supabase, empresaId, facturaId, readiness.tipoDte);
  if (!result.ok) {
    return c.json({ code: result.code, message: result.message ?? "Error al emitir DTE" }, 500);
  }

  const { data: updated } = await supabase
    .from("facturas_emitidas")
    .select("id, estado_sii, folio, track_id, tipo_dte")
    .eq("id", facturaId)
    .single();

  return c.json({ ok: true, data: updated });
});
