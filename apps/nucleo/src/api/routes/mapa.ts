import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import type { BitacoraSupabase } from "@/lib/bitacora-types";

export const mapaRoutes = new Hono<{ Variables: AppVariables }>();

mapaRoutes.use("*", authMiddleware);
mapaRoutes.use("*", tenantMiddleware);
mapaRoutes.use("*", requireProfileRole("admin"));

// ---------------------------------------------------------------------------
// GET /api/mapa/historial/apiario/:id
// Bitácora geo-temporal consolidada de un apiario: la línea de vida completa
// (colmenas + inspecciones + varroa + peso + cosechas + tratamientos + reinas)
// para el visor del Mapa del Legado.
// ---------------------------------------------------------------------------

mapaRoutes.get(
  "/historial/apiario/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = c.get("supabase");
    const { id } = c.req.valid("param");

    // 1. Apiario
    const { data: apiario, error: errApiario } = await supabase
      .from("apiarios")
      .select("id, name, lat, lng, details, created_at")
      .eq("id", id)
      .maybeSingle();
    if (errApiario) return c.json({ error: errApiario.message }, 500);
    if (!apiario) return c.json({ error: "Apiario no encontrado" }, 404);

    // 2. Colmenas con sus series temporales anidadas
    const { data: colmenas, error: errColmenas } = await supabase
      .from("colmenas")
      .select(`
        id, name, alzas, last_inspection, production_total, floracion, health,
        inspecciones(id, date, fase, marcos_cria, marcos_miel, varroa, poblacion, reina, notes),
        varroa_records(id, date, level, method),
        peso_records(id, date, kg, note)
      `)
      .eq("apiario_id", id);
    if (errColmenas) return c.json({ error: errColmenas.message }, 500);

    const colmenaIds = (colmenas ?? []).map((col) => col.id);

    // 3. Cosechas del apiario (vía sus colmenas)
    let cosechas: unknown[] = [];
    if (colmenaIds.length > 0) {
      const { data: cosechasRows, error: errCosechas } = await supabase
        .from("cosechas")
        .select("id, fecha, kg, floracion, lote_id, colmena_id, created_at")
        .in("colmena_id", colmenaIds)
        .order("fecha", { ascending: false });
      if (errCosechas) return c.json({ error: errCosechas.message }, 500);
      cosechas = cosechasRows ?? [];
    }

    // 4. Tratamientos y reinas (Trama — migración 1006; tipos propios de bitácora)
    let tratamientos: unknown[] = [];
    let reinas: unknown[] = [];
    if (colmenaIds.length > 0) {
      const bitacora = supabase as unknown as BitacoraSupabase;
      const [trat, rein] = await Promise.all([
        bitacora
          .from("tratamientos")
          .select("id, colmena_id, fecha, producto_comercial, principio_activo, enfermedad, retiro_fin, created_at")
          .in("colmena_id", colmenaIds)
          .order("fecha", { ascending: false }),
        bitacora
          .from("reina_history")
          .select("id, colmena_id, fecha, estado, reemplazada_por, created_at")
          .in("colmena_id", colmenaIds)
          .order("fecha", { ascending: false }),
      ]);
      if (trat.error) return c.json({ error: trat.error.message }, 500);
      if (rein.error) return c.json({ error: rein.error.message }, 500);
      tratamientos = trat.data ?? [];
      reinas = rein.data ?? [];
    }

    return c.json({
      data: {
        apiario,
        colmenas: colmenas ?? [],
        cosechas,
        tratamientos,
        reinas,
      },
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/mapa/censo-detallado
// Catastro reservado para el fundador/administración:
// Apiarios del registro territorial con identidad completa del productor
// (RUT, RUP, teléfono, email, prácticas sanitarias, control de varroa,
// colmenas activas y consentimientos) para gestión de abastecimiento directo.
// BLINDADO: Solo accesible por rol 'admin'.
// ---------------------------------------------------------------------------
mapaRoutes.get("/censo-detallado", async (c) => {
  const supabase = c.get("supabase");

  const { data: apiarios, error: errApiarios } = await supabase
    .from("apiarios_registro")
    .select(`
      id,
      nombre,
      comuna,
      zona,
      lat_aproximada,
      lng_aproximada,
      n_colmenas,
      categoria,
      activo,
      observaciones,
      created_at,
      actor_id,
      actores_registro (
        id,
        user_id,
        nombre_actor,
        rut,
        telefono,
        rup,
        rol,
        practicas_sanitarias,
        metodo_control_varroa,
        declaracion_existencia_animal,
        nivel_acreditacion,
        consentimientos
      )
    `)
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (errApiarios) {
    return c.json({ error: errApiarios.message }, 500);
  }

  // Recolectar user_ids para obtener emails de contacto
  const userIds = (apiarios ?? [])
    .map((a) => {
      const actor = Array.isArray(a.actores_registro) ? a.actores_registro[0] : a.actores_registro;
      return actor?.user_id;
    })
    .filter((id): id is string => typeof id === "string" && Boolean(id));

  const emailByUserId: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profilesRows } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    for (const p of profilesRows ?? []) {
      if (p.id && typeof p.email === "string" && p.email) {
        emailByUserId[p.id] = p.email;
      }
    }
  }

  const sanitized = (apiarios ?? []).map((a) => {
    const actor = Array.isArray(a.actores_registro) ? a.actores_registro[0] : a.actores_registro;
    const actorEmail = actor?.user_id ? emailByUserId[actor.user_id] ?? null : null;
    const consentimientos = (actor?.consentimientos as Record<string, unknown>) ?? {};

    return {
      id: a.id,
      nombre: a.nombre,
      comuna: a.comuna,
      zona: a.zona,
      lat_aproximada: a.lat_aproximada,
      lng_aproximada: a.lng_aproximada,
      n_colmenas: a.n_colmenas,
      categoria: a.categoria,
      activo: a.activo,
      observaciones: a.observaciones,
      created_at: a.created_at,
      // Datos reservados para el fundador
      titular: actor?.nombre_actor ?? null,
      rut: actor?.rut ?? null,
      telefono: actor?.telefono ?? null,
      email: actorEmail,
      rup: actor?.rup ?? null,
      rol_apicola: actor?.rol ?? null,
      practicas_sanitarias: actor?.practicas_sanitarias ?? null,
      metodo_control_varroa: actor?.metodo_control_varroa ?? null,
      declaracion_sag: actor?.declaracion_existencia_animal ?? false,
      nivel_acreditacion: actor?.nivel_acreditacion ?? "base",
      consentimiento_mapa: consentimientos.mapa_comunitario === true || consentimientos.mapa_comunitario === "true",
    };
  });

  return c.json({ data: sanitized });
});
