import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const QuickSaleSchema = z.object({
  cash_session_id: z.string().uuid(),
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).default(1),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "pos_terminal", "mixto"]),
  channel: z.enum(["feria", "delivery", "local", "corporativo", "referido"]).optional(),
  cliente_id: z.string().uuid().optional(),
  is_new_client: z.boolean().default(true),
  items_override: z
    .array(
      z.object({
        producto_id: z.string().uuid(),
        nombre: z.string(),
        cantidad: z.number().int().min(1),
        precio_unitario: z.number().min(0),
      }),
    )
    .optional(),
  sumup_checkout_id: z.string().optional(),
  sumup_transaction_id: z.string().optional(),
});

export const repVentasRoutes = new Hono<{ Variables: AppVariables }>();

repVentasRoutes.use("*", authMiddleware, tenantMiddleware);

const quickSaleLimiter = new Map<string, { count: number; resetAt: number }>();
const QUICK_SALE_LIMIT = 30;
const QUICK_SALE_WINDOW_MS = 60_000;
const RATE_LIMITER_MAX_ENTRIES = 10_000;

function cleanupRateLimiter(now: number) {
  if (quickSaleLimiter.size > RATE_LIMITER_MAX_ENTRIES) {
    for (const [key, entry] of quickSaleLimiter) {
      if (now > entry.resetAt) quickSaleLimiter.delete(key);
    }
  }
}

repVentasRoutes.post("/quick", zValidator("json", QuickSaleSchema), async (c) => {
  const user = c.get("user");
  const now = Date.now();
  cleanupRateLimiter(now);
  const entry = quickSaleLimiter.get(user.id);
  if (!entry || now > entry.resetAt) {
    quickSaleLimiter.set(user.id, { count: 1, resetAt: now + QUICK_SALE_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > QUICK_SALE_LIMIT) {
      return c.json({ code: "rate_limited", message: "Demasiadas ventas rápidas, espera un momento" }, 429);
    }
  }

  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status")
    .eq("id", input.cash_session_id)
    .eq("rep_id", user.id)
    .single();

  if (!session || session.session_status !== "open") {
    return c.json({ code: "no_open_session", message: "No hay sesión de caja abierta" }, 400);
  }

  let items: { producto_id: string; nombre: string; cantidad: number; precio_unitario: number }[];
  let total: number;

  if (input.items_override && input.items_override.length > 0) {
    items = input.items_override;
    total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  } else {
    const { data: producto } = await supabase
      .from("productos")
      .select("id, nombre, precio")
      .eq("id", input.producto_id)
      .single();

    if (!producto) {
      return c.json({ code: "product_not_found", message: "Producto no encontrado" }, 404);
    }

    items = [
      {
        producto_id: producto.id,
        nombre: producto.nombre ?? "",
        cantidad: input.cantidad,
        precio_unitario: producto.precio ?? 0,
      },
    ];
    total = (producto.precio ?? 0) * input.cantidad;
  }

  // 1. Descontar stock de productos y obtener hash de trazabilidad
  const enrichedItems = [];
  for (const item of items) {
    const { data: stockData } = await supabase.rpc("decrement_stock", {
      p_id: item.producto_id,
      p_qty: item.cantidad,
    });
    
    // El array puede devolver el hash si existe
    const dataAny = stockData as any;
    const hash = (dataAny && dataAny[0] && dataAny[0].traceability_hash) ? dataAny[0].traceability_hash : null;
    const lote_id = (dataAny && dataAny[0] && dataAny[0].lote_id) ? dataAny[0].lote_id : null;
    
    enrichedItems.push({
      ...item,
      traceability_hash: hash,
      lote_id: lote_id
    });
  }

  // 2. Crear venta con los items enriquecidos con trazabilidad
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      vendedor_id: user.id,
      empresa_id: empresaId,
      cash_session_id: input.cash_session_id,
      total,
      items: enrichedItems,
      metodo_pago: input.metodo_pago,
      channel: input.channel ?? "feria",
      cliente_id: input.cliente_id ?? null,
      is_new_client: input.is_new_client,
      estado: "completada",
      origen: input.channel ?? "feria",
      sumup_checkout_id: input.sumup_checkout_id ?? null,
      sumup_transaction_id: input.sumup_transaction_id ?? null,
    } as any)
    .select("id, total, metodo_pago, channel, created_at, rep_commission_total")
    .single();

  if (ventaError) {
    return c.json({ code: "venta_create_failed", message: ventaError.message }, 400);
  }

  const { data: lastCommission } = await supabase
    .from("commission_records")
    .select("base_commission, volume_multiplier, loyalty_bonus, streak_bonus, tier_multiplier, channel_rate, total_commission")
    .eq("venta_id", venta.id)
    .single();

  const { data: sessionCommissions } = await supabase
    .from("commission_records")
    .select("total_commission")
    .eq("session_id", input.cash_session_id);

  const accumulatedCommission = (sessionCommissions ?? []).reduce(
    (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
    0,
  );

  const { data: rules } = await supabase
    .from("commission_rules")
    .select("rule_type, parameter")
    .eq("empresa_id", empresaId)
    .eq("active", true)
    .eq("rule_type", "volume_threshold")
    .order("priority", { ascending: true });

  const sessionTotal = await supabase
    .from("ventas")
    .select("total")
    .eq("cash_session_id", input.cash_session_id);

  const dayTotal = (sessionTotal.data ?? []).reduce((s: number, v: { total: number }) => s + v.total, 0);

  let nextThreshold: { threshold: number; multiplier: number } | null = null;
  if (rules) {
    for (const rule of rules) {
      const param = rule.parameter as Record<string, unknown> | null;
      const threshold = Number(param?.threshold ?? 0);
      const multiplier = Number(param?.multiplier ?? 1);
      if (dayTotal < threshold) {
        nextThreshold = { threshold, multiplier };
        break;
      }
    }
  }

  return c.json({
    data: venta,
    meta: {
      accumulated_commission: accumulatedCommission,
      day_total: dayTotal,
      next_threshold: nextThreshold,
      commission: lastCommission
        ? {
            base: Number(lastCommission.base_commission),
            volume_multiplier: Number(lastCommission.volume_multiplier),
            loyalty_bonus: Number(lastCommission.loyalty_bonus),
            streak_bonus: Number(lastCommission.streak_bonus),
            tier_multiplier: Number(lastCommission.tier_multiplier),
            channel_rate: lastCommission.channel_rate ? Number(lastCommission.channel_rate) : null,
            total: Number(lastCommission.total_commission),
          }
        : null,
    },
  }, 201);
});

repVentasRoutes.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, rep_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.rep_id !== user.id) {
    return c.json({ code: "forbidden", message: "No tienes acceso a esta sesión" }, 403);
  }

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago, channel, created_at, items, rep_commission_total")
    .eq("cash_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: ventas ?? [] });
});

repVentasRoutes.get("/commission-status", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data: repProfile } = await supabase
    .from("rep_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!repProfile) {
    return c.json({ code: "not_rep", message: "No eres rep de ventas" }, 404);
  }

  const { data: activeSession } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_cash")
    .eq("rep_id", user.id)
    .eq("session_status", "open")
    .maybeSingle();

  let todayCommissions = 0;
  let todaySales = 0;
  let todayRevenue = 0;

  if (activeSession) {
    const { data: commissions } = await supabase
      .from("commission_records")
      .select("total_commission")
      .eq("session_id", activeSession.id);

    todayCommissions = (commissions ?? []).reduce(
      (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
      0,
    );

    const { data: sales } = await supabase
      .from("ventas")
      .select("total")
      .eq("cash_session_id", activeSession.id);

    todaySales = sales?.length ?? 0;
    todayRevenue = (sales ?? []).reduce((s: number, v: { total: number }) => s + v.total, 0);
  }

  const { data: rules } = await supabase
    .from("commission_rules")
    .select("rule_type, name, parameter")
    .eq("empresa_id", empresaId)
    .eq("active", true)
    .order("priority", { ascending: true });

  return c.json({
    data: {
      profile: repProfile,
      active_session: activeSession ?? null,
      today: {
        commissions: todayCommissions,
        sales_count: todaySales,
        revenue: todayRevenue,
      },
      rules: rules ?? [],
    },
  });
});

repVentasRoutes.get("/history", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");
  const range = c.req.query("range") || "week";

  const now = new Date();
  let fromDate: Date;
  if (range === "month") {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  } else if (range === "quarter") {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  } else {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }

  const { data: sessions } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_cash, closing_cash_counted, cash_difference, session_status")
    .eq("rep_id", user.id)
    .eq("empresa_id", empresaId)
    .gte("opened_at", fromDate.toISOString())
    .order("opened_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

  const { data: commissions } = await supabase
    .from("commission_records")
      .select("id, session_id, venta_id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, tier_multiplier, channel_rate, total_commission, paid, created_at")
    .eq("rep_id", user.id)
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("rep_profiles")
    .select("total_commissions_earned, total_commissions_paid, total_sales_lifetime, total_revenue_lifetime, clients_captured, current_streak_days, best_streak_days, commission_tier")
    .eq("user_id", user.id)
    .single();

  const totalEarned = (commissions ?? []).reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);
  const totalPending = (commissions ?? []).filter((r: { paid: boolean }) => !r.paid).reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);

  const dailyMap = new Map<string, { revenue: number; commissions: number; sales: number }>();
  for (const c of (commissions ?? [])) {
    const day = (c as { created_at: string }).created_at.slice(0, 10);
    const entry = dailyMap.get(day) || { revenue: 0, commissions: 0, sales: 0 };
    entry.commissions += Number((c as { total_commission: number }).total_commission);
    entry.sales += 1;
    dailyMap.set(day, entry);
  }

  return c.json({
    data: {
      profile: profile ?? null,
      sessions: sessions ?? [],
      commissions: commissions ?? [],
      summary: {
        total_earned: totalEarned,
        total_pending: totalPending,
        session_count: sessions?.length ?? 0,
      },
      daily: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
    },
  });
});

repVentasRoutes.get("/tier-progress", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase.rpc("tier_progress_rep", {
    p_rep_id: user.id,
  });

  if (error) {
    return c.json({ code: "tier_progress_failed", message: error.message }, 500);
  }

  return c.json({ data });
});

repVentasRoutes.get("/leaderboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase.rpc("weekly_leaderboard", {
    p_empresa_id: empresaId,
  });

  if (error) {
    return c.json({ code: "leaderboard_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});
