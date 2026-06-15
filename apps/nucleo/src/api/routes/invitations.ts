import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const CreateInvitationSchema = z.object({
  roles: z.array(z.string().min(1)).min(1).default(["rep_ventas"]),
  tools: z.record(z.string(), z.unknown()).default({}),
  max_uses: z.number().int().min(1).optional(),
  expires_at: z.string().datetime().optional(),
});

const UpdateInvitationSchema = z.object({
  active: z.boolean().optional(),
  max_uses: z.number().int().min(1).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  roles: z.array(z.string().min(1)).optional(),
  tools: z.record(z.string(), z.unknown()).optional(),
});

const RedeemSchema = z.object({
  code: z.string().min(4).max(20),
});

const UpdateRepSchema = z.object({
  display_name: z.string().min(2).max(60).optional(),
  commission_tier: z.enum(["base", "senior", "elite", "legend"]).optional(),
  fixed_monthly: z.number().min(0).optional(),
  active: z.boolean().optional(),
  notas: z.string().max(500).optional(),
});

const PayCommissionsSchema = z.object({
  commission_ids: z.array(z.string().uuid()).min(1),
});

export const invitationsRoutes = new Hono<{ Variables: AppVariables }>();

invitationsRoutes.use("*", authMiddleware);

invitationsRoutes.post("/redeem", zValidator("json", RedeemSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase.rpc("canjear_codigo_invitacion", {
    p_code: input.code,
    p_user_id: user.id,
  });

  if (error) {
    return c.json({ code: "redeem_failed", message: error.message }, 400);
  }

  const result = data?.[0];
  if (!result?.exito) {
    return c.json({ code: "invalid_code", message: "Código inválido, expirado o ya usado" }, 404);
  }

  return c.json({ data: result }, 201);
});

invitationsRoutes.get("/validate/:code", async (c) => {
  const code = c.req.param("code");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("invitation_codes")
    .select("code, roles, tools, max_uses, current_uses, expires_at, active")
    .ilike("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return c.json({ code: "invalid_code", message: "Código no encontrado o inactivo" }, 404);
  }

  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return c.json({ code: "code_exhausted", message: "Código ya no tiene usos disponibles" }, 400);
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return c.json({ code: "code_expired", message: "Código expirado" }, 400);
  }

  const { code: _, current_uses: __, ...safe } = data;
  return c.json({ data: { valido: true, ...safe } });
});

const adminRoutes = new Hono<{ Variables: AppVariables }>();
adminRoutes.use("*", authMiddleware, tenantMiddleware);

adminRoutes.post("/", zValidator("json", CreateInvitationSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data: code, error: codeError } = await supabase.rpc("generar_codigo_invitacion", {
    p_empresa_id: empresaId,
  });

  if (codeError || !code) {
    return c.json({ code: "code_gen_failed", message: "No se pudo generar el código" }, 500);
  }

  const { data, error } = await supabase
    .from("invitation_codes")
    .insert({
      empresa_id: empresaId,
      code,
      created_by: user.id,
      roles: input.roles as any,
      tools: input.tools as any,
      max_uses: input.max_uses ?? null,
      expires_at: input.expires_at ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "invite_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

adminRoutes.get("/", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("invitation_codes")
    .select("*, invitation_redemptions(id, user_id, redeemed_at, roles_assigned)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

adminRoutes.patch("/:id", zValidator("json", UpdateInvitationSchema), async (c) => {
  const invitationId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const payload: Record<string, unknown> = {};
  if (input.active !== undefined) payload.active = input.active;
  if (input.max_uses !== undefined) payload.max_uses = input.max_uses;
  if (input.expires_at !== undefined) payload.expires_at = input.expires_at;
  if (input.roles !== undefined) payload.roles = input.roles;
  if (input.tools !== undefined) payload.tools = input.tools;

  const { data, error } = await supabase
    .from("invitation_codes")
    .update(payload as any)
    .eq("id", invitationId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

adminRoutes.delete("/:id", async (c) => {
  const invitationId = c.req.param("id");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { error } = await supabase
    .from("invitation_codes")
    .delete()
    .eq("id", invitationId)
    .eq("empresa_id", empresaId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

adminRoutes.get("/reps", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
  .from("rep_performance_view")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("total_revenue_lifetime", { ascending: false });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

adminRoutes.patch("/reps/:userId", zValidator("json", UpdateRepSchema), async (c) => {
  const targetUserId = c.req.param("userId");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const payload: Record<string, unknown> = { ...input };

  if (input.active === false) {
    payload.deactivated_at = new Date().toISOString();
  } else if (input.active === true) {
    payload.deactivated_at = null;
  }

  const { data, error } = await supabase
    .from("rep_profiles")
    .update(payload as any)
    .eq("user_id", targetUserId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  if (input.active === false) {
    await supabase
      .from("user_roles")
      .update({ is_active: false })
      .eq("user_id", targetUserId)
      .eq("role", "rep_ventas");
  } else if (input.active === true) {
    await supabase
      .from("user_roles")
      .upsert({ user_id: targetUserId, role: "rep_ventas", is_active: true });
  }

  return c.json({ data });
});

adminRoutes.delete("/reps/:userId", async (c) => {
  const targetUserId = c.req.param("userId");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { error } = await supabase
    .from("rep_profiles")
    .delete()
    .eq("user_id", targetUserId)
    .eq("empresa_id", empresaId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  await supabase
    .from("user_roles")
    .update({ is_active: false })
    .eq("user_id", targetUserId)
    .eq("role", "rep_ventas");

  return c.json({ data: { removed: true } });
});

adminRoutes.post("/commissions/pay", zValidator("json", PayCommissionsSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("commission_records")
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
      paid_by: user.id,
    })
    .in("id", input.commission_ids)
    .eq("paid", false)
    .select("id, rep_id, total_commission, paid_at");

  if (error) {
    return c.json({ code: "pay_failed", message: error.message }, 400);
  }

  const paidTotal = (data ?? []).reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);

const repIds = [...new Set((data ?? []).map((r: { rep_id: string }) => r.rep_id))];
for (const repId of repIds) {
  const repTotal = (data ?? [])
    .filter((r: { rep_id: string }) => r.rep_id === repId)
    .reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);

  const { data: currentRep } = await supabase
      .from("rep_profiles")
      .select("total_commissions_paid")
      .eq("user_id", repId)
      .single();

    if (currentRep) {
      await supabase
        .from("rep_profiles")
        .update({
          total_commissions_paid: Number(currentRep.total_commissions_paid) + repTotal,
        })
        .eq("user_id", repId);
    }
  }

  return c.json({
    data: {
      paid_count: data?.length ?? 0,
      paid_total: paidTotal,
    },
  });
});

adminRoutes.get("/commissions", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const paid = c.req.query("paid");
  const repId = c.req.query("rep_id");

  let query = supabase
    .from("commission_records")
    .select("*, rep:rep_profiles!commission_records_rep_id_fkey(display_name, commission_tier)")
    .eq("empresa_id", empresaId)
    .order("calculated_at", { ascending: false })
    .limit(200);

  if (paid !== undefined) query = query.eq("paid", paid === "true");
  if (repId) query = query.eq("rep_id", repId);

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

invitationsRoutes.route("/", adminRoutes);
