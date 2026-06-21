import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { postHonorarioDesdeLedger } from "./honorarios-desde-ledger";

export const honorariosRoutes = new Hono<{ Variables: AppVariables }>();

honorariosRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodoId = c.req.query("periodoId");

  let query = supabase
    .from("honorarios")
    .select("*, tercero:terceros(id, nombre, rut)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  if (periodoId) {
    query = query.eq("periodo_id", periodoId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "honorarios_query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

honorariosRoutes.post("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const body = await c.req.json<{
    fecha: string;
    monto_bruto: number;
    tercero_id?: string;
    numero_bhe?: string;
    descripcion: string;
    tasa_retencion?: number;
  }>();

  if (!body.fecha || !body.monto_bruto || !body.descripcion) {
    return c.json({ code: "validation_error", message: "fecha, monto_bruto y descripcion son requeridos" }, 400);
  }

  const tasa = body.tasa_retencion ?? 0.1525;
  const montoRetencion = Math.round(body.monto_bruto * tasa);

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
      .insert({ empresa_id: empresaId, mes, anio, estado: "abierto" })
      .select("id")
      .single();
    periodo = newPeriodo;
  }

  const { data, error } = await supabase
    .from("honorarios")
    .insert({
      empresa_id: empresaId,
      tercero_id: body.tercero_id ?? null,
      periodo_id: periodo?.id ?? null,
      fecha: body.fecha,
      monto_bruto: body.monto_bruto,
      monto_retencion: montoRetencion,
      tasa_retencion: tasa,
      numero_bhe: body.numero_bhe ?? null,
      descripcion: body.descripcion,
      estado: "pendiente",
    })
    .select("*, tercero:terceros(id, nombre, rut)")
    .single();

  if (error) {
    return c.json({ code: "honorario_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

honorariosRoutes.post("/desde-ledger", postHonorarioDesdeLedger);
