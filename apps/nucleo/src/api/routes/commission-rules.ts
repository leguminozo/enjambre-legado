import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const CreateRuleSchema = z.object({
  rule_type: z.enum(["base", "volume_threshold", "loyalty", "streak"]),
  name: z.string().min(2).max(100),
  parameter: z.record(z.string(), z.unknown()),
  active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
});

const UpdateRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  parameter: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
});

export const commissionRulesRoutes = new Hono<{ Variables: AppVariables }>();

commissionRulesRoutes.use("*", authMiddleware, tenantMiddleware);

commissionRulesRoutes.get("/", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("commission_rules")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("rule_type", { ascending: true })
    .order("priority", { ascending: true });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

commissionRulesRoutes.post("/", zValidator("json", CreateRuleSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("commission_rules")
    .insert({
      empresa_id: empresaId,
      rule_type: input.rule_type,
      name: input.name,
      parameter: input.parameter,
      active: input.active,
      priority: input.priority,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "rule_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

commissionRulesRoutes.patch("/:id", zValidator("json", UpdateRuleSchema), async (c) => {
  const ruleId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const payload: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("commission_rules")
    .update(payload)
    .eq("id", ruleId)
    .eq("empresa_id", empresaId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

commissionRulesRoutes.delete("/:id", async (c) => {
  const ruleId = c.req.param("id");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { error } = await supabase
    .from("commission_rules")
    .delete()
    .eq("id", ruleId)
    .eq("empresa_id", empresaId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

commissionRulesRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [rulesRes, pendingRes, paidRes, repsRes] = await Promise.all([
    supabase
      .from("commission_rules")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("active", true)
      .order("priority", { ascending: true }),
    supabase
      .from("commission_records")
      .select("total_commission, rep_id")
      .eq("empresa_id", empresaId)
      .eq("paid", false),
    supabase
      .from("commission_records")
      .select("total_commission, rep_id")
      .eq("empresa_id", empresaId)
      .eq("paid", true),
    supabase
      .from("rep_performance_view")
      .select("*")
      .eq("empresa_id", empresaId),
  ]);

  const pendingTotal = (pendingRes.data ?? []).reduce(
    (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
    0,
  );
  const paidTotal = (paidRes.data ?? []).reduce(
    (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
    0,
  );

  return c.json({
    data: {
      rules: rulesRes.data ?? [],
      pending_commissions: pendingTotal,
      paid_commissions: paidTotal,
      pending_count: pendingRes.data?.length ?? 0,
      reps: repsRes.data ?? [],
    },
  });
});
