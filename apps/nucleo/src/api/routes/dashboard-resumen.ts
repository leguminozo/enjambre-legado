import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

export const dashboardResumenRoutes = new Hono<{
  Variables: AppVariables;
}>();

dashboardResumenRoutes.use("*", authMiddleware, tenantMiddleware);

dashboardResumenRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearStart = `${currentYear}-01-01`;
  const today = now.toISOString().slice(0, 10);

  const [
    colmenasRes,
    apiariosRes,
    inspeccionesRes,
    cosechasRes,
    arbolesRes,
    ventasYTDRes,
    ventasMonthRes,
    ventasByChannelRes,
    commissionsYTDRes,
    commissionsUnpaidRes,
    cashSessionsRes,
    repProfilesRes,
    periodosRes,
    facturasEmitidasRes,
    gastosRes,
    leaderboardRes,
    ventasRecentRes,
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
    supabase
      .from("cosechas")
      .select("id, kg, fecha, floracion")
      .gte("fecha", yearStart),
    supabase
      .from("arboles_plantados")
      .select("id, especie, cantidad, co2_ton, fecha, status")
      .gte("fecha", yearStart),
    supabase
      .from("ventas")
      .select("total, channel, created_at, is_new_client")
      .eq("empresa_id", empresaId)
      .gte("created_at", yearStart),
    supabase
      .from("ventas")
      .select("total, channel, metodo_pago")
      .eq("empresa_id", empresaId)
      .gte("created_at", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`),
    supabase
      .from("ventas")
      .select("total, channel")
      .eq("empresa_id", empresaId)
      .gte("created_at", yearStart),
    supabase
      .from("commission_records")
      .select("total_commission, tier_multiplier, channel_rate, base_commission, volume_multiplier, loyalty_bonus, streak_bonus")
      .eq("empresa_id", empresaId)
      .gte("calculated_at", yearStart),
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
  ]);

  const colmenas = colmenasRes.data ?? [];
  const apiarios = apiariosRes.data ?? [];
  const inspecciones = inspeccionesRes.data ?? [];
  const cosechas = cosechasRes.data ?? [];
  const arboles = arbolesRes.data ?? [];
  const ventasYTD = ventasYTDRes.data ?? [];
  const ventasMonth = ventasMonthRes.data ?? [];
  const ventasByChannel = ventasByChannelRes.data ?? [];
  const commissionsYTD = commissionsYTDRes.data ?? [];
  const commissionsUnpaid = commissionsUnpaidRes.data ?? [];
  const cashSessions = cashSessionsRes.data ?? [];
  const repProfiles = repProfilesRes.data ?? [];
  const periodos = periodosRes.data ?? [];
  const facturasEmitidas = facturasEmitidasRes.data ?? [];
  const gastos = gastosRes.data ?? [];
  const leaderboard = leaderboardRes.data ?? [];
  const ventasRecent = ventasRecentRes.data ?? [];

  const totalColmenas = colmenas.length;
  const colmenasByHealth = {
    optima: colmenas.filter((c: { health: string | null }) => c.health === "optima").length,
    atencion: colmenas.filter((c: { health: string | null }) => c.health === "atencion").length,
    riesgo: colmenas.filter((c: { health: string | null }) => c.health === "riesgo").length,
  };

  const totalApiarios = apiarios.length;

  const latestVarroa = inspecciones.length > 0
    ? inspecciones.filter((i: { varroa: number | null }) => i.varroa != null)[0]?.varroa ?? null
    : null;

  const totalCosechaYTD = cosechas.reduce(
    (acc: number, c: { kg: number | null }) => acc + Number(c.kg ?? 0), 0,
  );

  const totalArbolesYTD = arboles.reduce(
    (acc: number, a: { cantidad: number }) => acc + Number(a.cantidad), 0,
  );
  const totalCO2 = arboles.reduce(
    (acc: number, a: { co2_ton: number | null }) => acc + Number(a.co2_ton ?? 0), 0,
  );

  const facturacionYTD = ventasYTD.reduce(
    (acc: number, v: { total: number }) => acc + Number(v.total), 0,
  );
  const facturacionMes = ventasMonth.reduce(
    (acc: number, v: { total: number }) => acc + Number(v.total), 0,
  );

  const channelRevenue = new Map<string, number>();
  ventasByChannel.forEach((v: { total: number; channel: string | null }) => {
    const ch = v.channel ?? "web";
    channelRevenue.set(ch, (channelRevenue.get(ch) ?? 0) + Number(v.total));
  });

  const totalVentasYTD = ventasYTD.length;
  const newClientsYTD = ventasYTD.filter(
    (v: { is_new_client: boolean | null }) => v.is_new_client === true,
  ).length;

  const totalCommissionsYTD = commissionsYTD.reduce(
    (acc: number, c: { total_commission: number }) => acc + Number(c.total_commission), 0,
  );
  const pendingCommissions = commissionsUnpaid.reduce(
    (acc: number, c: { total_commission: number }) => acc + Number(c.total_commission), 0,
  );

  const avgTierMultiplier = commissionsYTD.length > 0
    ? commissionsYTD.reduce((acc: number, c: { tier_multiplier: number }) => acc + Number(c.tier_multiplier), 0) / commissionsYTD.length
    : 1.0;

  const openSessions = cashSessions.filter(
    (s: { session_status: string }) => s.session_status === "open",
  ).length;
  const cashDifferences = cashSessions
    .filter((s: { cash_difference: number | null }) => s.cash_difference != null)
    .map((s: { cash_difference: number | null }) => Number(s.cash_difference ?? 0));
  const avgCashDifference = cashDifferences.length > 0
    ? cashDifferences.reduce((a: number, b: number) => a + b, 0) / cashDifferences.length
    : 0;

  const activeReps = repProfiles.filter(
    (r: { active: boolean }) => r.active === true,
  ).length;
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

  const ingresosNetosYTD = facturasEmitidas.reduce(
    (acc: number, f: { monto_neto: number | null }) => acc + Number(f.monto_neto ?? 0), 0,
  );
  const gastosYTD = gastos.reduce(
    (acc: number, g: { monto: number | null }) => acc + Number(g.monto ?? 0), 0,
  );
  const utilidadNetaYTD = ingresosNetosYTD - gastosYTD;
  const margenUtilidadYTD = ingresosNetosYTD > 0
    ? (utilidadNetaYTD / ingresosNetosYTD) * 100
    : 0;

  const ivaDebitoYTD = facturasEmitidas.reduce(
    (acc: number, f: { monto_iva: number | null }) => acc + Number(f.monto_iva ?? 0), 0,
  );
  const facturasPendientes = facturasEmitidas.filter(
    (f: { estado: string | null }) => f.estado === "pendiente",
  ).length;

  const currentPeriodo = periodos.find(
    (p: { mes: number }) => p.mes === currentMonth,
  );

  const monthlyRevenue = new Map<string, number>();
  const monthlyExpenses = new Map<string, number>();
  ventasYTD.forEach((v: { total: number; created_at: string | null }) => {
    if (v.created_at) {
      const monthKey = v.created_at.slice(0, 7);
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) ?? 0) + Number(v.total));
    }
  });
  gastos.forEach((g: { monto: number | null; fecha: string | null }) => {
    if (g.fecha) {
      const monthKey = g.fecha.slice(0, 7);
      monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) ?? 0) + Number(g.monto ?? 0));
    }
  });

  const revenueByProductType = new Map<string, { revenue: number; count: number }>();
  ventasYTD.forEach((v: { total: number; channel: string | null }) => {
    const ch = v.channel ?? "web";
    const existing = revenueByProductType.get(ch) ?? { revenue: 0, count: 0 };
    revenueByProductType.set(ch, {
      revenue: existing.revenue + Number(v.total),
      count: existing.count + 1,
    });
  });

  const cosechaByMonth = new Map<string, number>();
  cosechas.forEach((c: { kg: number | null; fecha: string | null }) => {
    if (c.fecha) {
      const monthKey = c.fecha.slice(0, 7);
      cosechaByMonth.set(monthKey, (cosechaByMonth.get(monthKey) ?? 0) + Number(c.kg ?? 0));
    }
  });

  const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: MONTH_LABELS[i],
      income: monthlyRevenue.get(monthKey) ?? 0,
      expenses: monthlyExpenses.get(monthKey) ?? 0,
    };
  });

  const productionData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: MONTH_LABELS[i],
      cosecha: cosechaByMonth.get(monthKey) ?? 0,
    };
  });

  const co2ByMonthMap = new Map<string, number>();
  arboles.forEach((a: { co2_ton: number | null; fecha: string | null }) => {
    if (a.fecha) {
      const monthKey = String(a.fecha).slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(monthKey)) {
        co2ByMonthMap.set(monthKey, (co2ByMonthMap.get(monthKey) ?? 0) + Number(a.co2_ton ?? 0));
      }
    }
  });
  const co2MonthData = Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    return co2ByMonthMap.get(monthKey) ?? 0;
  });

  return c.json({
    enjambre: {
      colmenas: {
        total: totalColmenas,
        byHealth: colmenasByHealth,
        productionTotal: colmenas.reduce(
          (acc: number, c: { production_total: number | null }) => acc + Number(c.production_total ?? 0), 0,
        ),
      },
      apiarios: { total: totalApiarios },
      inspecciones: {
        totalYTD: inspecciones.length,
        latestVarroa,
      },
      cosechas: {
        totalYTD: totalCosechaYTD,
        byMonth: productionData,
      },
      arboles: {
        totalYTD: totalArbolesYTD,
        co2Total: totalCO2,
        byMonth: co2MonthData,
      },
    },
    finanzas: {
      facturacionYTD,
      facturacionMes,
      ingresosNetosYTD,
      gastosYTD,
      utilidadNetaYTD,
      margenUtilidad: Math.round(margenUtilidadYTD * 100) / 100,
      ivaDebitoYTD,
      ivaPagar: currentPeriodo?.iva_pagar ?? Math.max(0, ivaDebitoYTD * 0.19),
      ppm: currentPeriodo?.ppm_calculado ?? 0,
      facturasPendientes,
      totalFacturasEmitidas: facturasEmitidas.length,
      cashFlow: cashFlowData,
    },
    ventas: {
      totalVentasYTD,
      facturacionYTD,
      newClientsYTD,
      byChannel: Object.fromEntries(channelRevenue),
      revenueByProductType: Object.fromEntries(revenueByProductType),
      recent: ventasRecent.slice(0, 5),
    },
    equipo: {
      activeReps,
      repTiers,
      topRep: topRep ? { name: topRep.display_name, revenue: topRep.total_revenue_lifetime } : null,
      comisiones: {
        totalYTD: totalCommissionsYTD,
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
  });
});
