import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";
import { buildMapaChiloePublico } from "@/lib/mapa-chiloe-publico";

/**
 * Mapa público apícola de Chiloé (mov. 11).
 * Solo agregados / puntos anonimizados.
 */
export const mapaPublicoRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/mapa-publico/chiloe
mapaPublicoRoutes.get("/chiloe", async (c) => {
  try {
    const admin = createAdminClient();

    const [extRes, regRes, prediosRes, alertasRes, actoresRes, florRes] = await Promise.all([
      admin
        .from("apiarios_externos")
        .select(
          "id, n_colmenas, comuna_origen, comuna_destino, zona_destino, lat_aproximada, lng_aproximada, estado",
        )
        .in("estado", ["declarado", "activo"])
        .limit(500),
      admin
        .from("apiarios_registro")
        .select(
          "id, n_colmenas, comuna, zona, lat_aproximada, lng_aproximada, activo, actores_registro(consentimientos)",
        )
        .eq("activo", true)
        .not("lat_aproximada", "is", null)
        .not("lng_aproximada", "is", null)
        .limit(2000),
      admin
        .from("predios_facilitadores")
        .select("id, comuna, zona, lat_aproximada, lng_aproximada, activo")
        .eq("activo", true)
        .limit(500),
      admin
        .from("alertas_fitosanitarias")
        .select(
          "id, comuna, zona, lat_aproximada, lng_aproximada, radio_km, tipo_producto, fecha_programada, estado",
        )
        .eq("estado", "activa")
        .limit(200),
      admin
        .from("actores_registro")
        .select("comuna, estado")
        .eq("estado", "activo")
        .limit(2000),
      // Observaciones recientes con especie (sin observador_id en la respuesta)
      admin
        .from("observaciones_floracion")
        .select("id, fecha, fenofase_bbch, lat, lng, especies_fenologicas(nombre_comun)")
        .order("fecha", { ascending: false })
        .limit(100),
    ]);

    if (extRes.error) {
      return c.json({ code: "query_failed", message: extRes.error.message }, 500);
    }

    const florRaw = (florRes.data ?? []) as Array<{
      id: string;
      fecha?: string | null;
      fenofase_bbch?: number | null;
      lat?: number | null;
      lng?: number | null;
      especies_fenologicas?:
        | { nombre_comun?: string | null }
        | Array<{ nombre_comun?: string | null }>
        | null;
    }>;

    // Solo observaciones reales con coordenadas (sin inventar puntos de estaciones)
    const floraciones = florRaw
      .map((f) => {
        const esp = Array.isArray(f.especies_fenologicas)
          ? f.especies_fenologicas[0]
          : f.especies_fenologicas;
        return {
          id: f.id,
          lat: f.lat,
          lng: f.lng,
          fecha: f.fecha ?? null,
          fase:
            typeof f.fenofase_bbch === "number" ? `BBCH ${f.fenofase_bbch}` : null,
          especie: esp?.nombre_comun ?? null,
        };
      })
      .filter(
        (f) => f.lat != null && f.lng != null && Number.isFinite(f.lat) && Number.isFinite(f.lng),
      );

    const apiariosRegistroPublicos = ((regRes.data ?? []) as unknown as Array<{
      id: string;
      n_colmenas?: number | null;
      comuna?: string | null;
      zona?: string | null;
      lat_aproximada?: number | null;
      lng_aproximada?: number | null;
      activo?: boolean | null;
    }>)
      .map((r) => ({
        id: r.id,
        n_colmenas: r.n_colmenas,
        comuna: r.comuna,
        zona: r.zona,
        lat_aproximada: r.lat_aproximada,
        lng_aproximada: r.lng_aproximada,
        activo: r.activo,
      }));

    const payload = buildMapaChiloePublico({
      apiariosExternos: extRes.data ?? [],
      apiariosRegistro: apiariosRegistroPublicos,
      predios: prediosRes.data ?? [],
      alertas: alertasRes.data ?? [],
      actores: actoresRes.data ?? [],
      floraciones,
      applyBaseline: true,
    });

    // Cache corto en CDN / browser (datos semi-estáticos)
    c.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");

    return c.json({ data: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error mapa público";
    return c.json({ code: "mapa_publico_failed", message }, 500);
  }
});
