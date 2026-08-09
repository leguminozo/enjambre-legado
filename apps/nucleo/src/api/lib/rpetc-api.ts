import { createPrivateKey, createSign, X509Certificate } from "node:crypto";
import forge from "node-forge";
import {
  RPETC_API_URLS,
  RPETC_API_PATHS,
  RPETC_SCOPES,
  base64urlEncode,
  buildRpetcJwtHeader,
  buildRpetcJwtPayload,
  buildJwtSigningInput,
  assembleJwt,
  parseRpetcTokenResponse,
  buildRpetcTareaPath,
  buildRpetcResultadoPath,
  buildRpetcEstadoTareaPath,
  buildRpetcEstadosPath,
} from "@enjambre/contable";
import type { RpetcTokenResponse, SiiEnvironment } from "@enjambre/contable";
import { extractP12 } from "./sii-client";

/**
 * API-RPETC (2025): autenticación OAuth 2.0 con credenciales
 * cert_credentials (JWT RS256 firmado con el certificado digital, header x5c
 * con el certificado X.509 en DER/base64 estándar) y tareas asincrónicas de
 * cesiones y certificados. Requiere RPETC_CLIENT_ID / RPETC_CLIENT_SECRET
 * (Basic auth) en el entorno.
 */

export interface RpetcApiCredentials {
  clientId: string;
  clientSecret: string;
}

export interface RpetcJwtMaterial {
  /** RUT del titular del certificado, sin DV (campo aio). */
  aio: string;
  p12Base64: string;
  p12Password: string;
}

function signJwtRs256(signingInput: string, privateKeyPem: string): string {
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput, "utf8");
  sign.end();
  const key = createPrivateKey({ key: privateKeyPem, format: "pem" });
  return sign.sign(key, "base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function certDerBase64Std(certPem: string): string {
  return new X509Certificate(certPem).raw.toString("base64");
}

/**
 * Extrae el RUT (sin DV) del certificado digital (el SII valida que el campo
 * aio del JWT coincida con el RUT del certificado). Busca en los atributos
 * del subject (serialNumber u otro con formato RUT) y cae al CN.
 */
export function extractRutFromCert(certPem: string): string | null {
  const cert = forge.pki.certificateFromPem(certPem);
  for (const attr of cert.subject.attributes) {
    const raw = Array.isArray(attr.value) ? attr.value.join("") : String(attr.value ?? "");
    const match = raw.trim().match(/^(\d{1,8})-([0-9kK])$/);
    if (match) return match[1]!;
  }
  const cn = cert.subject.getField("CN");
  if (cn) {
    const match = String(cn).match(/(\d{1,8})-([0-9kK])/i);
    if (match) return match[1]!;
  }
  return null;
}

/**
 * Construye el JWT de la API-RPETC: header {alg: RS256, x5c} + payload
 * {aio, exp (ahora + 600 s), aud = endpoint de token del ambiente} firmado
 * RS256 con la llave privada del P12.
 */
export function buildRpetcJwt(
  aio: string,
  aud: string,
  p12Base64: string,
  p12Password: string,
  exp?: number,
): string {
  const { privateKeyPem, certPem } = extractP12(p12Base64, p12Password);
  const header = base64urlEncode(buildRpetcJwtHeader(certDerBase64Std(certPem)));
  const payload = base64urlEncode(buildRpetcJwtPayload(aio, exp ?? Math.floor(Date.now() / 1000) + 600, aud));
  const signature = signJwtRs256(buildJwtSigningInput(header, payload), privateKeyPem);
  return assembleJwt(header, payload, signature);
}

function basicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

/**
 * Solicita el access token (grant_type=cert_credentials) o lo renueva
 * (grant_type=refresh_token con refreshToken).
 */
export async function getRpetcAccessToken(
  env: SiiEnvironment,
  creds: RpetcApiCredentials,
  jwtOrRefreshToken: string,
  mode: "cert_credentials" | "refresh_token" = "cert_credentials",
): Promise<RpetcTokenResponse> {
  const base = RPETC_API_URLS[env];
  const path = mode === "refresh_token" ? RPETC_API_PATHS.TOKEN_REFRESH : RPETC_API_PATHS.TOKEN;
  const body = mode === "refresh_token"
    ? `grant_type=refresh_token&refresh_token=${encodeURIComponent(jwtOrRefreshToken)}`
    : `grant_type=cert_credentials&scope=${encodeURIComponent(RPETC_SCOPES)}&jwt=${encodeURIComponent(jwtOrRefreshToken)}`;

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(creds.clientId, creds.clientSecret)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[RPETC API] getRpetcAccessToken HTTP error', { status: response.status, mode });
    throw new Error(`RPETC token HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  return parseRpetcTokenResponse(await response.json());
}

type RpetcApiResult = Record<string, unknown>;

async function callApi(
  env: SiiEnvironment,
  accessToken: string,
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<RpetcApiResult> {
  const base = RPETC_API_URLS[env];
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[RPETC API] callApi HTTP error", { status: response.status, path, method });
    throw new Error(`RPETC API HTTP ${response.status} en ${path}: ${text.slice(0, 200)}`);
  }

  const parsed: unknown = await response.json();
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`RPETC API respuesta inválida en ${path}`);
  }
  return parsed as RpetcApiResult;
}

/** Genera una tarea asincrónica de cesiones (GET) o certificados (POST). */
export function rpetcCrearTarea(
  env: SiiEnvironment,
  accessToken: string,
  rut: string,
  dv: string,
  tipo: "cesiones" | "certificados",
  rol: "deudor" | "cedente" | "cesionario",
  body?: unknown,
): Promise<RpetcApiResult> {
  return callApi(env, accessToken, buildRpetcTareaPath(rut, dv, tipo, rol), tipo === "certificados" ? "POST" : "GET", body);
}

/** Estado de una tarea asincrónica. */
export function rpetcEstadoTarea(
  env: SiiEnvironment,
  accessToken: string,
  rut: string,
  dv: string,
  idTarea: string,
): Promise<RpetcApiResult> {
  return callApi(env, accessToken, buildRpetcEstadoTareaPath(rut, dv, idTarea));
}

/** Archivo con el resultado de la tarea asincrónica. */
export function rpetcResultadoTarea(
  env: SiiEnvironment,
  accessToken: string,
  rut: string,
  dv: string,
  idTarea: string,
): Promise<RpetcApiResult> {
  return callApi(env, accessToken, buildRpetcResultadoPath(rut, dv, idTarea));
}

/** Estado de tareas por emisor y fecha o período. */
export function rpetcEstados(
  env: SiiEnvironment,
  accessToken: string,
  rut: string,
  dv: string,
  periodo?: string,
): Promise<RpetcApiResult> {
  return callApi(env, accessToken, buildRpetcEstadosPath(rut, dv, periodo));
}
