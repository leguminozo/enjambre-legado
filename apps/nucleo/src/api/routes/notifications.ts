import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { processNotificationQueue } from "@/lib/notifications/worker";

const EnqueueNotificationSchema = z.object({
  channel: z.enum(["email", "whatsapp", "push", "system"]),
  recipient: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

const MarkReadSchema = z.object({
  id: z.string().uuid().optional(),
  is_all: z.boolean().optional().default(false),
});

export const notificationsRoutes = new Hono<{ Variables: AppVariables }>();

// Rutas de alertas in-app (requieren autenticación)
notificationsRoutes.use("*", authMiddleware);

/**
 * Listar alertas in-app para el usuario actual
 */
notificationsRoutes.get("/", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ success: true, data });
});

/**
 * Marcar alertas como leídas
 */
notificationsRoutes.post("/read", zValidator("json", MarkReadSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const input = c.req.valid("json");

  if (input.is_all) {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      return c.json({ code: "update_failed", message: error.message }, 500);
    }
  } else if (input.id) {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) {
      return c.json({ code: "update_failed", message: error.message }, 500);
    }
  } else {
    return c.json({ code: "bad_request", message: "Debe especificar 'id' o 'is_all'" }, 400);
  }

  return c.json({ success: true, message: "Alertas marcadas como leídas" });
});

/**
 * Encolar una nueva notificación en la cola de salida (requiere rol de admin o gerente)
 */
notificationsRoutes.post(
  "/enqueue",
  tenantMiddleware,
  zValidator("json", EnqueueNotificationSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const empresaId = c.get("empresaId");
    const input = c.req.valid("json");

    // Encolar en notification_queue
    const { data: queueData, error: queueError } = await (supabase as any)
      .from("notification_queue")
      .insert({
        empresa_id: empresaId,
        channel: input.channel,
        recipient: input.recipient,
        subject: input.subject ?? null,
        body: input.body,
        status: "pending",
        metadata: input.metadata,
      })
      .select()
      .single();

    if (queueError) {
      return c.json({ code: "enqueue_failed", message: queueError.message }, 500);
    }

    // Si es una notificación de canal 'system' (in-app alert),
    // también insertamos directamente en la tabla de alertas
    if (input.channel === "system") {
      const { error: alertError } = await supabase.from("alerts").insert({
        user_id: input.recipient, // Asumiendo que recipient es el user_id para notificaciones system
        severity: (input.metadata?.severity as string) ?? "info",
        title: input.subject ?? "Nueva alerta de sistema",
        message: input.body,
        is_read: false,
      });

      if (alertError) {
        console.error("[Notifications BFF] Error al crear alerta para notificación system:", alertError.message);
      }
    }

    return c.json({
      success: true,
      message: "Notificación encolada exitosamente",
      data: queueData,
    });
  }
);

/**
 * Trigger manual o por cron del worker de notificaciones (solo admin/gerente o con secreto).
 * Permite invocar processNotificationQueue de forma controlada (Vercel Cron, pg_cron o admin UI).
 */
notificationsRoutes.post("/trigger-worker", authMiddleware, async (c) => {
  const user = c.get("user");
  const role = (user as any)?.app_metadata?.role;

  const isAdmin = role === "admin" || role === "gerente";
  const secret = c.req.header("x-worker-secret");
  const hasSecret = secret && secret === process.env.NOTIFICATIONS_WORKER_SECRET;

  if (!isAdmin && !hasSecret) {
    return c.json({ code: "forbidden", message: "Solo admin/gerente o secreto válido" }, 403);
  }

  try {
    const result = await processNotificationQueue();
    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ code: "worker_failed", message: err.message }, 500);
  }
});
