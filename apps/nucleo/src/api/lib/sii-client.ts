import { createPrivateKey, createSign, createHash, X509Certificate } from "node:crypto";
import forge from "node-forge";
import type { CafFolio, SiiAuthToken, SiiEnvioResult, SiiEstadoResult, SiiQueryEstDteResult, SiiSoapEstado } from "@enjambre/contable";
import type { RcvRegistroCompra, RcvRegistroVenta, RcvResumen, RcvTipoRegistro } from "@enjambre/contable";
import { SII_ENV } from "@enjambre/contable";
import type { SiiEnvironment } from "@enjambre/contable";

function getBaseUrl(env: SiiEnvironment): string {
  return SII_ENV[env];
}

interface P12ExtractResult {
  privateKeyPem: string;
  certPem: string;
}

function extractP12(p12Base64: string, p12Password: string): P12ExtractResult {
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
    throw new Error("Error al procesar el archivo P12. Verifica la contraseña.");
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
  let { privateKeyPem, certPem } = extractP12(p12Base64, p12Password);

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

  // Zeroing mitigation para reducir tiempo en heap
  privateKeyPem = '\0'.repeat(privateKeyPem.length);

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

export function stampDteXml(xml: string, caf: CafFolio, folio: number): string {
  if (folio < caf.desde || folio > caf.hasta) {
    throw new Error(`Folio ${folio} fuera del rango CAF (${caf.desde}-${caf.hasta})`);
  }

  // Extraer valores dinámicamente del XML generado
  const re = xml.match(/<RUTEmisor>([^<]+)<\/RUTEmisor>/)?.[1] || "";
  const td = xml.match(/<TipoDTE>([^<]+)<\/TipoDTE>/)?.[1] || "";
  const rr = xml.match(/<RUTRecep>([^<]+)<\/RUTRecep>/)?.[1] || "";
  const rsr = xml.match(/<RznSocRecep>([^<]+)<\/RznSocRecep>/)?.[1]?.substring(0, 40) || "";
  const mnt = xml.match(/<MntTotal>([^<]+)<\/MntTotal>/)?.[1] || "0";
  const it1 = xml.match(/<NmbItem>([^<]+)<\/NmbItem>/)?.[1] || "";

  const timbre = buildTimbre(caf, folio, re, td, rr, rsr, mnt, it1);

  return xml.replace("</Documento>", `${timbre}\n</Documento>`);
}

function buildTimbre(caf: CafFolio, folio: number, re: string, td: string, rr: string, rsr: string, mnt: string, it1: string): string {
  const itemNode = it1 ? `\n    <IT1>${it1}</IT1>` : "";
  return `
<TED version="1.0">
  <DD>
    <RE>${re}</RE>
    <TD>${td}</TD>
    <F>${folio}</F>
    <FE>${caf.fechaAutorizacion}</FE>
    <RR>${rr}</RR>
    <RSR>${rsr}</RSR>
    <MNT>${mnt}</MNT>${itemNode}
  </DD>
  <FRMT algoritmo="SHA1withRSA">${caf.firma}</FRMT>
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
