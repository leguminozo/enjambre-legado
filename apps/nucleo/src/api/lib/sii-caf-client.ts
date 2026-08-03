import { getSiiToken, signNode } from "./sii-client";
import { resolveSiiCredentials } from "./sii-credentials";
import { parseCafXml } from "./sii-caf-xml";
import { buildSolicitudFoliosXml } from "@enjambre/contable";
import { SII_ENV, type SiiEnvironment } from "@enjambre/contable";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database";

export type RequestCafInput = {
  supabase: SupabaseClient<Database>;
  empresaId: string;
  /** RUT de la empresa (formato 11111111-1 o 11111111-1 sin puntos) */
  rutEmpresa: string;
  tipoDte: number;
  cantidad: number;
  env?: SiiEnvironment;
};

export type RequestCafCaf = {
  tipo_dte: number;
  folio_desde: number;
  folio_hasta: number;
  folio_actual: number;
  fecha_autorizacion: string;
  firma_caf: string;
  private_key: string;
  public_key: string;
  nro_resol: number;
  fch_resol: string;
  rut_emisor?: string;
};

export type RequestCafResult =
  | { ok: true; caf: RequestCafCaf }
  | { ok: false; code: string; message: string };

function resolveEnv(): SiiEnvironment {
  return process.env.SII_ENVIRONMENT === "production" ? "PRODUCCION" : "CERTIFICACION";
}

function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

/**
 * Movimiento 2 — solicitud de folios (CAF) al SII.
 * Flujo: credenciales (P12 + clave tributaria) → token → XML SolicitudDeFolios
 * firmado con el P12 → POST al servicio de certificación → parsea el CAF de
 * respuesta (el mismo parseCafXml de la importación manual).
 *
 * ⚠️ Ops: el endpoint GetCaf del SII tiene variantes según el servicio; se usa
 * el patrón del repo (token por clave tributaria) con override por env
 * (SII_CAF_URL_OVERRIDE). Validar contra maullin.sii.cl (certificación).
 */
export async function requestCaf(input: RequestCafInput): Promise<RequestCafResult> {
  const env = input.env ?? resolveEnv();

  const credentials = await resolveSiiCredentials(input.supabase, input.empresaId);
  if (!credentials.ok) {
    return { ok: false, code: credentials.code, message: credentials.message };
  }

  let token: string;
  try {
    const auth = await getSiiToken(env, input.rutEmpresa, credentials.credentials.siiClave);
    token = auth.token;
  } catch (err) {
    const message = err instanceof Error ? err.message : "auth failed";
    console.error("[sii-caf-client] token failed:", message);
    return { ok: false, code: "auth_failed", message };
  }

  const rutFormatted = formatRut(input.rutEmpresa);
  const xml = buildSolicitudFoliosXml({
    rutSolicitante: rutFormatted,
    rutEmpresa: rutFormatted,
    tipoDte: input.tipoDte,
    cantidad: input.cantidad,
  });

  let signedXml: string;
  try {
    signedXml = signNode(xml, "SolicitudDeFolios", credentials.credentials.p12Base64, credentials.credentials.p12Password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "sign failed";
    console.error("[sii-caf-client] sign failed:", message);
    return { ok: false, code: "sign_failed", message };
  }

  const baseUrl = process.env.SII_CAF_URL_OVERRIDE?.trim() || SII_ENV[env];
  const endpoint = `${baseUrl.replace(/\/$/, "")}/cgi_dte/U.Certifica/GetCaf`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `token=${token}`,
      },
      body: `archivo=${encodeURIComponent(signedXml)}`,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      console.error("[sii-caf-client] GetCaf failed:", { status: response.status });
      return { ok: false, code: "http_error", message: `SII GetCaf respondió ${response.status}` };
    }

    const text = await response.text();
    const parsed = parseCafXml(text);
    if (!parsed.ok) {
      console.error("[sii-caf-client] respuesta no es un CAF válido:", parsed.message);
      return { ok: false, code: "caf_parse_error", message: parsed.message };
    }

    return { ok: true, caf: parsed.caf as RequestCafCaf };
  } catch (err) {
    const message = err instanceof Error ? err.message : "request failed";
    console.error("[sii-caf-client] GetCaf error:", message);
    return { ok: false, code: "request_failed", message };
  }
}
