import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

export const dashboardRoutes = new Hono<{
  Variables: AppVariables;
}>();

dashboardRoutes.use("*", authMiddleware, tenantMiddleware);

dashboardRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const ia = supabase; // SII/EIRL tables (periodos_contables, facturas_emitidas, etc.)
  const periodoParam = c.req.query("periodo") ?? "actual";

  let periodoMes: number;
  let periodoAnio: number;

  if (periodoParam === "actual") {
    const now = new Date();
    periodoMes = now.getMonth() + 1;
    periodoAnio = now.getFullYear();
  } else {
    const [y, m] = periodoParam.split("-").map(Number);
    periodoAnio = y;
    periodoMes = m;
  }

  let { data: periodo } = await ia
    .from("periodos_contables")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("mes", periodoMes)
    .eq("anio", periodoAnio)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriodo } = await ia
      .from("periodos_contables")
      .insert({
        empresa_id: empresaId, mes: periodoMes, anio: periodoAnio, estado: "abierto",
        ingresos_netos: 0, egresos_netos: 0, utilidad_bruta: 0,
        utilidad_neta: 0, iva_debito: 0, iva_credito: 0, iva_pagar: 0, ppm_calculado: 0,
      })
      .select("*")
      .single();
    periodo = newPeriodo;
  }

  const periodoId = periodo?.id;

  const [facturasEmitidasRes, facturasRecibidasRes, gastosRes] = await Promise.all([
    ia
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total, estado")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodoId ?? ""),
    ia
      .from("facturas_recibidas")
      .select("monto_neto, monto_iva")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodoId ?? ""),
    ia
      .from("gastos")
      .select("monto_neto, monto_iva, monto_total, estado")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodoId ?? ""),
  ]);

  const facturasEmitidas = facturasEmitidasRes.data ?? [];
  const facturasRecibidas = facturasRecibidasRes.data ?? [];
  const gastos = gastosRes.data ?? [];

  const ingresosMes = facturasEmitidas.reduce(
    (acc: number, f: { monto_neto: number | null }) => acc + Number(f.monto_neto ?? 0), 0,
  );
  const gastosMes = gastos.reduce(
    (acc: number, g: { monto_neto: number | null }) => acc + Number(g.monto_neto ?? 0), 0,
  );
  const utilidadNeta = ingresosMes - gastosMes;
  const margenUtilidad = ingresosMes > 0 ? (utilidadNeta / ingresosMes) * 100 : 0;

  const ivaDebito = facturasEmitidas.reduce(
    (acc: number, f: { monto_iva: number | null }) => acc + Number(f.monto_iva ?? 0), 0,
  );
  const ivaCredito =
    facturasRecibidas.reduce((acc: number, f: { monto_iva: number | null }) => acc + Number(f.monto_iva ?? 0), 0) +
    gastos.reduce((acc: number, g: { monto_iva: number | null }) => acc + Number(g.monto_iva ?? 0), 0);
  const ivaPagar = Math.max(0, ivaDebito - ivaCredito);

  const { data: impuestoRes } = await supabase
    .from("impuestos")
    .select("monto")
    .eq("empresa_id", empresaId)
    .eq("tipo", "ppm")
    .eq("periodo_id", periodoId ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: calculosIA } = await supabase
    .from("calculos_ia")
    .select("id, tipo, parametros, resultado, confianza, estado, created_at")
    .eq("empresa_id", empresaId)
    .eq("estado", "Completado")
    .order("created_at", { ascending: false })
    .limit(5);

  const facturasPendientes = facturasEmitidas.filter(
    (f: { estado: string }) => f.estado === "pendiente",
  ).length;

  const prevMes = periodoMes === 1 ? 12 : periodoMes - 1;
  const prevAnio = periodoMes === 1 ? periodoAnio - 1 : periodoAnio;
  const { data: prevPeriodo } = await ia
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("mes", prevMes)
    .eq("anio", prevAnio)
    .maybeSingle();

  let ingresosMesAnterior = 0;
  let gastosMesAnterior = 0;
  if (prevPeriodo?.id) {
    const [prevFeRes, prevGastosRes] = await Promise.all([
      ia.from("facturas_emitidas").select("monto_neto").eq("empresa_id", empresaId).eq("periodo_id", prevPeriodo.id),
      ia.from("gastos").select("monto_neto").eq("empresa_id", empresaId).eq("periodo_id", prevPeriodo.id),
    ]);
    ingresosMesAnterior = (prevFeRes.data ?? []).reduce((a: number, f: { monto_neto: number | null }) => a + Number(f.monto_neto ?? 0), 0);
    gastosMesAnterior = (prevGastosRes.data ?? []).reduce((a: number, g: { monto_neto: number | null }) => a + Number(g.monto_neto ?? 0), 0);
  }

  const pctChange = (current: number, previous: number) =>
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

  return c.json({
    periodo,
    metricas: {
      ingresosMes,
      gastosMes,
      utilidadNeta,
      margenUtilidad,
      ivaDebito,
      ivaCredito,
      ivaPagar,
      ppm: Number(impuestoRes?.monto ?? 0),
      ingresosVariacionPct: pctChange(ingresosMes, ingresosMesAnterior),
      gastosVariacionPct: pctChange(gastosMes, gastosMesAnterior),
    },
    resumen: {
      totalFacturasEmitidas: facturasEmitidas.length,
      totalFacturasRecibidas: facturasRecibidas.length,
      totalGastos: gastos.length,
      facturasPendientes,
    },
    calculosIA: calculosIA ?? [],
  });
});
