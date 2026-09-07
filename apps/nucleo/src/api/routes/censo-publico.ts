import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";
import { rateLimit, getIdentifierFromRequest } from "@/api/lib/rate-limit";
import { CONTACTO_INSTITUCIONAL } from "@/lib/contacto-institucional";
import { getInformeComunal, getInformesChiloe } from "@/lib/informe-comunal-data";
import { sendNotificationEmail } from "@/lib/notifications/email-sender";

/**
 * Stats públicos del censo apícola.
 * Solo agregados: nunca filas crudas ni coordenadas.
 */
export const censoPublicoRoutes = new Hono<{ Variables: AppVariables }>();

const contactLimit = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 });

const ContactoInstitucionalSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  cargo: z.string().trim().min(2).max(120),
  institucion: z.string().trim().min(2).max(160),
  comuna: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().max(160),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  mensaje: z.string().trim().max(2000).optional().or(z.literal("")),
  /** Honeypot: si viene lleno, se finge éxito. */
  sitio_web: z.string().max(80).optional().or(z.literal("")),
});

// GET /api/censo-publico/stats
censoPublicoRoutes.get("/stats", async (c) => {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("censo_stats_public");

    if (error) {
      return c.json({ code: "query_failed", message: error.message }, 500);
    }

    c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

    return c.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error stats censo";
    return c.json({ code: "censo_stats_failed", message }, 500);
  }
});

// GET /api/censo-publico/comunas — 10 comunas de Chiloé, agregados públicos
censoPublicoRoutes.get("/comunas", async (c) => {
  try {
    const res = await getInformesChiloe();
    if ("error" in res) {
      return c.json({ code: "query_failed", message: res.error }, 500);
    }
    c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return c.json({
      data: {
        territorio: "Provincia de Chiloé",
        informes: res.informes,
        generado_en: res.generado_en,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error informes comunales";
    return c.json({ code: "informe_comunas_failed", message }, 500);
  }
});

// GET /api/censo-publico/comunas/:slug
censoPublicoRoutes.get("/comunas/:slug", async (c) => {
  try {
    const slug = c.req.param("slug");
    const res = await getInformeComunal(slug);
    if (res === null) {
      return c.json({ code: "not_found", message: "Comuna no reconocida en Chiloé" }, 404);
    }
    if ("error" in res) {
      return c.json({ code: "query_failed", message: res.error }, 500);
    }
    c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return c.json({ data: { ...res.informe, generado_en: res.generado_en } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error informe comunal";
    return c.json({ code: "informe_comunal_failed", message }, 500);
  }
});

// POST /api/censo-publico/contacto-institucional
censoPublicoRoutes.post(
  "/contacto-institucional",
  zValidator("json", ContactoInstitucionalSchema),
  async (c) => {
    const limited = contactLimit(`b2g:${getIdentifierFromRequest(c)}`);
    if (!limited.success) {
      return c.json(
        { code: "rate_limit_exceeded", message: "Demasiadas solicitudes. Escribe o llama directo." },
        429,
      );
    }

    const input = c.req.valid("json");
    if (input.sitio_web && input.sitio_web.trim().length > 0) {
      return c.json({ data: { ok: true } }, 200);
    }

    const lines = [
      `<p><strong>Nuevo contacto institucional</strong></p>`,
      `<p>Nombre: ${escapeHtml(input.nombre)}<br/>`,
      `Cargo: ${escapeHtml(input.cargo)}<br/>`,
      `Institución: ${escapeHtml(input.institucion)}<br/>`,
      `Comuna: ${escapeHtml(input.comuna || "—")}<br/>`,
      `Email: ${escapeHtml(input.email)}<br/>`,
      `Teléfono: ${escapeHtml(input.telefono || "—")}</p>`,
      `<p>${escapeHtml(input.mensaje || "(sin mensaje)")}</p>`,
    ].join("");

    try {
      const sent = await sendNotificationEmail(
        CONTACTO_INSTITUCIONAL.email,
        `Contacto institucional: ${input.institucion} — ${input.nombre}`,
        lines,
        { replyTo: input.email },
      );
      const mocked = Boolean(sent.response.mock);
      if (mocked && process.env.VERCEL_ENV === "production") {
        return c.json(
          {
            code: "email_failed",
            message: "El correo no está configurado. Usa WhatsApp o escribe directo.",
          },
          502,
        );
      }

      try {
        const admin = createAdminClient();
        await admin.from("notification_queue").insert({
          empresa_id: null,
          channel: "email",
          recipient: CONTACTO_INSTITUCIONAL.email,
          subject: `Contacto institucional: ${input.institucion}`,
          body: `${input.nombre} · ${input.cargo} · ${input.email} · ${input.mensaje ?? ""}`,
          status: mocked ? "pending" : "sent",
          metadata: {
            source: "contacto_institucional",
            email: input.email,
            institucion: input.institucion,
            comuna: input.comuna || null,
          },
        });
      } catch {
        /* el correo ya salió; la cola es auditoría, no bloquea */
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el correo";
      return c.json({ code: "email_failed", message }, 502);
    }

    return c.json({ data: { ok: true } }, 200);
  },
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
