import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { processNotificationQueue } from "@/lib/notifications/worker";
import { inferNotificationSeverity } from "@enjambre/auth/in-app-notifications";
import {
  parseNotificationPreferences,
  shouldSendNotification,
} from "@enjambre/auth/notification-preferences";
import { verifyInternalApiKey } from "@enjambre/auth/internal-api-secret";
import { getEnvOrThrow } from "../lib/env";

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

const WelcomeInternalSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
  source: z.enum(["tienda_signup"]).optional().default("tienda_signup"),
});

export const notificationsRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * Bienvenida post-registro (tienda → BFF interno).
 * Encola en notification_queue + crea notification_events in_app para NotificationBell.
 */
notificationsRoutes.post("/internal/welcome", async (c) => {
  const internalKey = c.req.header("x-internal-key");
  if (!verifyInternalApiKey(internalKey)) {
    return c.json({ code: "unauthorized", message: "Invalid internal key" }, 401);
  }

  const parsed = WelcomeInternalSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  }

  const { userId, email, source } = parsed.data;
  const subject = parsed.data.subject ?? "Bienvenido al Legado";
  const body =
    parsed.data.body ??
    "Gracias por unirte. Explora tus alertas de floración y el impacto de tu colmena.";

  const supabase = createClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .maybeSingle();

  const preferences = parseNotificationPreferences(profile?.notification_preferences);
  const allowEmail = shouldSendNotification(preferences, "sistema", "email");
  const allowInApp = shouldSendNotification(preferences, "sistema", "in_app");
  const dedupeKey = `welcome:${userId}`;

  if (!allowEmail && !allowInApp) {
    const { error: skipError } = await supabase.from("notification_queue").insert({
      empresa_id: null,
      channel: "system",
      recipient: email,
      subject,
      body,
      status: "sent",
      metadata: {
        dedupe_key: dedupeKey,
        user_id: userId,
        source,
        skipped_preferences: true,
      },
    });

    if (skipError) {
      console.error("[notifications/internal/welcome] preference skip failed:", skipError.message);
      return c.json({ code: "enqueue_failed", message: skipError.message }, 500);
    }

    return c.json({ enqueued: false, skipped_preferences: true }, 200);
  }

  const { data: existingDedupe } = await supabase
    .from("notification_queue")
    .select("id")
    .filter("metadata->>dedupe_key", "eq", dedupeKey)
    .limit(1)
    .maybeSingle();

  if (existingDedupe) {
    return c.json({ enqueued: true, duplicate: true }, 200);
  }

  if (allowInApp) {
    const { error: queueError } = await supabase.from("notification_queue").insert({
      empresa_id: null,
      channel: "system",
      recipient: email,
      subject,
      body,
      status: "pending",
      metadata: {
        dedupe_key: dedupeKey,
        user_id: userId,
        in_app: true,
        source,
        category: "sistema",
      },
    });

    if (queueError) {
      console.error("[notifications/internal/welcome] queue insert failed:", queueError.message);
      return c.json({ code: "enqueue_failed", message: queueError.message }, 500);
    }
  }

  if (allowEmail) {
    const { error: emailError } = await supabase.from("notification_queue").insert({
      empresa_id: null,
      channel: "email",
      recipient: email,
      subject,
      body,
      status: "pending",
      metadata: {
        dedupe_key: `${dedupeKey}:email`,
        user_id: userId,
        source,
        category: "sistema",
      },
    });

    if (emailError) {
      console.error("[notifications/internal/welcome] email queue insert failed:", emailError.message);
      return c.json({ code: "enqueue_failed", message: emailError.message }, 500);
    }
  }

  if (allowInApp) {
    const { data: existingInApp } = await supabase
      .from("notification_events")
      .select("id")
      .eq("channel", "in_app")
      .eq("created_by", userId)
      .eq("subject", subject)
      .limit(1)
      .maybeSingle();

    if (!existingInApp) {
      const { error: eventError } = await supabase.from("notification_events").insert({
        channel: "in_app",
        recipient: email,
        subject,
        body,
        status: "sent",
        created_by: userId,
        provider_response: { source, via: "notifications/internal/welcome", category: "sistema" },
      });

      if (eventError) {
        console.error(
          "[notifications/internal/welcome] notification_events insert failed:",
          eventError.message,
        );
        return c.json({ code: "event_failed", message: eventError.message }, 500);
      }
    }
  }

  return c.json({ enqueued: true }, 201);
});

// Rutas de alertas in-app (requieren autenticación)
notificationsRoutes.use("*", authMiddleware);

/**
 * Listar notificaciones in-app (notification_events) para el usuario actual.
 * Estado leído: client-side vía useInAppNotifications (localStorage cross-app).
 */
notificationsRoutes.get("/", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("notification_events")
    .select("id, channel, subject, body, created_at, recipient, status, provider_response, created_by")
    .eq("created_by", user.id)
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    title: row.subject ?? "Notificación",
    message: row.body ?? "",
    subject: row.subject,
    body: row.body,
    created_at: row.created_at,
    severity: inferNotificationSeverity(row.subject, row.provider_response),
    is_read: false,
  }));

  return c.json({ success: true, data: mapped });
});

/**
 * Marcar como leídas (compat API). El estado leído vive en cliente (useInAppNotifications).
 */
notificationsRoutes.post("/read", zValidator("json", MarkReadSchema), async (c) => {
  const input = c.req.valid("json");

  if (!input.is_all && !input.id) {
    return c.json({ code: "bad_request", message: "Debe especificar 'id' o 'is_all'" }, 400);
  }

  return c.json({ success: true, message: "Marcado en cliente (notification_events)" });
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

    if (input.channel === "system") {
      const { error: eventError } = await supabase.from("notification_events").insert({
        channel: "in_app",
        recipient: input.recipient,
        subject: input.subject ?? "Nueva alerta de sistema",
        body: input.body,
        status: "sent",
        created_by: input.recipient,
        provider_response: {
          source: "notifications/enqueue",
          severity: (input.metadata?.severity as string) ?? "info",
        },
      });

      if (eventError) {
        console.error("[Notifications BFF] Error al crear notification_events in_app:", eventError.message);
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
