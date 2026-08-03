import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, requireProfileRole, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

export const comisionesRoutes = new Hono<{ Variables: AppVariables }>();

comisionesRoutes.use("*", authMiddleware, requireProfileRole("admin"), tenantMiddleware);

/** Resumen de comisiones por rep: ganado, pagado, pendiente. */
comisionesRoutes.get("/resumen", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("commission_records")
    .select("rep_id, total_commission, paid, paid_at")
    .eq("empresa_id", empresaId);

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const porRep = new Map<
    string,
    { ganado: number; pagado: number; pendiente: number; nTotal: number; nPendientes: number }
  >();
  for (const r of data ?? []) {
    const acc = porRep.get(r.rep_id) ?? { ganado: 0, pagado: 0, pendiente: 0, nTotal: 0, nPendientes: 0 };
    const total = Number(r.total_commission ?? 0);
    acc.ganado += total;
    acc.nTotal += 1;
    if (r.paid) {
      acc.pagado += total;
    } else {
      acc.pendiente += total;
      acc.nPendientes += 1;
    }
    porRep.set(r.rep_id, acc);
  }

  // Nombre de cada rep
  const repIds = [...porRep.keys()];
  // rep_profiles se indexa por user_id; commission_records.rep_id apunta ahí
  const { data: reps } = await supabase
    .from("rep_profiles")
    .select("user_id, display_name")
    .in("user_id", repIds.length ? repIds : ["00000000-0000-0000-0000-000000000000"]);

  const repName = new Map((reps ?? []).map((r) => [r.user_id, r.display_name]));

  const resumen = [...porRep.entries()].map(([repId, v]) => ({
    rep_id: repId,
    nombre: repName.get(repId) ?? null,
    ...v,
    ganado: Math.round(v.ganado * 100) / 100,
    pagado: Math.round(v.pagado * 100) / 100,
    pendiente: Math.round(v.pendiente * 100) / 100,
  }));

  return c.json({ data: resumen });
});

const LiquidarSchema = z.object({
  rep_id: z.string().uuid().optional(),
  hasta: z.string().date().optional(),
}).strict();

/** Marca como pagadas las comisiones pendientes (por rep y/o hasta fecha). */
comisionesRoutes.post("/liquidar", zValidator("json", LiquidarSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");
  const { rep_id, hasta } = c.req.valid("json");

  let query = supabase
    .from("commission_records")
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
      paid_by: user.id,
    })
    .eq("empresa_id", empresaId)
    .eq("paid", false);
  if (rep_id) query = query.eq("rep_id", rep_id);
  if (hasta) query = query.lte("calculated_at", `${hasta}T23:59:59.999Z`);

  const { data, error } = await query.select("id, total_commission");

  if (error) return c.json({ code: "liquidar_failed", message: error.message }, 400);

  const monto = (data ?? []).reduce((acc, r) => acc + Number(r.total_commission ?? 0), 0);
  return c.json({ data: { count: data?.length ?? 0, monto: Math.round(monto * 100) / 100 } });
});
