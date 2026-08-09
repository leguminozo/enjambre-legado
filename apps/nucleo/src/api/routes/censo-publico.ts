import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";

/**
 * Stats públicos del censo apícola (Semana 1-2).
 * Solo agregados: la RPC censo_stats_public() es SECURITY DEFINER en la DB y
 * proyecta únicamente conteos + fecha de cierre — nunca filas crudas ni
 * coordenadas. Esta ruta solo agrega cache de CDN (patrón mapa-publico.ts).
 */
export const censoPublicoRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/censo-publico/stats
censoPublicoRoutes.get("/stats", async (c) => {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("censo_stats_public");

    if (error) {
      return c.json({ code: "query_failed", message: error.message }, 500);
    }

    // Cache corto en CDN / browser (datos semi-estáticos)
    c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

    return c.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error stats censo";
    return c.json({ code: "censo_stats_failed", message }, 500);
  }
});
