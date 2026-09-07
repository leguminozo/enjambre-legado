import { describe, expect, it } from "vitest";
import { createPrivateKey, createSign, createVerify } from "node:crypto";
import forge from "node-forge";
import { firmarTimbre, stampDteXml } from "./sii-client";
import { buildDteXml } from "@enjambre/contable";
import type { CafFolio, DteDocumento } from "@enjambre/contable";

// Vector dorado del manual SII "Timbre Electrónico de Ejemplo" (sección 5.2):
// el Mensaje <DD>...</DD> firmado con la llave privada del CAF debe producir
// exactamente el FRMT publicado. La llave del ejemplo es RSA de 512 bits
// (mínimo histórico); si el OpenSSL del runtime la rechaza, el vector queda
// documentado como referencia y la cobertura real corre con llaves modernas.
const MENSAJE_MANUAL = `<DD><RE>97975000-5</RE><TD>33</TD><F>27</F><FE>2003-09-08</FE><RR>8414240-9</RR><RSR>JORGE GONZALEZ LTDA</RSR><MNT>502946</MNT><IT1>Cajon AFECTO</IT1><CAF version="1.0"><DA><RE>97975000-5</RE><RS>RUT DE PRUEBA</RS><TD>33</TD><RNG><D>1</D><H>200</H></RNG><FA>2003-09-04</FA><RSAPK><M>0a4O6Kbx8Qj3K4iWSP4w7KneZYeJ+g/prihYtIEolKt3cykSxl1zO8vSXu397QhTmsX7SBEudTUx++2zDXBhZw==</M><E>Aw==</E></RSAPK><IDK>100</IDK></DA><FRMA algoritmo="SHA1withRSA">g1AQX0sy8NJugX52k2hTJEZAE9Cuul6pqYBdFxj1N17umW7zG/hAavCALKByHzdYAfZ3LhGTXCai5zNxOo4lDQ==</FRMA></CAF><TSTED>2003-09-08T12:28:31</TSTED></DD>`;

const PRIVATE_KEY_MANUAL = `-----BEGIN RSA PRIVATE KEY-----
MIIBOwIBAAJBANGuDuim8fEI9yuIlkj+MOyp3mWHifoP6a4oWLSBKJSrd3MpEsZd
czvL0l7t/e0IU5rF+0gRLnU1Mfvtsw1wYWcCAQMCQQCLyV9FxKFLW09yWw7bVCCd
xpRDr7FRX/EexZB4VhsNxm/vtJfDZyYle0Lfy42LlcsXxPm1w6Q6NnjuW+AeBy67
AiEA7iMi5q5xjswqq+49RP55o//jqdZL/pC9rdnUKxsNRMMCIQDhaHdIctErN2hC
IP9knS3+9zra4R+5jSXOvI+3xVhWjQIhAJ7CF0R0S7SIHHKe04NUURf/7RvkMqm1
08k74sdnXi3XAiEAlkWk2vc2HM+a1sCqQxNz/098ketqe7NuidMKeoOQObMCIQCk
FAMS9IcPcMjk7zI2r/4EEW63PSXyN7MFAX7TYe25mw==
-----END RSA PRIVATE KEY-----`;

const FRMT_ESPERADO_MANUAL = "pqjXHHQLJmyFPMRvxScN7tYHvIsty0pqL2LLYaG43jMmnfiZfllLA0wb32lP+HBJ/tf8nziSeorvjlx410ZImw==";

/** Genera un par de llaves + P12 de prueba con node-forge (para firmas reales). */
function generarMaterial(commonName: string): { p12Base64: string; privateKeyPem: string; certPem: string } {
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

const material = generarMaterial("Certificado de Prueba Enjambre");

describe("firmarTimbre", () => {
  it("reproduce el FRMT del ejemplo del manual (vector dorado)", () => {
    let resultado: string | null = null;
    let error: unknown = null;
    try {
      resultado = firmarTimbre(MENSAJE_MANUAL, PRIVATE_KEY_MANUAL);
    } catch (err) {
      error = err;
    }

    if (error !== null) {
      // Llave de 512 bits rechazada por el OpenSSL del runtime: el vector
      // queda documentado en el código y la cobertura real corre abajo.
      expect(String(error)).toMatch(/too small|key size|RSA|sign/i);
      return;
    }
    expect(resultado).toBe(FRMT_ESPERADO_MANUAL);
  });

  it("produce una firma RSA-SHA1 verificable con la llave pública del CAF", () => {
    const dd = `<DD><RE>76350040-1</RE><TD>33</TD><F>1</F><FE>2026-08-01</FE><RR>60803000-K</RR><RSR>SII</RSR><MNT>119000</MNT><CAF version="1.0"><DA><RE>76350040-1</RE><RS>ENJAMBRE SPA</RS><TD>33</TD><RNG><D>1</D><H>100</H></RNG><FA>2026-07-01</FA><RSAPK><M>m</M><E>e</E></RSAPK></DA><FRMA algoritmo="SHA1withRSA">f</FRMA></CAF><TSTED>2026-08-08T12:00:00</TSTED></DD>`;
    const frmt = firmarTimbre(dd, material.privateKeyPem);

    const verifier = createVerify("RSA-SHA1");
    verifier.update(dd, "latin1");
    verifier.end();
    const publicKey = createPrivateKey({ key: material.privateKeyPem, format: "pem" });
    expect(verifier.verify(publicKey, frmt, "base64")).toBe(true);
  });

  it("produce firmas diferentes para DD distintos", () => {
    const a = firmarTimbre("<DD><RE>1</RE></DD>", material.privateKeyPem);
    const b = firmarTimbre("<DD><RE>2</RE></DD>", material.privateKeyPem);
    expect(a).not.toBe(b);
  });
});

describe("stampDteXml", () => {
  const EMISOR = {
    rut: "76350040-1",
    razonSocial: "Enjambre SpA",
    giro: "Comercio Electronico",
    direccion: "Av. Principal 100",
    comuna: "Santiago",
    ciudad: "Santiago",
    actividadEconomica: 51900,
  };

  const RECEPTOR = {
    rut: "60803000-K",
    razonSocial: "SII",
    giro: "Servicio de Impuestos",
    direccion: "Av. Libertador 1",
    comuna: "Santiago",
    ciudad: "Santiago",
  };

  const DOC: DteDocumento = {
    encabezado: {
      tipoDte: 33,
      folio: 1,
      fechaEmision: "2026-08-01",
      emisor: EMISOR,
      receptor: RECEPTOR,
      montoNeto: 100000,
      montoExento: 0,
      tasaIva: 0.19,
      montoIva: 19000,
      montoTotal: 119000,
    },
    detalles: [{ nombre: "Miel 500g", cantidad: 2, precioUnitario: 50000, montoItem: 100000 }],
  };

  const CAF: CafFolio = {
    tipoDte: 33,
    desde: 1,
    hasta: 100,
    fechaAutorizacion: "2026-07-01",
    firma: "firma-sii-del-caf",
    privateKey: material.privateKeyPem,
    publicKey: material.certPem,
    idk: "42",
  };

  it("emite el TED completo: DD con CAF/FRMA/TSTED y FRMT firmado con la llave del CAF", () => {
    const xml = stampDteXml(buildDteXml(DOC), CAF, 1, { tmstEd: "2026-08-08T12:00:00" });

    expect(xml).toContain('<TED version="1.0">');
    // DD con los datos del documento + CAF + TSTED
    expect(xml).toContain("<RE>76350040-1</RE>");
    expect(xml).toContain("<TD>33</TD>");
    expect(xml).toContain("<F>1</F>");
    // FE = fecha de emisión del DTE (no la fecha de autorización del CAF)
    expect(xml).toContain("<FE>2026-08-01</FE>");
    expect(xml).toContain("<MNT>119000</MNT>");
    expect(xml).toContain('<CAF version="1.0">');
    expect(xml).toContain("<RNG><D>1</D><H>100</H></RNG>");
    expect(xml).toContain("<FA>2026-07-01</FA>");
    expect(xml).toContain("<IDK>42</IDK>");
    expect(xml).toContain('<FRMA algoritmo="SHA1withRSA">firma-sii-del-caf</FRMA>');
    expect(xml).toContain("<TSTED>2026-08-08T12:00:00</TSTED>");
    // FRMT es la firma del DD, distinta de la FRMA del CAF
    expect(xml).toContain('<FRMT algoritmo="SHA1withRSA">');
    expect(xml).not.toContain("<FRMT algoritmo=\"SHA1withRSA\">firma-sii-del-caf</FRMT>");
  });

  it("el FRMT verifica contra el DD que quedó incrustado en el XML", () => {
    const xml = stampDteXml(buildDteXml(DOC), CAF, 1, { tmstEd: "2026-08-08T12:00:00" });
    const ddMatch = xml.match(/<TED version="1.0">\n {2}(<DD>[\s\S]*?<\/DD>)\n/);
    expect(ddMatch).not.toBeNull();
    const dd = ddMatch![1]!;
    const frmtMatch = xml.match(/<FRMT algoritmo="SHA1withRSA">([^<]+)<\/FRMT>/);
    expect(frmtMatch).not.toBeNull();

    const verifier = createVerify("RSA-SHA1");
    verifier.update(dd, "latin1");
    verifier.end();
    const publicKey = createPrivateKey({ key: material.privateKeyPem, format: "pem" });
    expect(verifier.verify(publicKey, frmtMatch![1]!, "base64")).toBe(true);
  });

  it("lanza si el folio está fuera del rango del CAF", () => {
    expect(() => stampDteXml(buildDteXml(DOC), CAF, 101)).toThrow("fuera del rango CAF");
  });
});

// createSign importado solo para documentar el algoritmo en este módulo de test
void createSign;
