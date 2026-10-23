import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";

export const edicionesRoutes = new Hono<{ Variables: AppVariables }>();

const UUID_RE = /^[0-9a-f-]{36}$/i;
const BONO_RESERVA_PUNTOS = 50;

export { BONO_RESERVA_PUNTOS };

const EdicionSchema = z.object({
  producto_id: z.string().regex(UUID_RE),
  nombre: z.string().trim().min(3).max(160),
  abre_at: z.string().datetime().optional(),
  cierra_at: z.string().datetime(),
  cupo_max: z.number().int().min(1).max(10000),
  precio_early_bird: z.number().int().positive(),
  notificar: z.boolean().optional().default(false),
});

// GET /api/ediciones/activas — vitrina pública (Tienda ISR, sin PII).
edicionesRoutes.get("/activas", async (c) => {
  const admin = createAdminClient();
  const productoId = c.req.query("producto_id");

  let query = admin
    .from("ediciones_limitadas")
    .select("id, producto_id, nombre, abre_at, cierra_at, cupo_max, precio_early_bird, productos(id, nombre, slug, precio)")
    .eq("activa", true)
    .gt("cierra_at", new Date().toISOString())
    .order("cierra_at", { ascending: true })
    .limit(20);
  if (productoId) query = query.eq("producto_id", productoId);

  const { data, error } = await query;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const ediciones = (data ?? []) as Array<Record<string, unknown>>;
  const conCupo = await Promise.all(
    ediciones.map(async (e) => {
      const { data: usado } = await admin.rpc("edicion_cupo_usado", {
        p_edicion_id: e.id as string,
      });
      return { ...e, cupo_usado: typeof usado === "number" ? usado : 0 };
    }),
  );
  return c.json({ data: conCupo });
});

// GET /api/ediciones — admin: todas con conteos.
edicionesRoutes.get("/", authMiddleware, requireProfileRole("admin"), async (c) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ediciones_limitadas")
    .select("*, productos(id, nombre, precio)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const ediciones = (data ?? []) as Array<Record<string, unknown>>;
  const conCupo = await Promise.all(
    ediciones.map(async (e) => {
      const { data: usado } = await admin.rpc("edicion_cupo_usado", {
        p_edicion_id: e.id as string,
      });
      const { count: reservas } = await admin
        .from("pre_orders")
        .select("id", { count: "exact", head: true })
        .eq("edicion_id", e.id as string);
      return { ...e, cupo_usado: typeof usado === "number" ? usado : 0, reservas: reservas ?? 0 };
    }),
  );
  return c.json({ data: conCupo });
});

// POST /api/ediciones — crear lanzamiento (admin).
edicionesRoutes.post("/", authMiddleware, requireProfileRole("admin"), zValidator("json", EdicionSchema), async (c) => {
  const admin = createAdminClient();
  const user = c.get("user");
  const input = c.req.valid("json");

  const abre = input.abre_at ?? new Date().toISOString();
  if (new Date(input.cierra_at).getTime() <= new Date(abre).getTime()) {
    return c.json({ code: "ventana_invalida", message: "El cierre debe ser posterior a la apertura." }, 400);
  }

  const { data, error } = await admin
    .from("ediciones_limitadas")
    .insert({
      producto_id: input.producto_id,
      nombre: input.nombre,
      abre_at: abre,
      cierra_at: input.cierra_at,
      cupo_max: input.cupo_max,
      precio_early_bird: input.precio_early_bird,
      creado_por: (user?.id as string | undefined) ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return c.json({ code: "insert_failed", message: error?.message ?? "No se pudo crear" }, 400);
  }

  // Aviso a Guardianes con preferencia de floración (mejor esfuerzo, tope 200).
  let notificados = 0;
  if (input.notificar) {
    try {
      const { data: perfiles } = await admin
        .from("profiles")
        .select("id, email")
        .eq("role", "cliente")
        .not("email", "is", null)
        .not("email", "ilike", "%@eliminado.local")
        .limit(200);
      const emails = [...new Set(
        ((perfiles ?? []) as Array<{ id: string; email: string }>)
          .map((p) => p.email)
          .filter(Boolean),
      )];
      const batch = `edicion:${(data as { id: string }).id}`;
      const rows = emails.map((email) => ({
        channel: "email",
        recipient: email,
        subject: `Edición limitada: ${input.nombre}`,
        body: [
          `Se abrió la reserva anticipada de ${input.nombre}.`,
          `Precio early bird: $${input.precio_early_bird.toLocaleString("es-CL")} · Cupo: ${input.cupo_max} unidades.`,
          `Cierra el ${new Date(input.cierra_at).toLocaleDateString("es-CL")}. Reserva la tuya en la tienda.`,
        ].join("\n"),
        status: "pending",
        metadata: { via: "edicion_limitada", batch },
      }));
      if (rows.length > 0) {
        const { error: qErr } = await admin.from("notification_queue").insert(rows);
        if (!qErr) notificados = rows.length;
      }
    } catch (err) {
      console.warn("[ediciones] notify failed:", err);
    }
  }

  return c.json({ data, notificados }, 201);
});

// GET /api/ediciones/:id/reservas — reservas de la edición (admin).
edicionesRoutes.get("/:id/reservas", authMiddleware, requireProfileRole("admin"), async (c) => {
  const admin = createAdminClient();
  const id = c.req.param("id");
  if (!UUID_RE.test(id)) return c.json({ code: "invalid_id", message: "ID inválido" }, 400);
  const { data, error } = await admin
    .from("pre_orders")
    .select("id, user_id, email, quantity, status, created_at, profiles!pre_orders_user_id_fkey(full_name)")
    .eq("edicion_id", id)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

// POST /api/ediciones/:id/confirmar — reserved → confirmed + aviso con precio bloqueado.
edicionesRoutes.post("/:id/confirmar", authMiddleware, requireProfileRole("admin"), async (c) => {
  const admin = createAdminClient();
  const id = c.req.param("id");
  if (!UUID_RE.test(id)) return c.json({ code: "invalid_id", message: "ID inválido" }, 400);

  const { data: edicion } = await admin
    .from("ediciones_limitadas")
    .select("id, nombre, precio_early_bird, producto_id, productos(nombre, slug)")
    .eq("id", id)
    .maybeSingle();
  if (!edicion) return c.json({ code: "not_found", message: "Edición no encontrada" }, 404);
  const edRaw = edicion as unknown as {
    nombre: string; precio_early_bird: number;
    productos: { nombre: string; slug: string } | Array<{ nombre: string; slug: string }> | null;
  };
  const prod = Array.isArray(edRaw.productos) ? edRaw.productos[0] ?? null : edRaw.productos;
  const ed = { nombre: edRaw.nombre, precio_early_bird: edRaw.precio_early_bird, productos: prod };

  const { data: reservas } = await admin
    .from("pre_orders")
    .select("id, user_id, email")
    .eq("edicion_id", id)
    .eq("status", "reserved")
    .limit(500);

  let confirmadas = 0;
  for (const r of (reservas ?? []) as Array<{ id: string; user_id: string | null; email: string | null }>) {
    const { error } = await admin
      .from("pre_orders")
      .update({ status: "confirmed" })
      .eq("id", r.id)
      .eq("status", "reserved");
    if (error) continue;
    confirmadas += 1;
    const destino = r.email ?? r.user_id;
    if (destino) {
      await admin.from("notification_queue").insert({
        channel: r.email ? "email" : "push",
        recipient: destino,
        subject: `Tu reserva quedó confirmada: ${ed.nombre}`,
        body: [
          `Tu cupo de ${ed.productos?.nombre ?? ed.nombre} está confirmado.`,
          `Precio bloqueado early bird: $${Number(ed.precio_early_bird).toLocaleString("es-CL")}.`,
          `Completa tu compra en la tienda antes del despacho.`,
        ].join("\n"),
        status: "pending",
        metadata: { via: "edicion_confirmada", edicion_id: id },
      });
    }
  }

  return c.json({ data: { confirmadas } });
});

// PATCH /api/ediciones/:id — pausar/cerrar (admin).
edicionesRoutes.patch(
  "/:id",
  authMiddleware,
  requireProfileRole("admin"),
  zValidator("json", z.object({ activa: z.boolean() })),
  async (c) => {
    const admin = createAdminClient();
    const id = c.req.param("id");
    if (!UUID_RE.test(id)) return c.json({ code: "invalid_id", message: "ID inválido" }, 400);
    const { activa } = c.req.valid("json");
    const { data, error } = await admin
      .from("ediciones_limitadas")
      .update({ activa })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return c.json({ code: "update_failed", message: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Edición no encontrada" }, 404);
    return c.json({ data });
  },
);
