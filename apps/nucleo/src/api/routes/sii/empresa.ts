import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const empresaRoutes = new Hono<{ Variables: AppVariables }>();

empresaRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("empresas")
    .select("id, rut, razon_social, giro, direccion, comuna, ciudad, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior, sii_clave_encriptada")
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
    regimen?: string;
    acteco?: number;
    sii_ambiente?: string;
    fecha_inicio_actividades?: string;
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

  const update: {
    regimen?: string;
    acteco?: string | null;
    sii_ambiente?: string;
    fecha_inicio_actividades?: string | null;
    ingresos_brutos_anio_anterior?: number;
  } = {};
  if (body.regimen !== undefined) update.regimen = body.regimen;
  if (body.acteco !== undefined) update.acteco = body.acteco;
  if (body.sii_ambiente !== undefined) update.sii_ambiente = body.sii_ambiente;
  if (body.fecha_inicio_actividades !== undefined) update.fecha_inicio_actividades = body.fecha_inicio_actividades;
  if (body.ingresos_brutos_anio_anterior !== undefined) update.ingresos_brutos_anio_anterior = body.ingresos_brutos_anio_anterior;

  if (Object.keys(update).length === 0) {
    return c.json({ code: "no_fields", message: "No se enviaron campos para actualizar" }, 400);
  }

  const { data, error } = await supabase
    .from("empresas")
    .update(update)
    .eq("id", empresaId)
    .select("id, rut, razon_social, giro, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
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

  const encoder = new TextEncoder();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const algoKey = await crypto.subtle.importKey("raw", encoder.encode(secretKey.slice(0, 32)), { name: "AES-GCM" }, false, ["encrypt"]);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, algoKey, encoder.encode(body.clave));
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  const encryptedBase64 = btoa(String.fromCharCode(...combined));

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
