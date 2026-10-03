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
  puntos_canje_bloque: z.number().int().min(1).max(10000).optional(),
  clp_descuento_bloque: z.number().int().min(100).max(100000).optional(),
  clp_gasto_por_punto: z.number().int().min(1).max(10000).optional(),
  clp_gasto_por_ciclo: z.number().int().min(1).max(1000000).optional(),
  ciclos_por_resena: z.number().min(0).max(1000).optional(),
  ciclos_bienvenida_reposicion: z.number().int().min(0).max(1000).optional(),
  puntos_por_frasco: z.number().int().min(0).max(100000).optional(),
  ciclos_por_frasco: z.number().int().min(0).max(1000).optional(),
  puntos_bono_hito10: z.number().int().min(0).max(1000000).optional(),
  ciclos_bono_hito10: z.number().int().min(0).max(1000).optional(),
  cart_abandonment_grace_minutes: z.number().int().min(5).max(1440).optional(),
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

const GUARDIAN_TIER_UPDATE_SCHEMA = z.object({
  tiers: z.array(
    z.object({
      tier: z.enum(["OBRERA", "ZÁNGANO", "REINA", "COLMENA"]),
      min_ciclos: z.number().min(0),
      min_spent: z.number().min(0).optional(),
      min_trees: z.number().int().min(0).optional(),
      priority: z.number().int().min(1),
      etiqueta_narrativa: z.string().nullable().optional(),
    }),
  ),
});

/** GET /api/enjambre/guardian-tiers — admin */
enjambreRoutes.get("/guardian-tiers", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("guardian_tier_configs")
    .select("*")
    .order("priority", { ascending: true });
  if (error) return c.json({ code: "list_failed", message: error.message }, 400);
  return c.json({ data: data ?? [] });
});

/** PATCH /api/enjambre/guardian-tiers — admin */
enjambreRoutes.patch(
  "/guardian-tiers",
  requireProfileRole("admin"),
  zValidator("json", GUARDIAN_TIER_UPDATE_SCHEMA),
  async (c) => {
    const { tiers } = c.req.valid("json");
    const supabase = c.get("supabase");

    for (const t of tiers) {
      const { error } = await supabase
        .from("guardian_tier_configs")
        .upsert(
          {
            tier: t.tier,
            min_ciclos: t.min_ciclos,
            min_spent: t.min_spent ?? 0,
            min_trees: t.min_trees ?? 0,
            priority: t.priority,
            etiqueta_narrativa: t.etiqueta_narrativa ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tier" },
        );
      if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    }

    const { data: updated } = await supabase
      .from("guardian_tier_configs")
      .select("*")
      .order("priority", { ascending: true });
    return c.json({ data: updated ?? [] });
  },
);

const GUARDIAN_STAMP_PROGRAM_SCHEMA = z.object({
  producto_id: z.string().uuid(),
  nombre: z.string().min(1),
  unidades_requeridas: z.number().int().min(1),
  unidad_gratis: z.number().int().min(1).default(1),
  activo: z.boolean().default(true),
  canales: z.array(z.string()).default(["web", "feria", "local"]),
  wallet_label: z.string().nullable().optional(),
  imagen_url: z.string().nullable().optional(),
  bonus_resena: z.boolean().default(true),
});

/** GET /api/enjambre/guardian-stamps — admin */
enjambreRoutes.get("/guardian-stamps", requireProfileRole("admin"), async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("guardian_stamp_programs")
    .select("*, productos(id, nombre, precio, foto_url)")
    .order("created_at", { ascending: false });
  if (error) return c.json({ code: "list_failed", message: error.message }, 400);
  return c.json({ data: data ?? [] });
});

/** POST /api/enjambre/guardian-stamps — admin */
enjambreRoutes.post(
  "/guardian-stamps",
  requireProfileRole("admin"),
  zValidator("json", GUARDIAN_STAMP_PROGRAM_SCHEMA),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("guardian_stamp_programs")
      .insert(input)
      .select("*, productos(id, nombre, precio, foto_url)")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/enjambre/guardian-stamps/:id — admin */
enjambreRoutes.patch(
  "/guardian-stamps/:id",
  requireProfileRole("admin"),
  zValidator("json", GUARDIAN_STAMP_PROGRAM_SCHEMA.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("guardian_stamp_programs")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, productos(id, nombre, precio, foto_url)")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/enjambre/guardian-stamps/:id — admin */
enjambreRoutes.delete("/guardian-stamps/:id", requireProfileRole("admin"), async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("guardian_stamp_programs").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ success: true });
});
