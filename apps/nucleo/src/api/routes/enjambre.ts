import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

type Admin = SupabaseClient<Database>;

function admin(): Admin {
  return createAdminClient() as Admin;
}

/**
 * Enjambre — configuración central de beneficios de la tienda ("Únete al
 * Enjambre"). GET/PATCH de la tabla beneficios_enjambre: welcome_points,
 * multiplicadores por rol y umbral de volumen. Esos valores los consumen el
 * hub (/perfil/enjambre) y el pricing del checkout (tienda + núcleo): una
 * sola fuente, corregible sin deploy.
 */
export const enjambreRoutes = new Hono<{ Variables: AppVariables }>();

enjambreRoutes.use("*", authMiddleware, tenantMiddleware);

// Las claves del body son las claves de la tabla directamente.
const CONFIG_SCHEMA = z.object({
  welcome_points: z.number().int().min(0).max(10000).optional(),
  mult_embajador: z.number().min(0.1).max(1).optional(),
  mult_revendedor: z.number().min(0.1).max(1).optional(),
  mult_suscriptor: z.number().min(0.1).max(1).optional(),
  mult_volumen: z.number().min(0.1).max(1).optional(),
  volumen_pedidos: z.number().int().min(1).max(100).optional(),
});

/** GET /api/enjambre/configuracion */
enjambreRoutes.get("/configuracion", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase.from("beneficios_enjambre").select("*").order("clave");
  if (error) return c.json({ code: "list_failed", message: error.message }, 400);
  return c.json({ data: data ?? [] });
});

/** PATCH /api/enjambre/configuracion — upsert por clave (solo admin, RLS) */
enjambreRoutes.patch(
  "/configuracion",
  requireProfileRole("admin"),
  zValidator("json", CONFIG_SCHEMA),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const entries = Object.entries(input);
    if (entries.length === 0) {
      return c.json({ data: [] });
    }

    const updated: Record<string, unknown>[] = [];
    for (const [clave, valor] of entries) {
      if (typeof valor !== "number") continue;
      const { data, error } = await supabase
        .from("beneficios_enjambre")
        .upsert(
          { clave, valor_numerico: valor, updated_at: new Date().toISOString() },
          { onConflict: "clave" },
        )
        .select("*")
        .single();
      if (error) return c.json({ code: "update_failed", message: error.message }, 400);
      if (data) updated.push(data);
    }
    return c.json({ data: updated });
  },
);

/** GET /api/enjambre/colmenas-vinculacion — admin: suscriptores activos + colmenas */
enjambreRoutes.get("/colmenas-vinculacion", requireProfileRole("admin"), async (c) => {
  const supabase = admin();
  const [subs, colmenas, configs] = await Promise.all([
    supabase.from("subscriptions").select("user_id").eq("status", "active"),
    supabase.from("colmenas").select("id, name").order("name"),
    supabase.from("suscriptor_config").select("user_id, colmena_id"),
  ]);

  const userIds = [...new Set((subs.data ?? []).map((s) => s.user_id))];
  const configMap = new Map((configs.data ?? []).map((c) => [c.user_id, c.colmena_id]));
  const perfiles = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] };

  return c.json({
    data: {
      suscriptores: (perfiles.data ?? []).map((p) => ({
        user_id: p.id,
        email: p.email,
        full_name: p.full_name,
        colmena_id: configMap.get(p.id) ?? null,
      })),
      colmenas: colmenas.data ?? [],
    },
  });
});

/** PUT /api/enjambre/colmena — admin: vincula colmena a suscriptor (pasaporte) */
enjambreRoutes.put(
  "/colmena",
  requireProfileRole("admin"),
  zValidator("json", z.object({ user_id: z.string().uuid(), colmena_id: z.string().uuid() })),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = admin();
    const { data, error } = await supabase
      .from("suscriptor_config")
      .upsert({ user_id: input.user_id, colmena_id: input.colmena_id }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);
