import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware } from "@/api/lib/middleware";
import { getVapidPublicKey, sendWebPush } from "@/lib/notifications/push-sender";
import { getEnvOrThrow } from "../lib/env";

const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  app_source: z.enum(["tienda", "nucleo", "campo"]).default("tienda"),
  topics: z.array(z.string()).optional().default(["general"]),
});

const PushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const PushTestSchema = z.object({
  endpoint: z.string().url().optional(),
  title: z.string().default("Enjambre Legado"),
  body: z.string().default("Prueba de notificación push operativa."),
  url: z.string().default("/"),
});

export const pushRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * Obtener la clave pública VAPID para suscripción en el navegador
 */
pushRoutes.get("/vapid-public-key", (c) => {
  const publicKey = getVapidPublicKey();
  return c.json({ publicKey });
});

/**
 * Registrar suscripción Web Push (público o autenticado)
 */
pushRoutes.post(
  "/subscribe",
  zValidator("json", PushSubscribeSchema),
  async (c) => {
    const input = c.req.valid("json");
    const userAgent = c.req.header("user-agent") || null;

    const supabase = createClient(
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Si viene token de auth, asociamos el user_id
    let userId: string | null = null;
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
      }
    }

    const { data, error } = await supabase.rpc("save_push_subscription", {
      p_endpoint: input.endpoint,
      p_p256dh: input.keys.p256dh,
      p_auth: input.keys.auth,
      p_app_source: input.app_source,
      p_user_agent: userAgent,
      p_topics: input.topics,
    });

    if (error) {
      // Fallback si la función RPC aún no estuviese aplicada: upsert directo
      const { error: upsertError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          app_source: input.app_source,
          user_agent: userAgent,
          topics: input.topics,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

      if (upsertError) {
        return c.json({ code: "save_failed", message: upsertError.message }, 500);
      }
    }

    return c.json({ success: true, data });
  },
);

/**
 * Desuscribir un endpoint
 */
pushRoutes.delete(
  "/unsubscribe",
  zValidator("json", PushUnsubscribeSchema),
  async (c) => {
    const input = c.req.valid("json");

    const supabase = createClient(
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", input.endpoint);

    if (error) {
      return c.json({ code: "unsubscribe_failed", message: error.message }, 500);
    }

    return c.json({ success: true });
  },
);

/**
 * Enviar notificación de prueba (solo admin autenticado)
 */
pushRoutes.post(
  "/test",
  authMiddleware,
  zValidator("json", PushTestSchema),
  async (c) => {
    const user = c.get("user");
    const metaRole = user?.app_metadata?.role;
    const isAdmin = metaRole === "admin" || metaRole === "gerente";

    if (!isAdmin) {
      return c.json({ code: "forbidden", message: "Solo administradores" }, 403);
    }

    const input = c.req.valid("json");
    const supabase = createClient(
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let query = supabase.from("push_subscriptions").select("endpoint, p256dh, auth");
    if (input.endpoint) {
      query = query.eq("endpoint", input.endpoint);
    } else {
      query = query.eq("user_id", user.id);
    }

    const { data: subs, error } = await query;
    if (error || !subs || subs.length === 0) {
      return c.json(
        {
          code: "not_found",
          message: "No se encontraron suscripciones activas para este usuario.",
        },
        404,
      );
    }

    const results = [];
    for (const sub of subs) {
      const res = await sendWebPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        {
          title: input.title,
          body: input.body,
          url: input.url,
        },
      );
      results.push(res);
    }

    return c.json({ success: true, count: results.length, details: results });
  },
);
