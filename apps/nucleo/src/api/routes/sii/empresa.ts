import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import {
  encryptSiiSecret,
  isValidChileanRut,
  normalizeRut,
  resolveSiiEncryptionKeyBytes,
} from "@/api/lib/sii-crypto";

export const empresaRoutes = new Hono<{ Variables: AppVariables }>();

const EMPRESA_SELECT =
  "id, rut, razon_social, giro, direccion, comuna, ciudad, region, email, telefono, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior, sii_clave_encriptada";

empresaRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("empresas")
    .select(EMPRESA_SELECT)
    .eq("id", empresaId)
    .single();

  if (error || !data) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const row = data as Record<string, unknown>;
  const hasClave = !!row.sii_clave_encriptada;
  const { sii_clave_encriptada: _, ...rest } = row;
  return c.json({ data: { ...rest, has_clave_sii: hasClave } });
});

empresaRoutes.patch("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{
    rut?: string;
    razon_social?: string;
    giro?: string | null;
    direccion?: string | null;
    comuna?: string | null;
    ciudad?: string | null;
    region?: string | null;
    email?: string | null;
    telefono?: string | null;
    regimen?: string;
    acteco?: string | number | null;
    sii_ambiente?: string;
    fecha_inicio_actividades?: string | null;
    ingresos_brutos_anio_anterior?: number;
  }>();

  const allowedRegimenes = ["pro_pyme_transparente", "pro_pyme_general", "semi_integrado", "general"];
  if (body.regimen && !allowedRegimenes.includes(body.regimen)) {
    return c.json({ code: "invalid_regimen", message: `Regimen debe ser uno de: ${allowedRegimenes.join(", ")}` }, 400);
  }

  const allowedAmbientes = ["certificacion", "produccion"];
  if (body.sii_ambiente && !allowedAmbientes.includes(body.sii_ambiente)) {
    return c.json({ code: "invalid_ambiente", message: "sii_ambiente debe ser 'certificacion' o 'produccion'" }, 400);
  }

  if (body.rut !== undefined) {
    if (!isValidChileanRut(body.rut)) {
      return c.json({ code: "invalid_rut", message: "RUT emisor inválido (dígito verificador)" }, 400);
    }
  }

  if (body.razon_social !== undefined && !String(body.razon_social).trim()) {
    return c.json({ code: "invalid_razon_social", message: "Razón social no puede estar vacía" }, 400);
  }

  const update: {
    rut?: string;
    razon_social?: string;
    giro?: string | null;
    direccion?: string | null;
    comuna?: string | null;
    ciudad?: string | null;
    region?: string | null;
    email?: string | null;
    telefono?: string | null;
    regimen?: string;
    acteco?: string | null;
    sii_ambiente?: string;
    fecha_inicio_actividades?: string | null;
    ingresos_brutos_anio_anterior?: number;
  } = {};
  if (body.rut !== undefined) update.rut = normalizeRut(body.rut);
  if (body.razon_social !== undefined) update.razon_social = String(body.razon_social).trim();
  if (body.giro !== undefined) update.giro = body.giro ? String(body.giro).trim() : null;
  if (body.direccion !== undefined) update.direccion = body.direccion ? String(body.direccion).trim() : null;
  if (body.comuna !== undefined) update.comuna = body.comuna ? String(body.comuna).trim() : null;
  if (body.ciudad !== undefined) update.ciudad = body.ciudad ? String(body.ciudad).trim() : null;
  if (body.region !== undefined) update.region = body.region ? String(body.region).trim() : null;
  if (body.email !== undefined) update.email = body.email ? String(body.email).trim() : null;
  if (body.telefono !== undefined) update.telefono = body.telefono ? String(body.telefono).trim() : null;
  if (body.regimen !== undefined) update.regimen = body.regimen;
  if (body.acteco !== undefined) {
    update.acteco = body.acteco === null || body.acteco === "" ? null : String(body.acteco);
  }
  if (body.sii_ambiente !== undefined) update.sii_ambiente = body.sii_ambiente;
  if (body.fecha_inicio_actividades !== undefined) update.fecha_inicio_actividades = body.fecha_inicio_actividades;
  if (body.ingresos_brutos_anio_anterior !== undefined) {
    update.ingresos_brutos_anio_anterior = body.ingresos_brutos_anio_anterior;
  }

  if (Object.keys(update).length === 0) {
    return c.json({ code: "no_fields", message: "No se enviaron campos para actualizar" }, 400);
  }

  const { data, error } = await supabase
    .from("empresas")
    .update(update)
    .eq("id", empresaId)
    .select(
      "id, rut, razon_social, giro, direccion, comuna, ciudad, region, email, telefono, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior",
    )
    .single();

  if (error) {
    return c.json({ code: "empresa_update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

empresaRoutes.put("/sii-clave", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{ clave: string }>();
  if (!body.clave || body.clave.length < 4) {
    return c.json({ code: "invalid_clave", message: "La clave SII debe tener al menos 4 caracteres" }, 400);
  }

  if (!resolveSiiEncryptionKeyBytes()) {
    return c.json(
      {
        code: "encryption_key_missing",
        message:
          "Falta material de cifrado (SII_CLAVE_ENCRYPTION_KEY o SUPABASE_SERVICE_ROLE_KEY ≥32). No se guarda la clave en claro.",
      },
      503,
    );
  }

  const encryptedBase64 = await encryptSiiSecret(body.clave);
  if (!encryptedBase64) {
    return c.json({ code: "encryption_failed", message: "No se pudo cifrar la clave SII" }, 503);
  }

  const { error } = await supabase
    .from("empresas")
    .update({ sii_clave_encriptada: encryptedBase64 })
    .eq("id", empresaId);

  if (error) {
    return c.json({ code: "clave_save_failed", message: error.message }, 500);
  }

  return c.json({ data: { saved: true } });
});

empresaRoutes.delete("/sii-clave", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("empresas")
    .update({ sii_clave_encriptada: null })
    .eq("id", empresaId);

  if (error) {
    return c.json({ code: "clave_delete_failed", message: error.message }, 500);
  }

  return c.json({ data: { deleted: true } });
});
