import { createPrivateKey, createPublicKey, createSign, createHash, X509Certificate } from "node:crypto";
import forge from "node-forge";
import type { CafFolio, SiiAuthToken, SiiEnvioResult, SiiEstadoResult, SiiQueryEstDteResult, SiiSoapEstado } from "@enjambre/contable";
import type { RcvRegistroCompra, RcvRegistroVenta, RcvResumen, RcvTipoRegistro } from "@enjambre/contable";
import { SII_ENV, DTEWS_PATHS } from "@enjambre/contable";
import {
  buildGetSeedEnvelope,
  buildGetTokenEnvelope,
  buildQueryEstUpEnvelope,
  buildQueryEstDteAvEnvelope,
  buildReenvioCorreoEnvelope,
  parseQueryEstUp,
  parseQueryEstDteAv,
  parseReenvioCorreo,
  parseAuthWsRespuesta,
  formatDateSiiDdMmYyyy,
} from "@enjambre/contable";
import type { SiiEnvironment, QueryEstUpResult, QueryEstDteAvResult, ReenvioCorreoResult } from "@enjambre/contable";

function getBaseUrl(env: SiiEnvironment): string {
  return SII_ENV[env];
}

interface P12ExtractResult {
  privateKeyPem: string;
  certPem: string;
}

export function extractP12(p12Base64: string, p12Password: string): P12ExtractResult {
  try {
    const p12Der = forge.util.decode64(p12Base64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, p12Password);

    let privateKeyPem = "";
    let certPem = "";

    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        if ((safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) && safeBag.key) {
           privateKeyPem = forge.pki.privateKeyToPem(safeBag.key);
        } else if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
           certPem = forge.pki.certificateToPem(safeBag.cert);
        }
      }
    }

    if (!privateKeyPem || !certPem) {
      throw new Error("No se pudo extraer llave o certificado del P12");
    }

    return { privateKeyPem, certPem };
  } catch (err) {
    console.error("[sii-client] extractP12 error (possibly bad password)", err instanceof Error ? err.message : String(err));
    throw new Error("Error al procesar el archivo P12. Verifica la contraseña.", { cause: err });
  }
}

export function signDteXml(xml: string, p12Base64: string, p12Password: string): string {
  // Contrato original intacto: firma el nodo <Documento> (wrapper de signNode)
  return signNode(xml, 'Documento', p12Base64, p12Password);
}

/**
 * Firma xmldsig RSA-SHA1 inline sobre un elemento raíz genérico (ej.
 * SolicitudDeFolios para el CAF automático). Mismo patrón que signDteXml
 * pero sin depender del nodo <Documento>.
 */
export function signNode(xml: string, rootTag: string, p12Base64: string, p12Password: string): string {
  const { privateKeyPem, certPem } = extractP12(p12Base64, p12Password);

  const rootMatch = xml.match(new RegExp(`<${rootTag}[^>]*>([\\s\\S]*?)</${rootTag}>`));
  if (!rootMatch) {
    throw new Error(`No se encontro nodo ${rootTag} en el XML`);
  }

  const rootContent = rootMatch[1]!.replace(/\s+/g, " ").trim();

  const digest = createHash("sha1").update(rootContent, "latin1").digest("base64");

  const certIdMatch = xml.match(new RegExp(`<${rootTag}[^>]*ID="([^"]*)"`));
  const docId = certIdMatch ? certIdMatch[1]! : rootTag;

  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${docId}"><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;

  const sign = createSign("RSA-SHA1");
  sign.update(signedInfo, "latin1");
  sign.end();

  const key = createPrivateKey({ key: privateKeyPem, format: "pem" });

  const signature = sign.sign(key, "base64");

  const cert = new X509Certificate(certPem);
  const certB64 = cert.raw.toString("base64");

  const signatureNode = `
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
    <Reference URI="#${docId}">
      <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
      <DigestValue>${digest}</DigestValue>
    </Reference>
  </SignedInfo>
  <SignatureValue>${signature}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${certB64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`;

  return xml.replace(`</${rootTag}>`, `${signatureNode}\n</${rootTag}>`);
}

/**
 * Firma la carátula del envío: nodo <SetDTE> del EnvioDTE (el SII exige la
 * firma del envío completo, Reference URI="#SetDoc").
 */
export function signEnvioDteXml(envioXml: string, p12Base64: string, p12Password: string): string {
  return signNode(envioXml, "SetDTE", p12Base64, p12Password);
}

/**
 * Firma la semilla de CrSeed para GetTokenFromSeed, según el formato del
 * manual de Autenticación Automática (fig 1.11): <getToken> con item/Semilla
 * y <Signature> con Reference URI="" + transform enveloped-signature.
 */
export function signSeedXml(semilla: string, p12Base64: string, p12Password: string): string {
  const { privateKeyPem, certPem } = extractP12(p12Base64, p12Password);

  const content = `<item><Semilla>${semilla}</Semilla></item>`;
  const digest = createHash("sha1").update(content, "latin1").digest("base64");

  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;

  const sign = createSign("RSA-SHA1");
  sign.update(signedInfo, "latin1");
  sign.end();
  const key = createPrivateKey({ key: privateKeyPem, format: "pem" });
  const signature = sign.sign(key, "base64");

  const { m, e } = publicKeyToRsaComponents(certPem);
  const cert = new X509Certificate(certPem);
  const certB64 = cert.raw.toString("base64");

  return `<?xml version="1.0"?><getToken>${content}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digest}</DigestValue></Reference></SignedInfo><SignatureValue>${signature}</SignatureValue><KeyInfo><KeyValue><RSAKeyValue><Modulus>${m}</Modulus><Exponent>${e}</Exponent></RSAKeyValue></KeyValue><X509Data><X509Certificate>${certB64}</X509Certificate></X509Data></KeyInfo></Signature></getToken>`;
}

/**
 * Firma RSA-SHA1 del contenido <DD> del timbre electrónico con la llave
 * privada entregada por el SII en el CAF (manual "Timbre Electrónico de
 * Ejemplo", sección 5.2): el Mensaje a firmar es el string <DD>...</DD>.
 */
export function firmarTimbre(contenidoDd: string, privateKeyPem: string): string {
  const sign = createSign("RSA-SHA1");
  sign.update(contenidoDd, "latin1");
  sign.end();
  const key = createPrivateKey({ key: privateKeyPem, format: "pem" });
  return sign.sign(key, "base64");
}

function publicKeyToRsaComponents(publicKeyPem: string): { m: string; e: string } {
  const key = createPublicKey({ key: publicKeyPem, format: "pem" });
  const jwk = key.export({ format: "jwk" });
  const b64 = (value: string | undefined): string => {
    const unpadded = value ?? "";
    const padded = unpadded.replace(/-/g, "+").replace(/_/g, "/");
    return padded + "=".repeat((4 - (padded.length % 4)) % 4);
  };
  return { m: b64(jwk.n), e: b64(jwk.e) };
}

export interface StampDteOptions {
  /** TSTED del timbre (YYYY-MM-DDTHH:MM:SS). Default: momento actual. */
  tmstEd?: string;
}

export function stampDteXml(xml: string, caf: CafFolio, folio: number, options: StampDteOptions = {}): string {
  if (folio < caf.desde || folio > caf.hasta) {
    throw new Error(`Folio ${folio} fuera del rango CAF (${caf.desde}-${caf.hasta})`);
  }

  // Extraer valores dinámicamente del XML generado
  const re = xml.match(/<RUTEmisor>([^<]+)<\/RUTEmisor>/)?.[1] || "";
  const rs = xml.match(/<RznSoc>([^<]+)<\/RznSoc>/)?.[1]?.substring(0, 40) || "";
  const td = xml.match(/<TipoDTE>([^<]+)<\/TipoDTE>/)?.[1] || "";
  const fe = xml.match(/<FchEmis>([^<]+)<\/FchEmis>/)?.[1] || "";
  const rr = xml.match(/<RUTRecep>([^<]+)<\/RUTRecep>/)?.[1] || "";
  const rsr = xml.match(/<RznSocRecep>([^<]+)<\/RznSocRecep>/)?.[1]?.substring(0, 40) || "";
  const mnt = xml.match(/<MntTotal>([^<]+)<\/MntTotal>/)?.[1] || "0";
  const it1 = xml.match(/<NmbItem>([^<]+)<\/NmbItem>/)?.[1] || "";

  const tmstEd = options.tmstEd ?? buildTmstFirmaEnv();

  const timbre = buildTimbre(caf, folio, fe, re, rs, td, rr, rsr, mnt, it1, tmstEd);

  return xml.replace("</Documento>", `${timbre}\n</Documento>`);
}

function buildTmstFirmaEnv(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * Construye el TED según el schema del SII: el <DD> incrusta el <CAF>
 * completo (DA + FRMA firmado por el SII) y el <TSTED>; el <FRMT> es la
 * firma RSA-SHA1 del string <DD> con la llave privada del CAF. El <DD> se
 * emite en una sola línea para que el string firmado sea idéntico al XML.
 */
function buildTimbre(
  caf: CafFolio,
  folio: number,
  fe: string,
  re: string,
  rs: string,
  td: string,
  rr: string,
  rsr: string,
  mnt: string,
  it1: string,
  tmstEd: string,
): string {
  const { m, e } = publicKeyToRsaComponents(caf.publicKey);
  const idkNode = caf.idk ? `<IDK>${caf.idk}</IDK>` : "";
  const itemNode = it1 ? `<IT1>${it1}</IT1>` : "";
  const dd = `<DD><RE>${re}</RE><TD>${td}</TD><F>${folio}</F><FE>${fe}</FE><RR>${rr}</RR><RSR>${rsr}</RSR><MNT>${mnt}</MNT>${itemNode}<CAF version="1.0"><DA><RE>${re}</RE><RS>${rs}</RS><TD>${td}</TD><RNG><D>${caf.desde}</D><H>${caf.hasta}</H></RNG><FA>${caf.fechaAutorizacion}</FA><RSAPK><M>${m}</M><E>${e}</E></RSAPK>${idkNode}</DA><FRMA algoritmo="SHA1withRSA">${caf.firma}</FRMA></CAF><TSTED>${tmstEd}</TSTED></DD>`;
  const frmt = firmarTimbre(dd, caf.privateKey);
  return `<TED version="1.0">
  ${dd}
  <FRMT algoritmo="SHA1withRSA">${frmt}</FRMT>
</TED>`;
}

export async function getSiiToken(
  env: SiiEnvironment,
  rut: string,
  password: string,
): Promise<SiiAuthToken> {
  const baseUrl = getBaseUrl(env);
  const rutClean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  const body = `rut=${rutClean.slice(0, -1)}&dv=${rutClean.slice(-1)}&pw=${encodeURIComponent(password)}`;

  const response = await fetch(`${baseUrl}/cgi_dte/U.Datos.LR.GetToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    console.error('[SII] getSiiToken failed', { status: response.status, rut: rutClean });
    throw new Error(`SII auth failed: ${response.status}`);
  }

  const text = await response.text();
  const tokenMatch = text.match(/<TOKEN>([^<]+)<\/TOKEN>/);
  if (!tokenMatch) {
    const errorMatch = text.match(/<GLOSA>([^<]+)<\/GLOSA>/);
    throw new Error(`SII auth failed: ${errorMatch?.[1] ?? "token no extraido"}`);
  }

  return {
    token: tokenMatch[1]!,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

const SOAP_HEADERS = {
  "Content-Type": "text/xml; charset=utf-8",
  "SOAPAction": "",
  "User-Agent": "EnjambreDTE/1.0",
};

/**
 * Autenticación Automática con Certificado Digital (manual del desarrollador):
 * CrSeed.getSeed → firma de la semilla (signSeedXml) → GetTokenFromSeed.getToken.
 * La semilla tiene un time-out de 2 minutos.
 */
export async function getSiiTokenWs(
  env: SiiEnvironment,
  p12Base64: string,
  p12Password: string,
): Promise<SiiAuthToken> {
  const baseUrl = getBaseUrl(env);
  const seedNs = `${baseUrl}${DTEWS_PATHS.CR_SEED}`;

  const seedResponse = await fetch(`${baseUrl}${DTEWS_PATHS.CR_SEED}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildGetSeedEnvelope(seedNs),
  });

  if (!seedResponse.ok) {
    throw new Error(`SII getSeed failed: ${seedResponse.status}`);
  }

  const seedResult = parseAuthWsRespuesta(await seedResponse.text(), "getSeedReturn");
  if (!seedResult.semilla) {
    throw new Error(`SII getSeed failed: ${seedResult.glosa || seedResult.estado}`);
  }

  const signedSeedXml = signSeedXml(seedResult.semilla, p12Base64, p12Password);

  const tokenNs = `${baseUrl}${DTEWS_PATHS.GET_TOKEN_FROM_SEED}`;
  const tokenResponse = await fetch(`${baseUrl}${DTEWS_PATHS.GET_TOKEN_FROM_SEED}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildGetTokenEnvelope(tokenNs, signedSeedXml),
  });

  if (!tokenResponse.ok) {
    throw new Error(`SII getToken failed: ${tokenResponse.status}`);
  }

  const tokenResult = parseAuthWsRespuesta(await tokenResponse.text(), "getTokenReturn");
  if (!tokenResult.token) {
    throw new Error(`SII WS auth failed: ${tokenResult.glosa || tokenResult.estado}`);
  }

  return {
    token: tokenResult.token,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

export async function enviarDte(
  env: SiiEnvironment,
  token: string,
  envioXml: string,
  rutEmisor: string,
): Promise<SiiEnvioResult> {
  const baseUrl = getBaseUrl(env);
  const rut = formatRutForSiiHeader(rutEmisor);

  const formData = new FormData();
  const xmlBlob = new Blob([envioXml], { type: "application/xml" });
  formData.append("archivo", xmlBlob, `envio_${rut}_${Date.now()}.xml`);
  formData.append("rutEmpresa", rut);

  const response = await fetch(
    `${baseUrl}/cgi_dte/DTEUpload/Enviar`,
    {
      method: "POST",
      headers: {
        Cookie: `token=${token}`,
        "User-Agent": "EnjambreDTE/1.0",
      },
      body: formData,
    },
  );

  if (!response.ok) {
    console.error('[SII] enviarDte HTTP error', { status: response.status, statusText: response.statusText, rutEmisor });
    return {
      trackId: "",
      estado: "error",
      glosa: `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  const text = await response.text();
  const trackIdMatch = text.match(/<TRACKID>([^<]+)<\/TRACKID>/);
  const estadoMatch = text.match(/<ESTADO>([^<]+)<\/ESTADO>/);
  const glosaMatch = text.match(/<GLOSA>([^<]+)<\/GLOSA>/);

  const estado = estadoMatch ? estadoMatch[1]!.trim() : "error";

  return {
    trackId: trackIdMatch ? trackIdMatch[1]!.trim() : "",
    estado: estado === "0" ? "aceptado" : estado === "1" ? "rechazado" : "error",
    glosa: glosaMatch ? glosaMatch[1]!.trim() : "Sin glosa",
  };
}

export async function consultarEstado(
  env: SiiEnvironment,
  token: string,
  trackId: string,
  rutEmisor: string,
): Promise<SiiEstadoResult> {
  const baseUrl = getBaseUrl(env);
  const rut = formatRutForSiiHeader(rutEmisor);

  const response = await fetch(
    `${baseUrl}/cgi_dte/DTEConsulta/Estado?RutEmisor=${rut}&TrackId=${trackId}`,
    {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
        "User-Agent": "EnjambreDTE/1.0",
      },
    },
  );

  if (!response.ok) {
    console.error('[SII] consultarEstado HTTP error', { status: response.status, trackId, rutEmisor });
    return {
      estado: "error",
      glosa: `HTTP ${response.status}`,
      aceptados: 0,
      rechazados: 0,
      reparos: 0,
    };
  }

  const text = await response.text();
  const estadoMatch = text.match(/<ESTADO>([^<]+)<\/ESTADO>/);
  const glosaMatch = text.match(/<GLOSA>([^<]+)<\/GLOSA>/);
  const aceptadosMatch = text.match(/<ACEPTADOS>([^<]+)<\/ACEPTADOS>/);
  const rechazadosMatch = text.match(/<RECHAZADOS>([^<]+)<\/RECHAZADOS>/);
  const reparosMatch = text.match(/<REPAROS>([^<]+)<\/REPAROS>/);

  return {
    estado: estadoMatch ? estadoMatch[1]!.trim() : "desconocido",
    glosa: glosaMatch ? glosaMatch[1]!.trim() : "",
    aceptados: aceptadosMatch ? parseInt(aceptadosMatch[1]!, 10) : 0,
    rechazados: rechazadosMatch ? parseInt(rechazadosMatch[1]!, 10) : 0,
    reparos: reparosMatch ? parseInt(reparosMatch[1]!, 10) : 0,
  };
}

function formatRutForSiiHeader(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export async function consultarRCV(
  env: SiiEnvironment,
  token: string,
  rutEmpresa: string,
  periodo: string,
  tipoRegistro: RcvTipoRegistro,
): Promise<RcvResumen> {
  const baseUrl = getBaseUrl(env);
  const rut = formatRutForSiiHeader(rutEmpresa);

  const endpoint = tipoRegistro === "compras"
    ? `${baseUrl}/cgi_dte/RCV/ConsultaCompra`
    : `${baseUrl}/cgi_dte/RCV/ConsultaVenta`;

  const response = await fetch(
    `${endpoint}?RutEmpresa=${rut}&Periodo=${periodo}`,
    {
      method: "GET",
      headers: {
        Cookie: `token=${token}`,
        "User-Agent": "EnjambreDTE/1.0",
      },
    },
  );

  if (!response.ok) {
    console.error('[SII] consultarRCV HTTP error', { status: response.status, rutEmpresa, periodo, tipoRegistro });
    return {
      periodo,
      tipoRegistro,
      totalDocumentos: 0,
      totalNeto: 0,
      totalIva: 0,
      totalExento: 0,
      totalTotal: 0,
      registros: [],
    };
  }

  const text = await response.text();
  return parsearRcvXml(text, periodo, tipoRegistro);
}

function parsearRcvXml(xml: string, periodo: string, tipoRegistro: RcvTipoRegistro): RcvResumen {
  const registros: RcvRegistroCompra[] | RcvRegistroVenta[] = [];
  let totalNeto = 0;
  let totalIva = 0;
  let totalExento = 0;
  let totalTotal = 0;

  const docPattern = /<Documento>([\s\S]*?)<\/Documento>/g;
  let docMatch: RegExpExecArray | null;

  while ((docMatch = docPattern.exec(xml)) !== null) {
    const doc = docMatch[1]!;

    const tipoDte = parseInt(extractXmlValue(doc, "TipoDTE") ?? "0", 10);
    const folio = parseInt(extractXmlValue(doc, "Folio") ?? "0", 10);
    const fechaEmision = extractXmlValue(doc, "FchEmis") ?? "";
    const montoNeto = parseInt(extractXmlValue(doc, "MntNeto") ?? "0", 10);
    const montoExento = parseInt(extractXmlValue(doc, "MntExe") ?? "0", 10);
    const montoIva = parseInt(extractXmlValue(doc, "MntIVA") ?? "0", 10);
    const montoTotal = parseInt(extractXmlValue(doc, "MntTotal") ?? "0", 10);

    totalNeto += montoNeto;
    totalIva += montoIva;
    totalExento += montoExento;
    totalTotal += montoTotal;

    if (tipoRegistro === "compras") {
      const compra: RcvRegistroCompra = {
        tipoDte,
        folio,
        fechaEmision,
        rutProveedor: extractXmlValue(doc, "RUTProv") ?? "",
        razonSocialProveedor: extractXmlValue(doc, "RznSocProv") ?? "",
        montoNeto,
        montoExento,
        montoIva,
        montoTotal,
        estadoRcv: parsearEstadoRcvXml(extractXmlValue(doc, "Estado") ?? ""),
        fechaRecepcion: extractXmlValue(doc, "FchRecep") ?? undefined,
        acuseRecibo: extractXmlValue(doc, "Acuse") ?? undefined,
      };
      (registros as RcvRegistroCompra[]).push(compra);
    } else {
      const venta: RcvRegistroVenta = {
        tipoDte,
        folio,
        fechaEmision,
        rutReceptor: extractXmlValue(doc, "RUTRecep") ?? "",
        razonSocialReceptor: extractXmlValue(doc, "RznSocRecep") ?? "",
        montoNeto,
        montoExento,
        montoIva,
        montoTotal,
        estadoRcv: parsearEstadoRcvXml(extractXmlValue(doc, "Estado") ?? ""),
      };
      (registros as RcvRegistroVenta[]).push(venta);
    }
  }

  return {
    periodo,
    tipoRegistro,
    totalDocumentos: registros.length,
    totalNeto,
    totalIva,
    totalExento,
    totalTotal,
    registros,
  };
}

function extractXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match ? match[1]!.trim() : null;
}

function parsearEstadoRcvXml(estado: string): import("@enjambre/contable").RcvEstadoRegistro {
  const map: Record<string, import("@enjambre/contable").RcvEstadoRegistro> = {
    EPR: "aceptado",
    RCP: "pendiente",
    RCT: "reclamado",
    ANU: "anulado",
    REG: "registrar",
  };
  return map[estado] ?? "pendiente";
}

function extractRutParts(rut: string): { base: string; dv: string } {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  const dv = clean.slice(-1);
  const base = clean.slice(0, -1);
  return { base, dv };
}

export async function consultarEstadoDteIndividual(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  rutReceptor: string,
  tipoDte: number,
  folio: number,
  fechaEmision: string, // DDMMAAAA
  montoTotal: number
): Promise<SiiQueryEstDteResult> {
  const { base: rutConsultante, dv: dvConsultante } = extractRutParts(rutEmisor);
  const { base: rutReceptorBase, dv: dvReceptor } = extractRutParts(rutReceptor);
  const baseUrl = getBaseUrl(env);

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>
    <m:getEstDte xmlns:m="${baseUrl}/DTEWS/QueryEstDte.jws">
      <RutConsultante xsi:type="xsd:string">${rutConsultante}</RutConsultante>
      <DvConsultante xsi:type="xsd:string">${dvConsultante}</DvConsultante>
      <RutCompania xsi:type="xsd:string">${rutConsultante}</RutCompania>
      <DvCompania xsi:type="xsd:string">${dvConsultante}</DvCompania>
      <RutReceptor xsi:type="xsd:string">${rutReceptorBase}</RutReceptor>
      <DvReceptor xsi:type="xsd:string">${dvReceptor}</DvReceptor>
      <TipoDte xsi:type="xsd:string">${tipoDte}</TipoDte>
      <FolioDte xsi:type="xsd:string">${folio}</FolioDte>
      <FechaEmisionDte xsi:type="xsd:string">${fechaEmision}</FechaEmisionDte>
      <MontoDte xsi:type="xsd:string">${montoTotal}</MontoDte>
      <Token xsi:type="xsd:string">${token}</Token>
    </m:getEstDte>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  const response = await fetch(`${baseUrl}/DTEWS/QueryEstDte.jws`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": "",
      "User-Agent": "EnjambreDTE/1.0",
    },
    body: soapBody,
  });

  if (!response.ok) {
    console.error('[SII] consultarEstadoDteIndividual HTTP error', { status: response.status, rutEmisor, tipoDte, folio });
    return {
      estado: "Otros",
      glosa: `HTTP ${response.status}`,
      errCode: "-2",
      glosaErr: "Error de red",
      numAtencion: "",
    };
  }

  const text = await response.text();
  const getEstDteReturnMatch = text.match(/<getEstDteReturn[^>]*>(.*?)<\/getEstDteReturn>/s);
  
  if (!getEstDteReturnMatch) {
    return {
      estado: "Otros",
      glosa: "Respuesta SOAP sin getEstDteReturn",
      errCode: "-3",
      glosaErr: "Error de formato de respuesta SII",
      numAtencion: "",
    };
  }

  // Desencriptar inner XML
  const innerXmlEncoded = getEstDteReturnMatch[1]!;
  const innerXml = innerXmlEncoded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  const estadoMatch = innerXml.match(/<ESTADO>([^<]+)<\/ESTADO>/);
  const glosaMatch = innerXml.match(/<GLOSA>([^<]+)<\/GLOSA>/) || innerXml.match(/<GLOSA_ESTADO>([^<]+)<\/GLOSA_ESTADO>/);
  const errCodeMatch = innerXml.match(/<ERR_CODE>([^<]+)<\/ERR_CODE>/);
  const glosaErrMatch = innerXml.match(/<GLOSA_ERR>([^<]+)<\/GLOSA_ERR>/);
  const numAtencionMatch = innerXml.match(/<NUM_ATENCION>([^<]+)<\/NUM_ATENCION>/);

  return {
    estado: (estadoMatch ? estadoMatch[1]!.trim() : "Otros") as SiiSoapEstado,
    glosa: glosaMatch ? glosaMatch[1]!.trim() : "",
    errCode: errCodeMatch ? errCodeMatch[1]!.trim() : "",
    glosaErr: glosaErrMatch ? glosaErrMatch[1]!.trim() : "",
    numAtencion: numAtencionMatch ? numAtencionMatch[1]!.trim() : "",
  };
}

/** QueryEstUp — estado de un envío (upload) por TrackId (WS de certificación). */
export async function consultarEstadoUpload(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  trackId: string,
): Promise<QueryEstUpResult> {
  const baseUrl = getBaseUrl(env);
  const { base, dv } = extractRutParts(rutEmisor);
  const ns = `${baseUrl}${DTEWS_PATHS.QUERY_EST_UP}`;

  const response = await fetch(`${baseUrl}${DTEWS_PATHS.QUERY_EST_UP}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildQueryEstUpEnvelope(ns, base, dv, trackId, token),
  });

  if (!response.ok) {
    console.error('[SII] consultarEstadoUpload HTTP error', { status: response.status, trackId, rutEmisor });
    return { estado: "Otros", glosa: `HTTP ${response.status}`, trackId, numAtencion: "" };
  }

  return parseQueryEstUp(await response.text());
}

/**
 * QueryEstDteAv — consulta avanzada del estado de un DTE con verificación de
 * datos (RECIBIDO/ESTADO). FirmaDte = DTE/Signature/SignatureValue del XML.
 */
export async function consultarEstadoAvanzado(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  rutReceptor: string,
  tipoDte: number,
  folio: number,
  fechaEmision: string, // ISO YYYY-MM-DD
  montoTotal: number,
  firmaDte: string,
): Promise<QueryEstDteAvResult> {
  const baseUrl = getBaseUrl(env);
  const { base: rutEmpresa, dv: dvEmpresa } = extractRutParts(rutEmisor);
  const { base: rutReceptorBase, dv: dvReceptor } = extractRutParts(rutReceptor);
  const ns = `${baseUrl}${DTEWS_PATHS.QUERY_EST_DTE_AV}`;

  const response = await fetch(`${baseUrl}${DTEWS_PATHS.QUERY_EST_DTE_AV}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildQueryEstDteAvEnvelope(
      ns,
      rutEmpresa,
      dvEmpresa,
      rutReceptorBase,
      dvReceptor,
      tipoDte,
      folio,
      formatDateSiiDdMmYyyy(fechaEmision),
      montoTotal,
      firmaDte,
      token,
    ),
  });

  if (!response.ok) {
    console.error('[SII] consultarEstadoAvanzado HTTP error', { status: response.status, rutEmisor, tipoDte, folio });
    return { estado: "Otros", recibido: "", glosa: `HTTP ${response.status}`, trackId: "", numAtencion: "" };
  }

  return parseQueryEstDteAv(await response.text());
}

/** wsDTECorreo — solicita el reenvío del correo con el diagnóstico de validación de un TrackId. */
export async function reenviarCorreoValidacion(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  trackId: string,
): Promise<ReenvioCorreoResult> {
  const baseUrl = getBaseUrl(env);
  const { base, dv } = extractRutParts(rutEmisor);
  const ns = `${baseUrl}${DTEWS_PATHS.WS_DTE_CORREO}`;

  const response = await fetch(`${baseUrl}${DTEWS_PATHS.WS_DTE_CORREO}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildReenvioCorreoEnvelope(ns, token, base, dv, trackId),
  });

  if (!response.ok) {
    console.error('[SII] reenviarCorreoValidacion HTTP error', { status: response.status, trackId, rutEmisor });
    return { estado: "-1", glosa: `HTTP ${response.status}` };
  }

  return parseReenvioCorreo(await response.text());
}
