import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const conciliacionStatsRoutes = new Hono<{ Variables: AppVariables }>();

conciliacionStatsRoutes.get("/metricas", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [movRes, concRes] = await Promise.all([
    supabase
      .from("banco_chile_movimientos")
      .select("id, conciliado", { count: "exact" })
      .eq("empresa_id", empresaId),
    supabase
      .from("conciliaciones")
      .select("id, tipo", { count: "exact" })
      .eq("empresa_id", empresaId)
      .eq("estado", "activa"),
  ]);

  const movimientos = movRes.data ?? [];
  const totalMov = movimientos.length;
  const conciliados = movimientos.filter((m) => m.conciliado).length;
  const tasaMatch = totalMov > 0 ? Math.round((conciliados / totalMov) * 100) : 0;

  const autoCount = (concRes.data ?? []).filter((c) => c.tipo === "auto").length;

  return c.json({
    data: {
      movimientosTotal: totalMov,
      movimientosConciliados: conciliados,
      tasaMatchPct: tasaMatch,
      conciliacionesActivas: concRes.count ?? 0,
      conciliacionesAuto: autoCount,
      objetivo90: tasaMatch >= 90,
    },
  });
});