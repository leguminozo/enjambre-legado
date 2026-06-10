import type { AppVariables } from "@/api/lib/middleware";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";
import { transactionsRouter } from "./transactions";
import { payoutsRouter } from "./payouts";
import { conciliacionRouter } from "./conciliacion";
import { readersRouter } from "./readers";

export const sumupRoutes = new Hono<{ Variables: AppVariables }>();

sumupRoutes.use("*", authMiddleware, tenantMiddleware);

sumupRoutes.get("/config", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("sumup_config")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  if (error || !data) {
    return c.json({ config: null });
  }

  const { api_key, ...safeConfig } = data as Record<string, unknown>;
  return c.json({
    config: {
      ...safeConfig,
      hasCredentials: !!api_key,
    },
  });
});

sumupRoutes.post(
  "/config",
  zValidator("json", z.object({
    apiKey: z.string().min(1),
    merchantCode: z.string().min(1),
    environment: z.enum(["live", "test"]).default("test"),
    enabled: z.boolean().default(false),
    syncIntervalMinutes: z.number().int().min(5).max(1440).default(30),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const empresaId = c.get("empresaId");
    const { apiKey, merchantCode, environment, enabled, syncIntervalMinutes } = c.req.valid("json");

    const { data: existing } = await supabase
      .from("sumup_config")
      .select("id")
      .eq("empresa_id", empresaId)
      .single();

    const payload = {
      empresa_id: empresaId,
      api_key: apiKey,
      merchant_code: merchantCode,
      environment,
      enabled,
      sync_interval_minutes: syncIntervalMinutes,
    };

    if (existing) {
      const { error } = await supabase
        .from("sumup_config")
        .update(payload)
        .eq("empresa_id", empresaId);

      if (error) {
        return c.json({ error: error.message }, 500);
      }
    } else {
      const { error } = await supabase
        .from("sumup_config")
        .insert(payload);

      if (error) {
        return c.json({ error: error.message }, 500);
      }
    }

    return c.json({ success: true });
  }
);

sumupRoutes.route("/transactions", transactionsRouter);
sumupRoutes.route("/payouts", payoutsRouter);
sumupRoutes.route("/conciliacion", conciliacionRouter);
sumupRoutes.route("/readers", readersRouter);
