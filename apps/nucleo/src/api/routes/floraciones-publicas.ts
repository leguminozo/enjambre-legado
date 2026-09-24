import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";

export const floracionesPublicasRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * GET /api/floraciones-publicas
 * Biblioteca de Floraciones (especies_fenologicas activas) en formato público.
 * Fuente única de dato botánico para la tienda (el club consume nombre común,
 * nombre científico y ventana de floración desde aquí, no desde copy fijo).
 * Solo columnas botánicas — sin GDD, observaciones ni alertas internas.
 */
floracionesPublicasRoutes.get("/", async (c) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("especies_fenologicas")
    .select("slug, nombre_comun, nombre_cientifico, familia, ventana_ini, ventana_fin, fuente")
    .eq("activo", true)
    .order("nombre_comun");

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const especies = (data ?? []).filter(
    (e): e is typeof e & { slug: string } =>
      typeof e.slug === "string" && e.slug.trim().length > 0,
  );

  c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return c.json({
    data: {
      especies: especies.map((e) => ({
        slug: e.slug,
        nombre_comun: e.nombre_comun,
        nombre_cientifico: e.nombre_cientifico,
        familia: e.familia ?? null,
        ventana_ini: e.ventana_ini ?? null,
        ventana_fin: e.ventana_fin ?? null,
        fuente: e.fuente,
      })),
    },
  });
});
