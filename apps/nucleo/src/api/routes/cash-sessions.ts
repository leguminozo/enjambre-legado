import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole, tenantMiddleware } from "@/api/lib/middleware";

const OpenSessionSchema = z.object({
  opening_cash: z.number().min(0, "Efectivo inicial debe ser >= 0"),
});

const CloseSessionSchema = z.object({
  closing_cash_counted: z.number().min(0, "Efectivo contado debe ser >= 0"),
  notas: z.string().max(500).optional(),
});

const ReconcileSchema = z.object({
  notas: z.string().max(500).optional(),
});

export const cashSessionsRoutes = new Hono<{ Variables: AppVariables }>();

cashSessionsRoutes.use("*", authMiddleware, tenantMiddleware, requireProfileRole("rep_ventas", "admin"));

cashSessionsRoutes.use("/:id/reconcile", requireProfileRole("admin"));
cashSessionsRoutes.use("/export/csv", requireProfileRole("admin"));
cashSessionsRoutes.use("/history", requireProfileRole("admin"));

cashSessionsRoutes.post("/", zValidator("json", OpenSessionSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("rep_id", user.id)
    .eq("session_status", "open")
    .maybeSingle();

  if (existing) {
    return c.json({ code: "session_already_open", message: "Ya tienes una sesión de caja abierta" }, 409);
  }

  const { data, error } = await supabase
    .from("cash_sessions")
    .insert({
      empresa_id: empresaId,
      rep_id: user.id,
      opening_cash: input.opening_cash,
      session_status: "open",
    })
    .select("id, opened_at, opening_cash, session_status")
    .single();

  if (error) {
    return c.json({ code: "session_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

cashSessionsRoutes.get("/active", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_cash, session_status")
    .eq("rep_id", user.id)
    .eq("session_status", "open")
    .maybeSingle();

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? null });
});

cashSessionsRoutes.post("/:id/close", zValidator("json", CloseSessionSchema), async (c) => {
  const sessionId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status")
    .eq("id", sessionId)
    .eq("rep_id", user.id)
    .single();

  if (!session) {
    return c.json({ code: "not_found", message: "Sesión no encontrada" }, 404);
  }

  if (session.session_status !== "open") {
    return c.json({ code: "already_closed", message: "La sesión ya está cerrada" }, 400);
  }

  const { data: ventas } = await supabase
    .from("ventas")
    .select("total, metodo_pago")
    .eq("cash_session_id", sessionId);

  const rows = ventas ?? [];
  const cashSales = rows.reduce(
    (sum, v) =>
      v.metodo_pago === "efectivo" ? sum + Number(v.total ?? 0) : sum,
    0,
  );

  const breakdown: Record<string, number> = {};
  for (const v of rows) {
    const key = v.metodo_pago ?? "unknown";
    breakdown[key] = (breakdown[key] ?? 0) + Number(v.total ?? 0);
  }

  const { data: openSession } = await supabase
    .from("cash_sessions")
    .select("opening_cash")
    .eq("id", sessionId)
    .single();

  const expectedCash = (openSession?.opening_cash ?? 0) + cashSales;
  const difference = input.closing_cash_counted - expectedCash;

  const { data: commissionSummary } = await supabase
    .from("commission_records")
    .select("total_commission")
    .eq("session_id", sessionId);

  const totalCommission = (commissionSummary ?? []).reduce(
    (sum: number, r: { total_commission: number }) => sum + Number(r.total_commission),
    0,
  );

  const { data, error } = await supabase
    .from("cash_sessions")
    .update({
      closing_cash_counted: input.closing_cash_counted,
      session_status: "closed",
      closed_at: new Date().toISOString(),
      notas: input.notas ?? null,
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "close_failed", message: error.message }, 400);
  }

  return c.json({
  data,
  summary: {
    cash_sales: cashSales,
    expected_cash: expectedCash,
    counted_cash: input.closing_cash_counted,
    difference,
    total_commission: totalCommission,
    breakdown,
  },
});
});

cashSessionsRoutes.patch("/:id/reconcile", zValidator("json", ReconcileSchema), async (c) => {
  const sessionId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("cash_sessions")
    .update({
      session_status: "reconciled",
      reconciled_by: user.id,
      reconciled_at: new Date().toISOString(),
      notas: input.notas ? `${input.notas}` : undefined,
    })
    .eq("id", sessionId)
    .eq("session_status", "closed")
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "reconcile_failed", message: error.message }, 400);
  }

  if (!data) {
    return c.json({ code: "not_closed", message: "La sesión debe estar cerrada antes de reconciliar" }, 400);
  }

  return c.json({ data });
});

cashSessionsRoutes.get("/history", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const limit = Math.min(Number(c.req.query("limit") ?? 30), 100);

  let query = supabase
    .from("rep_session_summary_view")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(limit);

  query = query.eq("empresa_id", empresaId);

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

cashSessionsRoutes.get("/:id", async (c) => {
  const sessionId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return c.json({ code: "not_found", message: "Sesión no encontrada" }, 404);
  }

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago, channel, created_at, productos")
    .eq("cash_session_id", sessionId)
    .order("created_at", { ascending: true });

  const { data: commissions } = await supabase
    .from("commission_records")
    .select("id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, total_commission, calculated_at")
    .eq("session_id", sessionId);

  const { data: repProfile } = await supabase
    .from("rep_profiles")
    .select("display_name, commission_tier, current_streak_days")
    .eq("user_id", session.rep_id)
    .single();

  return c.json({
    data: {
      session,
      ventas: ventas ?? [],
      commissions: commissions ?? [],
      rep: repProfile ?? null,
    },
  });
});

cashSessionsRoutes.get("/export/csv", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const from = c.req.query("from") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const to = c.req.query("to") ?? new Date().toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_cash, closing_cash_counted, cash_difference, session_status, rep_id")
    .eq("empresa_id", empresaId)
    .gte("opened_at", from)
    .lte("opened_at", to + "T23:59:59")
    .order("opened_at", { ascending: true });

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

  const { data: commissions } = await supabase
    .from("commission_records")
    .select("session_id, rep_id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, total_commission, paid, created_at")
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true });

  const { data: reps } = await supabase
    .from("rep_profiles")
    .select("user_id, display_name, commission_tier")
    .eq("empresa_id", empresaId);

  const repMap = new Map((reps ?? []).map((r: { user_id: string; display_name: string; commission_tier: string }) => [r.user_id, r]));

  const header = "fecha,rep,tier,efectivo_inicial,efectivo_contado,diferencia,estado,comision_base,multiplicador,loyalty,streak,comision_total,pagada\n";
  const rows: string[] = [];

  for (const s of sessions ?? []) {
    const rep = repMap.get((s as { rep_id: string }).rep_id);
    const sessionComms = (commissions ?? []).filter((c: { session_id: string }) => c.session_id === (s as { id: string }).id);
    const totalBase = sessionComms.reduce((sum: number, c: { base_commission: number }) => sum + Number(c.base_commission), 0);
    const totalMultiplier = sessionComms.length > 0 ? sessionComms.reduce((sum: number, c: { volume_multiplier: number }) => sum + Number(c.volume_multiplier), 0) / sessionComms.length : 0;
    const totalLoyalty = sessionComms.reduce((sum: number, c: { loyalty_bonus: number }) => sum + Number(c.loyalty_bonus), 0);
    const totalStreak = sessionComms.reduce((sum: number, c: { streak_bonus: number }) => sum + Number(c.streak_bonus), 0);
    const totalComm = sessionComms.reduce((sum: number, c: { total_commission: number }) => sum + Number(c.total_commission), 0);
    const allPaid = sessionComms.length > 0 && sessionComms.every((c: { paid: boolean }) => c.paid);

    rows.push([
      (s as { opened_at: string }).opened_at.slice(0, 10),
      `"${rep?.display_name ?? 'desconocido'}"`,
      rep?.commission_tier ?? 'base',
      (s as { opening_cash: number }).opening_cash,
      (s as { closing_cash_counted: number | null }).closing_cash_counted ?? '',
      (s as { cash_difference: number | null }).cash_difference ?? '',
      (s as { session_status: string }).session_status,
      totalBase,
      totalMultiplier.toFixed(2),
      totalLoyalty,
      totalStreak,
      totalComm,
      allPaid ? 'si' : 'no',
    ].join(','));
  }

  const csv = header + rows.join('\n');
  return c.body(csv, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="cierres-caja_${from}_${to}.csv"`,
  });
});
