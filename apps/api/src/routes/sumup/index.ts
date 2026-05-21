import type { AppVariables } from "../../types/hono";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createSupabaseUserClient } from "../../lib/supabase";
import { transactionsRouter } from "./transactions";
import { payoutsRouter } from "./payouts";
import { conciliacionRouter } from "./conciliacion";

export const sumupRoutes = new Hono<{ Variables: AppVariables }>();

sumupRoutes.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" as const }, 401);
  }

  const accessToken = authHeader.substring(7);
  const supabase = createSupabaseUserClient(accessToken);

  try {
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return c.json({ error: "Invalid token" as const }, 401);
    }

    const empresaId = c.req.header("x-empresa-id") as string;
    if (!empresaId) {
      return c.json({ error: "x-empresa-id header required" as const }, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" as const }, 404);
    }

    c.set("user", user);
    c.set("accessToken", accessToken);
    c.set("supabase", supabase);
    c.set("empresaId", empresaId);
    c.set("rol", profile.role as string);

    await next();
  } catch (error) {
    console.error("Auth error:", error);
    return c.json({ error: "Unauthorized" as const }, 401);
  }
});

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
