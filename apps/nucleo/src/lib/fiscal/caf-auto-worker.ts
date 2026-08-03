import type { SupabaseClient } from "@supabase/supabase-js";
import { requestCaf } from "@/api/lib/sii-caf-client";

export function isCafAutoEnabled(): boolean {
  return process.env.SII_CAF_AUTO_ENABLED === "true";
}

export function getCafRequestThreshold(): number {
  const raw = Number(process.env.SII_CAF_REQUEST_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export function getCafRequestQuantity(): number {
  const raw = Number(process.env.SII_CAF_REQUEST_QTY);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 100;
}

export type EnsureCafFoliosInput = {
  empresaId: string;
  rutEmpresa: string;
  tipoDte: number;
  /** Cantidad de folios; default: SII_CAF_REQUEST_QTY (100) */
  cantidad?: number;
};

export type EnsureCafFoliosResult = {
  ok: boolean;
  requested: boolean;
  error?: string;
};

/**
 * Movimiento 2 — solicitud automática de folios cuando el CAF activo está bajo
 * el umbral (o no existe). Kill-switch: SII_CAF_AUTO_ENABLED=false (default).
 * Idempotente: nunca dos solicitudes pending para la misma (empresa, tipo_dte).
 * Si la solicitud falla, el CAF queda intacto y la alerta manual sigue cubriendo.
 */
export async function ensureCafFolios(
  admin: SupabaseClient,
  input: EnsureCafFoliosInput,
): Promise<EnsureCafFoliosResult> {
  if (!isCafAutoEnabled()) {
    return { ok: true, requested: false };
  }

  const { data: caf } = await admin
    .from("sii_caf")
    .select("id, folio_hasta, folio_actual")
    .eq("empresa_id", input.empresaId)
    .eq("tipo_dte", input.tipoDte)
    .eq("activo", true)
    .maybeSingle();

  const restantes = caf ? (caf.folio_hasta ?? 0) - (caf.folio_actual ?? 0) : 0;
  if (caf && restantes >= getCafRequestThreshold()) {
    return { ok: true, requested: false };
  }

  // Idempotencia: una sola pending por (empresa, tipo_dte) — el unique parcial
  // de la migración protege la carrera
  const { data: pending } = await admin
    .from("sii_caf_requests")
    .select("id")
    .eq("empresa_id", input.empresaId)
    .eq("tipo_dte", input.tipoDte)
    .eq("estado", "pending")
    .maybeSingle();
  if (pending) {
    return { ok: true, requested: false, error: "solicitud pendiente" };
  }

  const cantidad = input.cantidad ?? getCafRequestQuantity();
  const { data: request, error: insertError } = await admin
    .from("sii_caf_requests")
    .insert({ empresa_id: input.empresaId, tipo_dte: input.tipoDte, cantidad })
    .select("id")
    .single();

  if (insertError || !request) {
    return { ok: true, requested: false, error: insertError?.message ?? "no se pudo crear solicitud" };
  }

  const failRequest = async (error: string) => {
    await admin
      .from("sii_caf_requests")
      .update({ estado: "failed", error, completed_at: new Date().toISOString() })
      .eq("id", request.id);
  };

  const result = await requestCaf({
    supabase: admin,
    empresaId: input.empresaId,
    rutEmpresa: input.rutEmpresa,
    tipoDte: input.tipoDte,
    cantidad,
  });

  if (!result.ok) {
    await failRequest(result.message);
    return { ok: false, requested: true, error: result.message };
  }

  const nuevoCaf = result.caf;
  const folioActual = Math.max(0, nuevoCaf.folio_desde - 1);

  // Misma semántica que la importación manual: el nuevo CAF es el activo
  await admin
    .from("sii_caf")
    .update({ activo: false })
    .eq("empresa_id", input.empresaId)
    .eq("tipo_dte", input.tipoDte)
    .neq("activo", false);

  const { data: newCaf, error: cafError } = await admin
    .from("sii_caf")
    .insert({
      empresa_id: input.empresaId,
      tipo_dte: nuevoCaf.tipo_dte,
      folio_desde: nuevoCaf.folio_desde,
      folio_hasta: nuevoCaf.folio_hasta,
      folio_actual: folioActual,
      fecha_autorizacion: nuevoCaf.fecha_autorizacion,
      firma_caf: nuevoCaf.firma_caf,
      private_key: nuevoCaf.private_key,
      public_key: nuevoCaf.public_key,
      nro_resol: nuevoCaf.nro_resol,
      fch_resol: nuevoCaf.fch_resol,
      activo: true,
    })
    .select("id")
    .single();

  if (cafError || !newCaf) {
    await failRequest(cafError?.message ?? "insert caf failed");
    return { ok: false, requested: true, error: cafError?.message ?? "insert caf failed" };
  }

  await admin
    .from("sii_caf_requests")
    .update({ estado: "success", caf_id: newCaf.id, completed_at: new Date().toISOString() })
    .eq("id", request.id);

  return { ok: true, requested: true };
}
