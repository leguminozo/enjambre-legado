import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";
import { fromLoose } from "@/api/lib/supabase-loose";
import {
  buildOrigenPublico,
  isValidUuid,
  resolveZonaPublica,
  type LotePasaportePublico,
  type OrigenCosechaInput,
} from "@/lib/lote-pasaporte-publico";

export const lotesPublicosRoutes = new Hono<{ Variables: AppVariables }>();

const PRIVACIDAD = {
  nivel: "frasco" as const,
  nota:
    "Pasaporte del frasco: origen comercial resumido. No incluye GPS exacto, bitácora sanitaria ni datos económicos.",
};

// GET /api/lotes-publicos/:id — solo lotes con publico=true
lotesPublicosRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  if (!isValidUuid(id)) {
    return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  }

  const supabase = createAdminClient();

  const { data: lote, error } = await supabase
    .from("lotes")
    .select(
      `
      id,
      nombre_lote,
      kg_total,
      estado,
      created_at,
      fecha_envasado,
      actor_id,
      variedad_floral,
      metodo_extraccion,
      analisis_humedad,
      analisis_hmf,
      lab_nombre,
      lab_fecha,
      relato_publico,
      blockchain_hash,
      cosecha_ids,
      publico,
      actores_registro (
        nombre_actor,
        comuna,
        nivel_acreditacion,
        predios_facilitadores (
          lat_aproximada,
          lng_aproximada
        )
      )
    `,
    )
    .eq("id", id)
    .eq("publico", true)
    .single();

  if (error || !lote) {
    return c.json({ code: "not_found", message: "Lote no encontrado o no es público" }, 404);
  }

  // Origen vía cosechas (lote_id y/o cosecha_ids) — sin exponer IDs internos en la respuesta
  const cosechaInputs: OrigenCosechaInput[] = [];
  const seenCosecha = new Set<string>();

  const mapCosechaRow = (row: {
    id?: string;
    floracion?: string | null;
    fecha?: string | null;
    kg?: number | null;
    colmenas?:
      | {
          name?: string | null;
          apiarios?: { name?: string | null; lat?: number | null; lng?: number | null } | null;
        }
      | Array<{
          name?: string | null;
          apiarios?: { name?: string | null; lat?: number | null; lng?: number | null } | null;
        }>
      | null;
  }) => {
    if (row.id && seenCosecha.has(row.id)) return;
    if (row.id) seenCosecha.add(row.id);
    const col =
      Array.isArray(row.colmenas) ? row.colmenas[0] : row.colmenas;
    const api = col?.apiarios
      ? Array.isArray(col.apiarios)
        ? col.apiarios[0]
        : col.apiarios
      : null;
    cosechaInputs.push({
      floracion: row.floracion,
      fecha: row.fecha,
      kg: row.kg,
      colmena_name: col?.name ?? null,
      apiario_name: api?.name ?? null,
      lat: typeof api?.lat === "number" ? api.lat : null,
      lng: typeof api?.lng === "number" ? api.lng : null,
    });
  };

  // fromLoose: join colmenas→apiarios puede no estar en typegen
  const { data: byLoteId } = await fromLoose(supabase, "cosechas")
    .select("id, floracion, fecha, kg, colmenas(name, apiarios(name, lat, lng))")
    .eq("lote_id", id);

  for (const row of byLoteId ?? []) {
    mapCosechaRow(row as Parameters<typeof mapCosechaRow>[0]);
  }

  const cosechaIds = Array.isArray(lote.cosecha_ids)
    ? (lote.cosecha_ids as string[]).filter((x) => typeof x === "string" && isValidUuid(x))
    : [];
  const missingIds = cosechaIds.filter((cid) => !seenCosecha.has(cid));
  if (missingIds.length > 0) {
    const { data: byIds } = await fromLoose(supabase, "cosechas")
      .select("id, floracion, fecha, kg, colmenas(name, apiarios(name, lat, lng))")
      .in("id", missingIds);
    for (const row of byIds ?? []) {
      mapCosechaRow(row as Parameters<typeof mapCosechaRow>[0]);
    }
  }

  const origen = buildOrigenPublico(cosechaInputs);

  const actorRaw = Array.isArray(lote.actores_registro)
    ? lote.actores_registro[0]
    : lote.actores_registro;
  const predios = actorRaw
    ? Array.isArray(actorRaw.predios_facilitadores)
      ? actorRaw.predios_facilitadores
      : actorRaw.predios_facilitadores
        ? [actorRaw.predios_facilitadores]
        : []
    : [];
  const predio0 = predios[0] as
    | { lat_aproximada?: number | null; lng_aproximada?: number | null }
    | undefined;

  const zona = resolveZonaPublica(origen, {
    lat: predio0?.lat_aproximada ?? null,
    lng: predio0?.lng_aproximada ?? null,
  });

  // Preferir floración del lote; si no, unir floraciones de cosecha
  const variedad =
    (lote.variedad_floral && String(lote.variedad_floral).trim()) ||
    (origen.floraciones.length ? origen.floraciones.join(" · ") : "Multifloral");

  const response: LotePasaportePublico = {
    id: lote.id,
    nombre_lote: lote.nombre_lote ?? null,
    variedad_floral: variedad,
    metodo_extraccion: lote.metodo_extraccion,
    fecha_cosecha: origen.fecha_recoleccion ?? lote.created_at,
    fecha_envasado: lote.fecha_envasado ?? null,
    analisis: {
      humedad: lote.analisis_humedad,
      hmf: lote.analisis_hmf,
      laboratorio: lote.lab_nombre,
      fecha_analisis: lote.lab_fecha,
    },
    relato: lote.relato_publico,
    blockchain_hash: lote.blockchain_hash ?? null,
    actor: actorRaw
      ? {
          nombre: actorRaw.nombre_actor,
          comuna: actorRaw.comuna,
          nivel_acreditacion: actorRaw.nivel_acreditacion ?? null,
          zona,
        }
      : {
          nombre: "Red Apícola Chiloé",
          comuna: "Chiloé",
          nivel_acreditacion: null,
          zona,
        },
    origen: {
      ...origen,
      // zona del origen ya redondeada; no reexponer más precisión
      zona: origen.zona,
    },
    privacidad: PRIVACIDAD,
  };

  // No filtrar kg_total al cliente (no está en LotePasaportePublico a propósito)
  return c.json({ data: response });
});
