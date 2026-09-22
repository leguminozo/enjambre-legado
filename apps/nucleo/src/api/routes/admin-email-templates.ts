import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";
import { sendNotificationEmail } from "@/lib/notifications/email-sender";

/**
 * Centro de Correos — control de plantillas de email transaccional.
 * Solo admin. Lee/edita email_templates; log desde notification_events.
 */
export const adminEmailTemplatesRoutes = new Hono<{ Variables: AppVariables }>();

adminEmailTemplatesRoutes.use("*", authMiddleware);
adminEmailTemplatesRoutes.use("*", tenantMiddleware);
adminEmailTemplatesRoutes.use("*", requireProfileRole("admin"));

const EMAIL_TEMPLATE_SEGMENTS = ["cliente", "b2b", "interno", "territorial", "sistema"] as const;
const EMAIL_TEMPLATE_MODES = ["immediate", "queue"] as const;

const PatchTemplateSchema = z.object({
  subject_template: z.string().trim().min(1).max(300).optional(),
  body_template: z.string().trim().min(1).max(4000).optional(),
  enabled: z.boolean().optional(),
  mode: z.enum(EMAIL_TEMPLATE_MODES).optional(),
  send_after_hours: z.number().int().min(0).max(30 * 24).optional(),
  segment: z.enum(EMAIL_TEMPLATE_SEGMENTS).optional(),
});

// GET /api/admin-email-templates — todas las plantillas por segmento
adminEmailTemplatesRoutes.get("/", async (c) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_templates")
    .select("*")
    .order("segment", { ascending: true })
    .order("key", { ascending: true });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data });
});

const LOCALES = ["es", "en", "pt"] as const;

function queryLocale(c: { req: { query: (name: string) => string | undefined } }): string {
  const locale = c.req.query("locale") ?? "es";
  return (LOCALES as readonly string[]).includes(locale) ? locale : "es";
}

// PATCH /api/admin-email-templates/:key — editar plantilla (?locale=es|en|pt).
// Con locale distinto de 'es' y fila inexistente, crea la variante copiando
// segmento/modo de la base (requiere subject_template + body_template).
adminEmailTemplatesRoutes.patch(
  "/:key",
  zValidator("json", PatchTemplateSchema),
  async (c) => {
    const admin = createAdminClient();
    const { key } = c.req.param();
    const locale = queryLocale(c);
    const body = c.req.valid("json");

    const patch: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
    const { data, error } = await admin
      .from("email_templates")
      .update(patch)
      .eq("key", key)
      .eq("locale", locale)
      .select()
      .maybeSingle();

    if (error) return c.json({ code: "update_failed", message: error.message }, 500);
    if (data) return c.json({ data });

    if (locale === "es") {
      return c.json({ code: "not_found", message: "Plantilla no existe" }, 404);
    }
    if (!body.subject_template || !body.body_template) {
      return c.json(
        { code: "variant_needs_content", message: "La variante nueva requiere asunto y cuerpo." },
        400,
      );
    }
    const { data: base } = await admin
      .from("email_templates")
      .select("segment, mode, send_after_hours")
      .eq("key", key)
      .eq("locale", "es")
      .maybeSingle();
    const { data: created, error: createError } = await admin
      .from("email_templates")
      .insert({
        key,
        locale,
        segment: (base?.segment as string | undefined) ?? "sistema",
        subject_template: body.subject_template,
        body_template: body.body_template,
        enabled: body.enabled ?? true,
        mode: body.mode ?? (base?.mode as string | undefined) ?? "queue",
        send_after_hours: body.send_after_hours ?? (base?.send_after_hours as number | undefined) ?? 0,
      })
      .select()
      .maybeSingle();

    if (createError) return c.json({ code: "update_failed", message: createError.message }, 500);
    return c.json({ data: created }, 201);
  },
);

// POST /api/admin-email-templates/:key/test — enviar prueba a un correo
adminEmailTemplatesRoutes.post(
  "/:key/test",
  zValidator("json", z.object({ to: z.string().email().max(160) })),
  async (c) => {
    const admin = createAdminClient();
    const { key } = c.req.param();
    const { to } = c.req.valid("json");

    const { data, error } = await admin
      .from("email_templates")
      .select("*")
      .eq("key", key)
      .eq("locale", queryLocale(c))
      .maybeSingle();
    if (error) return c.json({ code: "query_failed", message: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Plantilla no existe" }, 404);

    try {
      const sent = await sendNotificationEmail(
        to,
        `[Prueba] ${data.subject_template}`,
        `${data.body_template}\n\n--\nCorreo de prueba del Centro de Correos (Núcleo).`,
      );
      return c.json({ data: { ok: true, mock: Boolean(sent.response.mock) } });
    } catch (err) {
      return c.json(
        { code: "send_failed", message: err instanceof Error ? err.message : "Error de envío" },
        502,
      );
    }
  },
);

// GET /api/admin-email-templates/log — historial de envíos por email
adminEmailTemplatesRoutes.get("/log", async (c) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notification_events")
    .select("id, channel, recipient, subject, body, status, provider_response, created_at")
    .eq("channel", "email")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data });
});

const COMPOSE_SEGMENTS = ["cliente", "territorial", "creador", "rep_ventas", "todos"] as const;
const COMPOSE_SEGMENT_BATCH_LIMIT = 200;

const ComposeEmailSchema = z.object({
  recipient: z.string().email().optional(),
  mode: z.enum(["individual", "segmento"]).default("individual"),
  segment: z.enum(COMPOSE_SEGMENTS).optional(),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(10000),
  context: z.enum(["tienda", "pedidos", "territorio", "sistema"]).default("tienda"),
  sendPushAlso: z.boolean().optional().default(false),
});

// POST /api/admin-email-templates/compose — redactar y despachar comunicado.
// Individual: envío inmediato a un correo. Segmento: encola en notification_queue
// (la cola existente lo entrega; tope de 200 por tanda, presupuesto $0).
adminEmailTemplatesRoutes.post(
  "/compose",
  zValidator("json", ComposeEmailSchema),
  async (c) => {
    const admin = createAdminClient();
    const input = c.req.valid("json");

    try {
      const emailContext =
        input.context === "pedidos" ? "tienda" : (input.context as "territorio" | "tienda" | "sistema");

      if (input.mode === "segmento") {
        if (!input.segment) {
          return c.json({ code: "segment_required", message: "Elige un segmento de destinatarios." }, 400);
        }
        let query = admin
          .from("profiles")
          .select("id, email")
          .not("email", "is", null)
          .not("email", "ilike", "%@eliminado.local")
          .limit(COMPOSE_SEGMENT_BATCH_LIMIT);
        if (input.segment !== "todos") {
          query = query.eq("role", input.segment);
        }
        const { data: destinatarios, error: segError } = await query;
        if (segError) return c.json({ code: "segment_failed", message: segError.message }, 500);
        const emails = [...new Set((destinatarios ?? []).map((d) => d.email as string).filter(Boolean))];
        if (emails.length === 0) {
          return c.json({ code: "segment_empty", message: "El segmento no tiene destinatarios." }, 404);
        }

        const batchKey = `centro_correos:${Date.now().toString(36)}`;
        const rows = emails.map((email) => ({
          channel: "email",
          recipient: email,
          subject: input.subject,
          body: input.body,
          status: "pending",
          metadata: { via: "centro_correos_composer", segment: input.segment, batch: batchKey },
        }));
        const { error: queueError } = await admin.from("notification_queue").insert(rows);
        if (queueError) return c.json({ code: "dispatch_failed", message: queueError.message }, 502);

        if (input.sendPushAlso) {
          const pushRows = (destinatarios ?? [])
            .filter((d) => d.id)
            .map((d) => ({
              channel: "push",
              recipient: d.id,
              subject: input.subject,
              body: input.body,
              status: "pending",
              metadata: { via: "centro_correos_composer", segment: input.segment, batch: batchKey },
            }));
          if (pushRows.length > 0) {
            await admin.from("notification_queue").insert(pushRows);
          }
        }

        await admin.from("notification_events").insert({
          channel: "email",
          recipient: `segmento:${input.segment}`,
          subject: input.subject,
          body: `${input.body}\n\n—\nTanda ${batchKey}: ${emails.length} encolados.`,
          status: "sent",
          provider_response: { via: "centro_correos_composer", segment: input.segment, queued: emails.length, batch: batchKey },
        });

        return c.json({
          success: true,
          queued: emails.length,
          message: `Comunicado encolado a ${emails.length} destinatarios del segmento.`,
        });
      }

      if (!input.recipient) {
        return c.json({ code: "recipient_required", message: "Indica el correo del destinatario." }, 400);
      }
      const sent = await sendNotificationEmail(input.recipient, input.subject, input.body, {
        context: emailContext,
      });

      // Registrar evento en notification_events
      await admin.from("notification_events").insert({
        channel: "email",
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        status: "sent",
        provider_response: sent.response,
      });

      // Si solicitó notificación push concurrente, encolar en notification_queue
      if (input.sendPushAlso) {
        await admin.from("notification_queue").insert({
          channel: "push",
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
          status: "pending",
          metadata: { via: "centro_correos_composer" },
        });
      }

      return c.json({
        success: true,
        mock: Boolean(sent.response.mock),
        message: "Comunicado despachado exitosamente",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al despachar correo";
      return c.json({ code: "dispatch_failed", message: msg }, 502);
    }
  },
);