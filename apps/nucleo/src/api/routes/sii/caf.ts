import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { parseCafXml } from "@/api/lib/sii-caf-xml";

export const cafRoutes = new Hono<{ Variables: AppVariables }>();

const CAF_PUBLIC_SELECT =
  "id, tipo_dte, folio_desde, folio_hasta, folio_actual, activo, fecha_autorizacion, nro_resol, fch_resol, created_at";

cafRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("sii_caf")
    .select(CAF_PUBLIC_SELECT)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json({ code: "caf_query_failed", message: error.message }, 500);
  }

  const rows = (data ?? []).map((row) => {
    const hasta = Number(row.folio_hasta);
    const actual = Number(row.folio_actual);
    return {
      ...row,
      folios_restantes: Math.max(0, hasta - actual),
    };
  });

  return c.json({ data: rows });
});

const CafXmlSchema = z.object({
  xml: z.string().min(20, "Pegue el XML AUTORIZACION/CAF del SII"),
  activar: z.boolean().optional().default(true),
});

const CafManualSchema = z.object({
  tipo_dte: z.number().int().positive(),
  folio_desde: z.number().int().positive(),
  folio_hasta: z.number().int().positive(),
  fecha_autorizacion: z.string().min(8),
  firma_caf: z.string().min(8),
  private_key: z.string().min(20),
  public_key: z.string().min(20),
  nro_resol: z.number().int().optional().default(0),
  fch_resol: z.string().optional(),
  activar: z.boolean().optional().default(true),
});

async function deactivateOtherCaf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  empresaId: string,
  tipoDte: number,
  exceptId?: string,
) {
  let q = supabase
    .from("sii_caf")
    .update({ activo: false })
    .eq("empresa_id", empresaId)
    .eq("tipo_dte", tipoDte)
    .eq("activo", true);
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

cafRoutes.post(
  "/import-xml",
  zValidator("json", CafXmlSchema),
  async (c) => {
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");
    const input = c.req.valid("json");

    const parsed = parseCafXml(input.xml);
    if (!parsed.ok) {
      return c.json({ code: "caf_xml_invalid", message: parsed.message }, 400);
    }

    const caf = parsed.caf;
    // next_folio increments first → store last-used as desde-1
    const folioActual = Math.max(0, caf.folio_desde - 1);

    if (input.activar) {
      await deactivateOtherCaf(supabase, empresaId, caf.tipo_dte);
    }

    const { data, error } = await supabase
      .from("sii_caf")
      .insert({
        empresa_id: empresaId,
        tipo_dte: caf.tipo_dte,
        folio_desde: caf.folio_desde,
        folio_hasta: caf.folio_hasta,
        folio_actual: folioActual,
        fecha_autorizacion: caf.fecha_autorizacion,
        firma_caf: caf.firma_caf,
        private_key: caf.private_key,
        public_key: caf.public_key,
        nro_resol: caf.nro_resol,
        fch_resol: caf.fch_resol,
        activo: input.activar ?? true,
      })
      .select(CAF_PUBLIC_SELECT)
      .single();

    if (error) {
      return c.json({ code: "caf_insert_failed", message: error.message }, 400);
    }

    return c.json({ data, message: `CAF tipo ${caf.tipo_dte} importado` }, 201);
  },
);

cafRoutes.post(
  "/",
  zValidator("json", CafManualSchema),
  async (c) => {
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");
    const input = c.req.valid("json");

    if (input.folio_desde > input.folio_hasta) {
      return c.json({ code: "invalid_range", message: "folio_desde no puede ser mayor que folio_hasta" }, 400);
    }

    if (input.activar) {
      await deactivateOtherCaf(supabase, empresaId, input.tipo_dte);
    }

    const { data, error } = await supabase
      .from("sii_caf")
      .insert({
        empresa_id: empresaId,
        tipo_dte: input.tipo_dte,
        folio_desde: input.folio_desde,
        folio_hasta: input.folio_hasta,
        folio_actual: Math.max(0, input.folio_desde - 1),
        fecha_autorizacion: input.fecha_autorizacion.slice(0, 10),
        firma_caf: input.firma_caf,
        private_key: input.private_key,
        public_key: input.public_key,
        nro_resol: input.nro_resol ?? 0,
        fch_resol: (input.fch_resol ?? input.fecha_autorizacion).slice(0, 10),
        activo: input.activar ?? true,
      })
      .select(CAF_PUBLIC_SELECT)
      .single();

    if (error) {
      return c.json({ code: "caf_insert_failed", message: error.message }, 400);
    }

    return c.json({ data }, 201);
  },
);

cafRoutes.post("/:id/activar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const id = c.req.param("id");

  const { data: row, error: findErr } = await supabase
    .from("sii_caf")
    .select("id, tipo_dte")
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (findErr || !row) {
    return c.json({ code: "not_found", message: "CAF no encontrado" }, 404);
  }

  await deactivateOtherCaf(supabase, empresaId, Number(row.tipo_dte), id);

  const { data, error } = await supabase
    .from("sii_caf")
    .update({ activo: true })
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select(CAF_PUBLIC_SELECT)
    .single();

  if (error) {
    return c.json({ code: "caf_activate_failed", message: error.message }, 500);
  }

  return c.json({ data });
});

cafRoutes.post("/:id/desactivar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const id = c.req.param("id");

  const { data, error } = await supabase
    .from("sii_caf")
    .update({ activo: false })
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select(CAF_PUBLIC_SELECT)
    .single();

  if (error || !data) {
    return c.json({ code: "caf_deactivate_failed", message: error?.message ?? "CAF no encontrado" }, 404);
  }

  return c.json({ data });
});
