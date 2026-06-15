import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

type TimeRange = "month" | "quarter" | "ytd";

function getDateRange(range: TimeRange): { from: string; to: string; label: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const to = now.toISOString().slice(0, 10);

  switch (range) {
    case "month": {
      const from = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
      return { from, to, label: "Este Mes" };
    }
    case "quarter": {
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const from = new Date(currentYear, quarterStartMonth, 1).toISOString().slice(0, 10);
      return { from, to, label: "Este Trimestre" };
    }
    default: {
      const from = `${currentYear}-01-01`;
      return { from, to, label: `YTD ${currentYear}` };
    }
  }
}

export const dashboardEjecutivoRoutes = new Hono<{
  Variables: AppVariables;
}>();

dashboardEjecutivoRoutes.use("*", authMiddleware, tenantMiddleware);

dashboardEjecutivoRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const rangeParam = (c.req.query("range") ?? "ytd") as TimeRange;
  const validRanges: TimeRange[] = ["month", "quarter", "ytd"];
  const range = validRanges.includes(rangeParam) ? rangeParam : "ytd";
  const { from, to, label } = getDateRange(range);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearStart = `${currentYear}-01-01`;

  const [
    colmenasRes,
    apiariosRes,
    inspeccionesRes,
    cosechasRangeRes,
    cosechasYTDRes,
    arbolesRes,
    ventasRangeRes,
    ventasYTDRes,
    commissionsRangeRes,
    commissionsUnpaidRes,
    cashSessionsRes,
    repProfilesRes,
    periodosRes,
    facturasRangeRes,
    gastosRangeRes,
    facturasYTDRes,
    gastosYTDRes,
    leaderboardRes,
    ventasRecentRes,
    productosRes,
  ] = await Promise.all([
    supabase
      .from("colmenas")
      .select("id, health, production_total, apiario_id")
      .eq("user_id", c.get("user").id),
    supabase.from("apiarios").select("id, name, health"),
    supabase
      .from("inspecciones")
      .select("id, date, varroa, poblacion, reina")
      .gte("date", yearStart)
      .order("date", { ascending: false })
      .limit(50),
    (supabase as any)
      .from("cosechas")
      .select("id, kg, fecha, floracion")
      .eq("empresa_id", empresaId)
      .gte("fecha", from)
      .lte("fecha", to),
    (supabase as any)
      .from("cosechas")
      .select("id, kg, fecha, floracion")
      .eq("empresa_id", empresaId)
      .gte("fecha", yearStart),
    supabase
      .from("arboles_plantados")
      .select("id, especie, cantidad, co2_ton, fecha, status")
      .gte("fecha", yearStart),
    supabase
      .from("ventas")
      .select("total, channel, created_at, is_new_client, metodo_pago")
      .eq("empresa_id", empresaId)
      .gte("created_at", from)
      .lte("created_at", to + "T23:59:59"),
    supabase
      .from("ventas")
      .select("total, channel, created_at, is_new_client")
      .eq("empresa_id", empresaId)
      .gte("created_at", yearStart),
    supabase
      .from("commission_records")
      .select("total_commission, tier_multiplier, channel_rate, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, calculated_at")
      .eq("empresa_id", empresaId)
      .gte("calculated_at", from)
      .lte("calculated_at", to + "T23:59:59"),
    supabase
      .from("commission_records")
      .select("total_commission")
      .eq("empresa_id", empresaId)
      .eq("paid", false),
    supabase
      .from("cash_sessions")
      .select("id, session_status, opened_at, closed_at, cash_difference")
      .eq("empresa_id", empresaId)
      .gte("opened_at", yearStart)
      .order("opened_at", { ascending: false })
      .limit(30),
    supabase
      .from("rep_profiles")
      .select("user_id, display_name, commission_tier, total_sales_lifetime, total_revenue_lifetime, total_commissions_earned, current_streak_days, active")
      .eq("empresa_id", empresaId),
    supabase
      .from("periodos_contables")
      .select("mes, anio, ingresos_netos, egresos_netos, utilidad_neta, iva_debito, iva_credito, iva_pagar, ppm_calculado")
      .eq("empresa_id", empresaId)
      .eq("anio", currentYear)
      .order("mes", { ascending: true }),
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total, estado, fecha_emision")
      .eq("empresa_id", empresaId)
      .gte("fecha_emision", from)
      .lte("fecha_emision", to),
    supabase
      .from("gastos")
      .select("monto, categoria, fecha")
      .eq("empresa_id", empresaId)
      .gte("fecha", from)
      .lte("fecha", to),
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total, estado, fecha_emision")
      .eq("empresa_id", empresaId)
      .gte("fecha_emision", yearStart),
    supabase
      .from("gastos")
      .select("monto, categoria, fecha")
      .eq("empresa_id", empresaId)
      .gte("fecha", yearStart),
    supabase.rpc("weekly_leaderboard", { p_empresa_id: empresaId }),
    supabase
      .from("ventas")
      .select("total, channel, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(10),
    (supabase as any)
      .from("productos")
      .select("id, nombre, precio, stock, categoria")
      .eq("empresa_id", empresaId),
  ]);

  const colmenas = colmenasRes.data ?? [];
  const apiarios = apiariosRes.data ?? [];
  const inspecciones = inspeccionesRes.data ?? [];
  const cosechasRange = cosechasRangeRes.data ?? [];
  const cosechasYTD = cosechasYTDRes.data ?? [];
  const arboles = arbolesRes.data ?? [];
  const ventasRange = ventasRangeRes.data ?? [];
  const ventasYTD = ventasYTDRes.data ?? [];
  const commissionsRange = commissionsRangeRes.data ?? [];
  const commissionsUnpaid = commissionsUnpaidRes.data ?? [];
  const cashSessions = cashSessionsRes.data ?? [];
  const repProfiles = repProfilesRes.data ?? [];
  const periodos = periodosRes.data ?? [];
  const facturasRange = facturasRangeRes.data ?? [];
  const gastosRange = gastosRangeRes.data ?? [];
  const facturasYTD = facturasYTDRes.data ?? [];
  const gastosYTD = gastosYTDRes.data ?? [];
  const leaderboard = leaderboardRes.data ?? [];
  const ventasRecent = ventasRecentRes.data ?? [];
  const productos = productosRes.data ?? [];

  const totalColmenas = colmenas.length;
  const colmenasByHealth = {
    optima: colmenas.filter((c: { health: string | null }) => c.health === "optima").length,
    atencion: colmenas.filter((c: { health: string | null }) => c.health === "atencion").length,
    riesgo: colmenas.filter((c: { health: string | null }) => c.health === "riesgo").length,
  };
  const totalApiarios = apiarios.length;
  const apiariosByHealth = {
    optima: apiarios.filter((a: { health: string | null }) => a.health === "optima").length,
    atencion: apiarios.filter((a: { health: string | null }) => a.health === "atencion").length,
    riesgo: apiarios.filter((a: { health: string | null }) => a.health === "riesgo").length,
  };

  const latestVarroa = inspecciones.length > 0
    ? inspecciones.filter((i: { varroa: number | null }) => i.varroa != null)[0]?.varroa ?? null
    : null;
  const highVarroaInspections = inspecciones.filter((i: { varroa: number | null }) => i.varroa != null && i.varroa > 3);

  const cosechaRange = cosechasRange.reduce((acc: number, c: { kg: number | null }) => acc + Number(c.kg ?? 0), 0);
  const cosechaYTD = cosechasYTD.reduce((acc: number, c: { kg: number | null }) => acc + Number(c.kg ?? 0), 0);

  const totalArbolesYTD = arboles.reduce((acc: number, a: { cantidad: number }) => acc + Number(a.cantidad), 0);
  const totalCO2 = arboles.reduce((acc: number, a: { co2_ton: number | null }) => acc + Number(a.co2_ton ?? 0), 0);

  const facturacionRange = ventasRange.reduce((acc: number, v: { total: number }) => acc + Number(v.total), 0);
  const facturacionYTD = ventasYTD.reduce((acc: number, v: { total: number }) => acc + Number(v.total), 0);
  const totalVentasRange = ventasRange.length;
  const newClientsRange = ventasRange.filter((v: { is_new_client: boolean | null }) => v.is_new_client === true).length;
  const avgTicketRange = totalVentasRange > 0 ? Math.round(facturacionRange / totalVentasRange) : 0;

  const channelRevenueRange = new Map<string, number>();
  const channelCountRange = new Map<string, number>();
  ventasRange.forEach((v: { total: number; channel: string | null }) => {
    const ch = v.channel ?? "web";
    channelRevenueRange.set(ch, (channelRevenueRange.get(ch) ?? 0) + Number(v.total));
    channelCountRange.set(ch, (channelCountRange.get(ch) ?? 0) + 1);
  });

  const metodoPagoBreakdown = new Map<string, { total: number; count: number }>();
  ventasRange.forEach((v: { total: number; metodo_pago: string | null }) => {
    const mp = v.metodo_pago ?? "sin_registro";
    const existing = metodoPagoBreakdown.get(mp) ?? { total: 0, count: 0 };
    metodoPagoBreakdown.set(mp, { total: existing.total + Number(v.total), count: existing.count + 1 });
  });

  const totalCommissionsRange = commissionsRange.reduce((acc: number, c: { total_commission: number }) => acc + Number(c.total_commission), 0);
  const pendingCommissions = commissionsUnpaid.reduce((acc: number, c: { total_commission: number }) => acc + Number(c.total_commission), 0);
  const avgTierMultiplier = commissionsRange.length > 0
    ? commissionsRange.reduce((acc: number, c: { tier_multiplier: number }) => acc + Number(c.tier_multiplier), 0) / commissionsRange.length
    : 1.0;

  const openSessions = cashSessions.filter((s: { session_status: string }) => s.session_status === "open").length;
  const cashDifferences = cashSessions
    .filter((s: { cash_difference: number | null }) => s.cash_difference != null)
    .map((s: { cash_difference: number | null }) => Number(s.cash_difference ?? 0));
  const avgCashDifference = cashDifferences.length > 0
    ? cashDifferences.reduce((a: number, b: number) => a + b, 0) / cashDifferences.length
    : 0;
  const bigDifferences = cashSessions.filter((s: { cash_difference: number | null }) => Math.abs(Number(s.cash_difference ?? 0)) >= 10000);

  const activeReps = repProfiles.filter((r: { active: boolean }) => r.active === true).length;
  const repTiers = {
    base: repProfiles.filter((r: { commission_tier: string }) => r.commission_tier === "base").length,
    senior: repProfiles.filter((r: { commission_tier: string }) => r.commission_tier === "senior").length,
    elite: repProfiles.filter((r: { commission_tier: string }) => r.commission_tier === "elite").length,
    legend: repProfiles.filter((r: { commission_tier: string }) => r.commission_tier === "legend").length,
  };
  const topRep = repProfiles.length > 0
    ? repProfiles.reduce((best: { display_name: string; total_revenue_lifetime: number } | null, r: { display_name: string; total_revenue_lifetime: number }) =>
        r.total_revenue_lifetime > (best?.total_revenue_lifetime ?? 0) ? r : best, null)
    : null;

  const ingresosNetosRange = facturasRange.reduce((acc: number, f: { monto_neto: number | null }) => acc + Number(f.monto_neto ?? 0), 0);
  const gastosRangeTotal = gastosRange.reduce((acc: number, g: { monto: number | null }) => acc + Number(g.monto ?? 0), 0);
  const utilidadNetaRange = ingresosNetosRange - gastosRangeTotal;
  const margenRange = ingresosNetosRange > 0 ? Math.round((utilidadNetaRange / ingresosNetosRange) * 10000) / 100 : 0;

  const ingresosNetosYTD = facturasYTD.reduce((acc: number, f: { monto_neto: number | null }) => acc + Number(f.monto_neto ?? 0), 0);
  const gastosYTDTotal = gastosYTD.reduce((acc: number, g: { monto: number | null }) => acc + Number(g.monto ?? 0), 0);
  const utilidadNetaYTD = ingresosNetosYTD - gastosYTDTotal;
  const margenYTD = ingresosNetosYTD > 0 ? Math.round((utilidadNetaYTD / ingresosNetosYTD) * 10000) / 100 : 0;

  const ivaDebitoRange = facturasRange.reduce((acc: number, f: { monto_iva: number | null }) => acc + Number(f.monto_iva ?? 0), 0);
  const facturasPendientes = facturasYTD.filter((f: { estado: string | null }) => f.estado === "pendiente").length;

  const currentPeriodo = periodos.find((p: { mes: number }) => p.mes === currentMonth);

  const gastosByCategory = new Map<string, number>();
  gastosRange.forEach((g: { monto: number | null; categoria: string | null }) => {
    const cat = g.categoria ?? "sin_categoria";
    gastosByCategory.set(cat, (gastosByCategory.get(cat) ?? 0) + Number(g.monto ?? 0));
  });

  const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const monthlyRevenue = new Map<string, number>();
  const monthlyExpenses = new Map<string, number>();
  ventasYTD.forEach((v: { total: number; created_at: string | null }) => {
    if (v.created_at) {
      const monthKey = v.created_at.slice(0, 7);
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) ?? 0) + Number(v.total));
    }
  });
  gastosYTD.forEach((g: { monto: number | null; fecha: string | null }) => {
    if (g.fecha) {
      const monthKey = g.fecha.slice(0, 7);
      monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) ?? 0) + Number(g.monto ?? 0));
    }
  });

  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: MONTH_LABELS[i],
      income: monthlyRevenue.get(monthKey) ?? 0,
      expenses: monthlyExpenses.get(monthKey) ?? 0,
    };
  });

  const cosechaByMonth = new Map<string, number>();
  cosechasYTD.forEach((c: { kg: number | null; fecha: string | null }) => {
    if (c.fecha) {
      const monthKey = c.fecha.slice(0, 7);
      cosechaByMonth.set(monthKey, (cosechaByMonth.get(monthKey) ?? 0) + Number(c.kg ?? 0));
    }
  });

  const productionData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: MONTH_LABELS[i],
      cosecha: cosechaByMonth.get(monthKey) ?? 0,
    };
  });

  const ventasByMonthRange = new Map<string, { total: number; count: number }>();
  ventasRange.forEach((v: { total: number; created_at: string | null }) => {
    if (v.created_at) {
      const monthKey = v.created_at.slice(0, 7);
      const existing = ventasByMonthRange.get(monthKey) ?? { total: 0, count: 0 };
      ventasByMonthRange.set(monthKey, { total: existing.total + Number(v.total), count: existing.count + 1 });
    }
  });

  const ventasTrendData = Array.from(ventasByMonthRange.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, val]) => ({
      month: MONTH_LABELS[parseInt(monthKey.split("-")[1], 10) - 1] ?? monthKey,
      total: val.total,
      count: val.count,
    }));

  const lowStockProducts = productos.filter((p: { stock: number | null }) => p.stock != null && p.stock <= 5);

  const alerts: Array<{ severity: "critical" | "warning" | "info"; title: string; detail: string }> = [];

  if (colmenasByHealth.riesgo > 0) {
    alerts.push({ severity: "critical", title: "Colmenas en riesgo", detail: `${colmenasByHealth.riesgo} colmena(s) con salud "riesgo" requieren atención inmediata` });
  }
  if (latestVarroa != null && latestVarroa > 3) {
    alerts.push({ severity: "critical", title: "Varroa elevada", detail: `Última inspección: ${latestVarroa}% — umbral crítico superado (>3%)` });
  }
  if (highVarroaInspections.length > 0) {
    alerts.push({ severity: "warning", title: "Inspecciones con varroa >3%", detail: `${highVarroaInspections.length} inspección(es) YTD con nivel de varroa sobre umbral` });
  }
  if (pendingCommissions > 0) {
    alerts.push({ severity: "warning", title: "Comisiones pendientes", detail: `$${pendingCommissions.toLocaleString("es-CL")} CLP en comisiones sin pagar` });
  }
  if (openSessions > 0) {
    alerts.push({ severity: "info", title: "Sesiones de caja abiertas", detail: `${openSessions} sesión(es) de caja sin cerrar` });
  }
  if (bigDifferences.length > 0) {
    alerts.push({ severity: "warning", title: "Diferencias de caja ≥$10K", detail: `${bigDifferences.length} cierre(s) con diferencia ≥ $10.000 CLP` });
  }
  if (facturasPendientes > 0) {
    alerts.push({ severity: "warning", title: "Facturas pendientes", detail: `${facturasPendientes} factura(s) emitidas sin cobro confirmado` });
  }
  if (lowStockProducts.length > 0) {
    alerts.push({ severity: "warning", title: "Stock bajo", detail: `${lowStockProducts.length} producto(s) con stock ≤ 5 unidades` });
  }
  if (colmenasByHealth.atencion > 0) {
    alerts.push({ severity: "info", title: "Colmenas en atención", detail: `${colmenasByHealth.atencion} colmena(s) con salud "atención"` });
  }

  return c.json({
    range: { key: range, label, from, to },
    kpis: {
      facturacion: facturacionRange,
      facturacionYTD,
      ventas: totalVentasRange,
      ticketPromedio: avgTicketRange,
      clientesNuevos: newClientsRange,
      cosecha: cosechaRange,
      cosechaYTD,
      margenUtilidad: margenRange,
      margenUtilidadYTD: margenYTD,
      utilidadNeta: utilidadNetaRange,
      utilidadNetaYTD,
      co2Total: totalCO2,
      arbolesYTD: totalArbolesYTD,
      comisionesPendientes: pendingCommissions,
      ivaPagar: currentPeriodo?.iva_pagar ?? Math.max(0, ivaDebitoRange * 0.19),
      ppm: currentPeriodo?.ppm_calculado ?? 0,
    },
    enjambre: {
      colmenas: { total: totalColmenas, byHealth: colmenasByHealth },
      apiarios: { total: totalApiarios, byHealth: apiariosByHealth },
      inspecciones: { totalYTD: inspecciones.length, latestVarroa },
      cosechas: { totalYTD: cosechaYTD, byMonth: productionData },
      arboles: { totalYTD: totalArbolesYTD, co2Total: totalCO2 },
    },
    finanzas: {
      ingresosNetos: ingresosNetosRange,
      gastos: gastosRangeTotal,
      utilidadNeta: utilidadNetaRange,
      ivaDebito: ivaDebitoRange,
      ivaPagar: currentPeriodo?.iva_pagar ?? Math.max(0, ivaDebitoRange * 0.19),
      ppm: currentPeriodo?.ppm_calculado ?? 0,
      facturasPendientes,
      cashFlow: cashFlowData,
      gastosByCategory: Object.fromEntries(gastosByCategory),
    },
    ventas: {
      totalVentasRange,
      facturacionRange,
      facturacionYTD,
      newClientsRange,
      byChannel: Object.fromEntries(channelRevenueRange),
      channelCounts: Object.fromEntries(channelCountRange),
      byMetodoPago: Object.fromEntries(metodoPagoBreakdown),
      trend: ventasTrendData,
      recent: ventasRecent.slice(0, 5),
    },
    equipo: {
      activeReps,
      repTiers,
      topRep: topRep ? { name: topRep.display_name, revenue: topRep.total_revenue_lifetime } : null,
      comisiones: {
        totalYTD: totalCommissionsRange,
        pendientes: pendingCommissions,
        avgTierMultiplier: Math.round(avgTierMultiplier * 100) / 100,
      },
      caja: {
        openSessions,
        avgCashDifference: Math.round(avgCashDifference),
        recentCount: cashSessions.length,
      },
      leaderboard: leaderboard.slice(0, 5),
    },
    stock: {
      lowStock: lowStockProducts.map((p: { id: string; nombre: string | null; stock: number | null; categoria: string | null }) => ({
        id: p.id,
        nombre: p.nombre,
        stock: p.stock,
        categoria: p.categoria,
      })),
    },
    alerts,
  });
});
