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

// PATCH /api/admin-email-templates/:key — editar plantilla
adminEmailTemplatesRoutes.patch(
  "/:key",
  zValidator("json", PatchTemplateSchema),
  async (c) => {
    const admin = createAdminClient();
    const { key } = c.req.param();
    const body = c.req.valid("json");

    const patch: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
    const { data, error } = await admin
      .from("email_templates")
      .update(patch)
      .eq("key", key)
      .select()
      .maybeSingle();

    if (error) return c.json({ code: "update_failed", message: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Plantilla no existe" }, 404);
    return c.json({ data });
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