import { describe, expect, it, vi, afterEach } from "vitest";
import { createHash, createPublicKey, createVerify } from "node:crypto";
import forge from "node-forge";
import {
  getSiiTokenWs,
  signSeedXml,
  consultarEstadoUpload,
  consultarEstadoAvanzado,
  reenviarCorreoValidacion,
} from "./sii-client";

function generarP12(commonName: string): { p12Base64: string; privateKeyPem: string; certPem: string } {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86400000);
  cert.validity.notAfter = new Date(Date.now() + 86400000);
  const attrs = [{ name: "commonName", value: commonName }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha1.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "secreto", {
    algorithm: "3des",
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return {
    p12Base64: forge.util.encode64(p12Der),
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    certPem: forge.pki.certificateToPem(cert),
  };
}

const material = generarP12("Certificado de Prueba Enjambre");

/** Envuelve un inner XML como respuesta SOAP escapada (patrón getSeedReturn/getTokenReturn). */
function wrapSoap(returnTag: string, innerXml: string): string {
  const escaped = innerXml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ns1:resp xmlns:ns1="x"><${returnTag} xsi:type="xsd:string">${escaped}</${returnTag}></ns1:resp></soapenv:Body></soapenv:Envelope>`;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signSeedXml", () => {
  it("genera el XML getToken según el manual (item/Semilla + Signature enveloped)", () => {
    const xml = signSeedXml("000002360958", material.p12Base64, "secreto");
    expect(xml).toContain("<getToken>");
    expect(xml).toContain("<item><Semilla>000002360958</Semilla></item>");
    expect(xml).toContain('xmlns="http://www.w3.org/2000/09/xmldsig#"');
    expect(xml).toContain('<Reference URI="">');
    expect(xml).toContain('http://www.w3.org/2000/09/xmldsig#enveloped-signature');
    expect(xml).toContain("<DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"/>");
    expect(xml).toContain("<SignatureValue>");
    expect(xml).toContain("<Modulus>");
    expect(xml).toContain("<Exponent>AQAB</Exponent>");
    expect(xml).toContain("<X509Certificate>");
  });

  it("la firma corresponde a la llave privada del P12 (verificable con el certificado)", () => {
    const semilla = "000002360958";
    const xml = signSeedXml(semilla, material.p12Base64, "secreto");

    const signatureValue = xml.match(/<SignatureValue>([^<]+)<\/SignatureValue>/)?.[1] ?? "";
    const digest = xml.match(/<DigestValue>([^<]+)<\/DigestValue>/)?.[1] ?? "";

    // El SignedInfo firmado es el compacto del builder: mismo contenido y digest
    const content = `<item><Semilla>${semilla}</Semilla></item>`;
    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digest}</DigestValue></Reference></SignedInfo>`;

    expect(createHash("sha1").update(content, "latin1").digest("base64")).toBe(digest);

    const verifier = createVerify("RSA-SHA1");
    verifier.update(signedInfo, "latin1");
    verifier.end();
    const publicKey = createPublicKey({ key: material.certPem, format: "pem" });
    expect(verifier.verify(publicKey, signatureValue, "base64")).toBe(true);
  });
});

describe("getSiiTokenWs", () => {
  it("obtiene semilla, la firma y recibe el token (flujo CrSeed)", async () => {
    const seedInner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>00</ESTADO></SII:RESP_HDR><SII:RESP_BODY><SEMILLA>000000000078</SEMILLA></SII:RESP_BODY></SII:RESPUESTA>`;
    const tokenInner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>00</ESTADO><GLOSA>Token Creado</GLOSA></SII:RESP_HDR><SII:RESP_BODY><TOKEN>XAuSbYXiNh9Ik</TOKEN></SII:RESP_BODY></SII:RESPUESTA>`;

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("getSeedReturn", seedInner) })
      .mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("getTokenReturn", tokenInner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getSiiTokenWs("CERTIFICACION", material.p12Base64, "secreto");

    expect(result.token).toBe("XAuSbYXiNh9Ik");
    expect(result.expiresAt).toBeGreaterThan(Date.now());

    // Primer request: CrSeed (sin parámetros). Segundo: GetTokenFromSeed con la semilla firmada.
    const firstUrl = fetchMock.mock.calls[0]![0] as string;
    const secondUrl = fetchMock.mock.calls[1]![0] as string;
    expect(firstUrl).toContain("/DTEWS/CrSeed.jws");
    expect(secondUrl).toContain("/DTEWS/GetTokenFromSeed.jws");

    const secondBody = fetchMock.mock.calls[1]![1] as RequestInit;
    const bodyStr = String(secondBody.body);
    expect(bodyStr).toContain("&lt;getToken&gt;");
    expect(bodyStr).toContain("&lt;Semilla&gt;000000000078&lt;/Semilla&gt;");
  });

  it("lanza si la semilla no llega", async () => {
    const seedInner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>08</ESTADO><GLOSA>TIME-OUT DEL SEED</GLOSA></SII:RESP_HDR></SII:RESPUESTA>`;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getSeedReturn", seedInner) }) as unknown as typeof fetch;

    await expect(getSiiTokenWs("CERTIFICACION", material.p12Base64, "secreto"))
      .rejects.toThrow("TIME-OUT DEL SEED");
  });

  it("lanza si el token no llega", async () => {
    const seedInner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>00</ESTADO></SII:RESP_HDR><SII:RESP_BODY><SEMILLA>000000000078</SEMILLA></SII:RESP_BODY></SII:RESPUESTA>`;
    const tokenInner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>05</ESTADO><GLOSA>XML Invalido, firma invalida</GLOSA></SII:RESP_HDR></SII:RESPUESTA>`;
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("getSeedReturn", seedInner) })
      .mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("getTokenReturn", tokenInner) }) as unknown as typeof fetch;

    await expect(getSiiTokenWs("CERTIFICACION", material.p12Base64, "secreto"))
      .rejects.toThrow("firma invalida");
  });
});

describe("consultarEstadoUpload (QueryEstUp)", () => {
  it("consulta por TrackId y parsea el estado EPR del envío", async () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><TRACKID>53292</TRACKID><ESTADO>EPR</ESTADO><GLOSA>Envio Procesado</GLOSA></SII:RESP_HDR><SII:RESP_BODY><TIPO_DOCTO>56</TIPO_DOCTO><INFORMADOS>1</INFORMADOS><ACEPTADOS>0</ACEPTADOS><RECHAZADOS>1</RECHAZADOS><REPAROS>0</REPAROS><NUM_ATENCION>532 ( 2004/06/14 16:44:20) </NUM_ATENCION></SII:RESP_BODY></SII:RESPUESTA>`;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getEstUpReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await consultarEstadoUpload("CERTIFICACION", "token-x", "76350040-1", "53292");

    expect(result.estado).toBe("EPR");
    expect(result.tipoDocto).toBe("56");
    expect(result.aceptados).toBe(0);
    expect(result.rechazados).toBe(1);

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toContain("/DTEWS/QueryEstUp.jws");
    expect(body).toContain("<RutCompania xsi:type=\"xsd:string\">76350040</RutCompania>");
    expect(body).toContain("<DvCompania xsi:type=\"xsd:string\">1</DvCompania>");
    expect(body).toContain("<TrackId xsi:type=\"xsd:string\">53292</TrackId>");
    expect(body).toContain("<Token xsi:type=\"xsd:string\">token-x</Token>");
  });

  it("errores HTTP se devuelven como estado Otros", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    const result = await consultarEstadoUpload("CERTIFICACION", "token-x", "76350040-1", "53292");
    expect(result.estado).toBe("Otros");
    expect(result.glosa).toContain("500");
  });
});

describe("consultarEstadoAvanzado (QueryEstDteAv)", () => {
  it("envía los 10 parámetros y parsea RECIBIDO/ESTADO", async () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><RECIBIDO>SI</RECIBIDO><ESTADO>DOK</ESTADO><GLOSA>Documento Recibido por el SII. Datos Coinciden con los Registrados</GLOSA><TRACKID>36440</TRACKID><NUMATENCION>137416 [25/07/2006 12:08:20]</NUMATENCION></SII:RESP_BODY></SII:RESPUESTA>`;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getEstDteAvReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await consultarEstadoAvanzado(
      "CERTIFICACION",
      "token-x",
      "97975000-5",
      "8414240-9",
      33,
      27,
      "2003-09-08",
      502946,
      "firma-dte-sig",
    );

    expect(result.estado).toBe("DOK");
    expect(result.recibido).toBe("SI");
    expect(result.trackId).toBe("36440");

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toContain("/DTEWS/QueryEstDteAv.jws");
    expect(body).toContain("<RutEmpresa xsi:type=\"xsd:string\">97975000</RutEmpresa>");
    expect(body).toContain("<DvEmpresa xsi:type=\"xsd:string\">5</DvEmpresa>");
    expect(body).toContain("<RutReceptor xsi:type=\"xsd:string\">8414240</RutReceptor>");
    expect(body).toContain("<DvReceptor xsi:type=\"xsd:string\">9</DvReceptor>");
    expect(body).toContain("<TipoDte xsi:type=\"xsd:string\">33</TipoDte>");
    expect(body).toContain("<FolioDte xsi:type=\"xsd:string\">27</FolioDte>");
    // Fecha en DD-MM-AAAA (formato del manual)
    expect(body).toContain("<FechaEmisionDte xsi:type=\"xsd:string\">08-09-2003</FechaEmisionDte>");
    expect(body).toContain("<MontoDte xsi:type=\"xsd:string\">502946</MontoDte>");
    expect(body).toContain("<FirmaDte xsi:type=\"xsd:string\">firma-dte-sig</FirmaDte>");
  });
});

describe("reenviarCorreoValidacion (wsDTECorreo)", () => {
  it("estado 0 = requerimiento recibido OK", async () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("reenvioCorreoReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await reenviarCorreoValidacion("CERTIFICACION", "token-x", "76350040-1", "53292");
    expect(result.estado).toBe("0");

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toContain("/DTEWS/wsDTECorreo.jws");
    expect(body).toContain("<Token xsi:type=\"xsd:string\">token-x</Token>");
    expect(body).toContain("<RutEmpresa xsi:type=\"xsd:string\">76350040</RutEmpresa>");
    expect(body).toContain("<TrackId xsi:type=\"xsd:string\">53292</TrackId>");
  });

  it("estado 105 = TrackId no existe", async () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>105</SII:ESTADO><SII:GLOSA>TRACKID NO EXISTE</SII:GLOSA></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("reenvioCorreoReturn", inner) }) as unknown as typeof fetch;

    const result = await reenviarCorreoValidacion("CERTIFICACION", "token-x", "76350040-1", "99999");
    expect(result.estado).toBe("105");
    expect(result.glosa).toBe("TRACKID NO EXISTE");
  });
});
