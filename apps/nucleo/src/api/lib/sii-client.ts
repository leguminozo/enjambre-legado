import { createPrivateKey, createSign, createHash, X509Certificate } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type { CafFolio, SiiAuthToken, SiiEnvioResult, SiiEstadoResult } from "@enjambre/contable";
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
  const p12Buffer = Buffer.from(p12Base64, "base64");
  const tmpP12 = join(tmpdir(), `sii_${Date.now()}.p12`);
  const tmpKey = join(tmpdir(), `sii_${Date.now()}_key.pem`);
  const tmpCert = join(tmpdir(), `sii_${Date.now()}_cert.pem`);

  try {
    writeFileSync(tmpP12, p12Buffer);

    execSync(
      `openssl pkcs12 -in "${tmpP12}" -nocerts -nodes -passin pass:${p12Password} -out "${tmpKey}"`,
      { stdio: "pipe" },
    );
    execSync(
      `openssl pkcs12 -in "${tmpP12}" -clcerts -nokeys -passin pass:${p12Password} -out "${tmpCert}"`,
      { stdio: "pipe" },
    );

    const privateKeyPem = readFileSync(tmpKey, "utf8");
    const certPem = readFileSync(tmpCert, "utf8");

    return { privateKeyPem, certPem };
  } finally {
    try { execSync(`rm -f "${tmpP12}" "${tmpKey}" "${tmpCert}"`, { stdio: "pipe" }); } catch (error) { console.error('[sii-client] cleanup error:', error) }
  }
}

export function signDteXml(xml: string, p12Base64: string, p12Password: string): string {
  const { privateKeyPem, certPem } = extractP12(p12Base64, p12Password);

  const docMatch = xml.match(/<Documento[^>]*>([\s\S]*?)<\/Documento>/);
  if (!docMatch) {
    throw new Error("No se encontro nodo Documento en el XML");
  }

  const documentoContent = docMatch[1]!.replace(/\s+/g, " ").trim();

  const digest = createHash("sha1").update(documentoContent, "latin1").digest("base64");

  const certIdMatch = xml.match(/<Documento[^>]*ID="([^"]*)"/);
  const docId = certIdMatch ? certIdMatch[1]! : "DTE";

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

  return xml.replace("</Documento>", `${signatureNode}\n</Documento>`);
}

export function stampDteXml(xml: string, caf: CafFolio, folio: number): string {
  if (folio < caf.desde || folio > caf.hasta) {
    throw new Error(`Folio ${folio} fuera del rango CAF (${caf.desde}-${caf.hasta})`);
  }

  const timbre = buildTimbre(caf, folio);

  return xml.replace("</Documento>", `${timbre}\n</Documento>`);
}

function buildTimbre(caf: CafFolio, folio: number): string {
  return `
<TED version="1.0">
  <DD>
    <RE>${caf.publicKey}</RE>
    <TD>46</TD>
    <F>${folio}</F>
    <FE>${caf.fechaAutorizacion}</FE>
    <RR>60803000-K</RR>
    <RSR>SERVICIO DE IMPUESTOS INTERNOS</RSR>
    <MNT>0</MNT>
    <IT1>FACTURA COMPRA</IT1>
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
