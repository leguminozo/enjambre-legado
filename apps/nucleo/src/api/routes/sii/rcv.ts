import { Hono } from "hono";
import type { RcvTipoRegistro } from "@enjambre/contable";
import { syncRcvPeriod } from "@/api/lib/fiscal/rcv-sync";
import type { AppVariables } from "@/api/lib/middleware";

export const rcvRoutes = new Hono<{ Variables: AppVariables }>();

rcvRoutes.get("/:periodo", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodo = c.req.param("periodo");
  const tipo = (c.req.query("tipo") ?? "compras") as RcvTipoRegistro;

  if (!/^\d{6}$/.test(periodo)) {
    return c.json({ code: "invalid_period", message: "Periodo debe ser YYYYMM (ej: 202606)" }, 400);
  }

  if (tipo !== "compras" && tipo !== "ventas") {
    return c.json({ code: "invalid_tipo", message: "tipo debe ser 'compras' o 'ventas'" }, 400);
  }

  const { data: existing } = await supabase
    .from("rcv_sync")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("periodo", periodo)
    .eq("tipo_registro", tipo)
    .maybeSingle();

  if (existing) {
    const { data: registros } = await supabase
      .from("rcv_registros")
      .select("*")
      .eq("rcv_sync_id", (existing as { id: string }).id)
      .order("fecha_emision", { ascending: false });

    return c.json({ data: { sync: existing, registros: registros ?? [] } });
  }

  return c.json({ data: { sync: null, registros: [] } });
});

rcvRoutes.post("/:periodo/sync", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodo = c.req.param("periodo");
  const tipo = (c.req.query("tipo") ?? "compras") as RcvTipoRegistro;

  if (!/^\d{6}$/.test(periodo)) {
    return c.json({ code: "invalid_period", message: "Periodo debe ser YYYYMM (ej: 202606)" }, 400);
  }

  if (tipo !== "compras" && tipo !== "ventas") {
    return c.json({ code: "invalid_tipo", message: "tipo debe ser 'compras' o 'ventas'" }, 400);
  }

  const synced = await syncRcvPeriod(supabase, empresaId, periodo, tipo);

  if (!synced.ok) {
    const status =
      synced.code === "empresa_not_found" ? 404 :
      synced.code === "no_certificado" ? 400 :
      500;
    return c.json({ code: synced.code, message: synced.message }, status);
  }

  const { data: sync } = await supabase
    .from("rcv_sync")
    .select("*")
    .eq("id", synced.syncId)
    .single();

  const { data: registros } = await supabase
    .from("rcv_registros")
    .select("*")
    .eq("rcv_sync_id", synced.syncId)
    .order("fecha_emision", { ascending: false });

  return c.json({
    data: {
      sync,
      registros: registros ?? [],
      reconciledCount: synced.reconciledCount,
    },
  });
});