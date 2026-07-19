import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const conciliacionStatsRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * Métricas go-live: % movimientos banco conciliados + desglose auto/manual.
 * Tabla canónica: banco_chile_movimientos + banco_chile_conciliaciones (no `conciliaciones` genérica).
 */
conciliacionStatsRoutes.get("/metricas", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [movRes, concRes, reglasRes, configRes] = await Promise.all([
    supabase
      .from("banco_chile_movimientos")
      .select("id, conciliado")
      .eq("empresa_id", empresaId),
    supabase
      .from("banco_chile_conciliaciones")
      .select(
        "id, tipo_conciliacion, movimiento_id, movimiento:banco_chile_movimientos!inner(empresa_id)",
      )
      .eq("movimiento.empresa_id", empresaId),
    supabase
      .from("reconciliation_rules")
      .select("id, activo")
      .eq("empresa_id", empresaId)
      .eq("activo", true),
    supabase
      .from("banco_chile_config")
      .select("id, enabled, last_sync")
      .eq("empresa_id", empresaId)
      .maybeSingle(),
  ]);

  // Fallback if join filter fails on some PostgREST versions: filter in app
  let concRows = concRes.data ?? [];
  if (concRes.error) {
    // Secondary path: get movimiento ids then count conciliaciones
    const movIds = (movRes.data ?? []).map((m) => m.id);
    if (movIds.length > 0) {
      const { data: conc2 } = await supabase
        .from("banco_chile_conciliaciones")
        .select("id, tipo_conciliacion, movimiento_id")
        .in("movimiento_id", movIds);
      concRows = conc2 ?? [];
    } else {
      concRows = [];
    }
  }

  const movimientos = movRes.data ?? [];
  const totalMov = movimientos.length;
  const conciliados = movimientos.filter((m) => m.conciliado).length;
  const tasaMatch = totalMov > 0 ? Math.round((conciliados / totalMov) * 100) : 0;

  const autoCount = concRows.filter(
    (row) => String(row.tipo_conciliacion ?? "").toLowerCase().includes("auto"),
  ).length;
  const manualCount = concRows.length - autoCount;

  return c.json({
    data: {
      movimientosTotal: totalMov,
      movimientosConciliados: conciliados,
      movimientosPendientes: Math.max(0, totalMov - conciliados),
      tasaMatchPct: tasaMatch,
      conciliacionesTotal: concRows.length,
      conciliacionesAuto: autoCount,
      conciliacionesManual: manualCount,
      reglasActivas: (reglasRes.data ?? []).length,
      bancoEnabled: Boolean(configRes.data?.enabled),
      lastSync: configRes.data?.last_sync ?? null,
      objetivo90: tasaMatch >= 90,
    },
  });
});

/** Checklist go-live conciliación banco ↔ ventas/gastos */
conciliacionStatsRoutes.get("/checklist", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [configRes, movRes, reglasRes, concRes] = await Promise.all([
    supabase
      .from("banco_chile_config")
      .select("id, enabled, last_sync, client_id")
      .eq("empresa_id", empresaId)
      .maybeSingle(),
    supabase
      .from("banco_chile_movimientos")
      .select("id, conciliado")
      .eq("empresa_id", empresaId),
    supabase
      .from("reconciliation_rules")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("activo", true),
    supabase
      .from("banco_chile_movimientos")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("conciliado", true),
  ]);

  const movs = movRes.data ?? [];
  const total = movs.length;
  const conc = movs.filter((m) => m.conciliado).length;
  const tasa = total > 0 ? Math.round((conc / total) * 100) : 0;
  const hasConfig = Boolean(configRes.data?.id);
  const enabled = Boolean(configRes.data?.enabled);
  const hasMovs = total > 0;
  const hasReglas = (reglasRes.data ?? []).length > 0;
  const hasMatch = (concRes.count ?? 0) > 0 || conc > 0;

  type Item = {
    id: string;
    titulo: string;
    cumplido: boolean;
    critico: boolean;
    detalle?: string;
  };

  const items: Item[] = [
    {
      id: "banco-config",
      titulo: "Banco Chile configurado",
      cumplido: hasConfig,
      critico: true,
      detalle: hasConfig ? "Config presente" : "Configurá en Banco Chile",
    },
    {
      id: "banco-enabled",
      titulo: "Integración bancaria habilitada",
      cumplido: enabled,
      critico: true,
    },
    {
      id: "movimientos",
      titulo: "Al menos un movimiento sincronizado",
      cumplido: hasMovs,
      critico: true,
      detalle: `${total} movimiento(s)`,
    },
    {
      id: "reglas",
      titulo: "Reglas de conciliación activas (opcional al inicio)",
      cumplido: hasReglas,
      critico: false,
      detalle: `${reglasRes.data?.length ?? 0} regla(s)`,
    },
    {
      id: "match",
      titulo: "Al menos un match banco↔venta/gasto",
      cumplido: hasMatch,
      critico: true,
      detalle: hasMatch ? `${conc} conciliado(s)` : "Ejecutá motor o conciliá manual",
    },
    {
      id: "tasa-90",
      titulo: "Tasa de match ≥ 90% (meta soberanía)",
      cumplido: tasa >= 90 && total > 0,
      critico: false,
      detalle: `${tasa}% (${conc}/${total})`,
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;

  return c.json({
    data: {
      listoOperacion: criticosPendientes === 0,
      criticosPendientes,
      tasaMatchPct: tasa,
      items,
    },
  });
});
