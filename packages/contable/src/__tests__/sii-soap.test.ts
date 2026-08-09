import { describe, it, expect } from "vitest";
import {
  buildGetSeedEnvelope,
  buildGetTokenEnvelope,
  buildQueryEstUpEnvelope,
  buildQueryEstDteAvEnvelope,
  buildReenvioCorreoEnvelope,
  decodeSoapReturn,
  parseSiiRespuesta,
  parseQueryEstUp,
  parseQueryEstDteAv,
  parseReenvioCorreo,
  parseAuthWsRespuesta,
  formatDateSiiDdMmYyyy,
  DTEWS_PATHS,
} from "../domain/sii-soap";

const NS = "https://maullin.sii.cl/DTEWS/CrSeed.jws";

describe("buildGetSeedEnvelope", () => {
  it("emite el sobre SOAP 1.1 con el método getSeed sin parámetros", () => {
    const xml = buildGetSeedEnvelope(NS);
    expect(xml).toContain("<SOAP-ENV:Envelope");
    expect(xml).toContain("encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"");
    expect(xml).toContain(`<m:getSeed xmlns:m="${NS}"/>`);
  });
});

describe("buildGetTokenEnvelope", () => {
  it("escapa el XML de la semilla firmada dentro de pszXml", () => {
    const seedXml = `<?xml version="1.0"?><getToken><item><Semilla>000002360958</Semilla></item><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo/></Signature></getToken>`;
    const xml = buildGetTokenEnvelope(NS, seedXml);
    expect(xml).toContain(`<pszXml xsi:type="xsd:string">&lt;?xml version=&quot;1.0&quot;?&gt;&lt;getToken&gt;`);
    expect(xml).not.toContain("<getToken><item>");
    expect(xml).toContain(`<m:getToken xmlns:m="${NS}">`);
  });
});

describe("buildQueryEstUpEnvelope", () => {
  it("incluye RutCompania, DvCompania, TrackId y Token", () => {
    const xml = buildQueryEstUpEnvelope(NS, "76350040", "1", "53292", "XAuSbYXiNh9Ik");
    expect(xml).toContain("<RutCompania xsi:type=\"xsd:string\">76350040</RutCompania>");
    expect(xml).toContain("<DvCompania xsi:type=\"xsd:string\">1</DvCompania>");
    expect(xml).toContain("<TrackId xsi:type=\"xsd:string\">53292</TrackId>");
    expect(xml).toContain("<Token xsi:type=\"xsd:string\">XAuSbYXiNh9Ik</Token>");
    expect(xml).toContain("<m:getEstUp xmlns:m=");
  });
});

describe("buildQueryEstDteAvEnvelope", () => {
  it("incluye los 10 parámetros del manual (FirmaDte y fecha DD-MM-AAAA)", () => {
    const xml = buildQueryEstDteAvEnvelope(
      NS, "97975000", "5", "8414240", "9", 33, 27, "08-09-2003", 502946,
      "kAxNuhGppcs1mTd6sXYGwy+etbKBlOqboMvnO2qyARJYmibHEGb3NOsunmPQS8D+ZHZH/QENE47mwVSKb/HgqjfIU1zsQcxEnTLQgbG9H6JYmSVXNh5DfVYXFmIDv/1kQOoeu8w8zPLeGLSQzVZ2fK9M9zzcUGWRWvZ6aNPp59o=",
      "token123",
    );
    expect(xml).toContain("<RutEmpresa xsi:type=\"xsd:string\">97975000</RutEmpresa>");
    expect(xml).toContain("<DvEmpresa xsi:type=\"xsd:string\">5</DvEmpresa>");
    expect(xml).toContain("<RutReceptor xsi:type=\"xsd:string\">8414240</RutReceptor>");
    expect(xml).toContain("<DvReceptor xsi:type=\"xsd:string\">9</DvReceptor>");
    expect(xml).toContain("<TipoDte xsi:type=\"xsd:string\">33</TipoDte>");
    expect(xml).toContain("<FolioDte xsi:type=\"xsd:string\">27</FolioDte>");
    expect(xml).toContain("<FechaEmisionDte xsi:type=\"xsd:string\">08-09-2003</FechaEmisionDte>");
    expect(xml).toContain("<MontoDte xsi:type=\"xsd:string\">502946</MontoDte>");
    expect(xml).toContain("<FirmaDte xsi:type=\"xsd:string\">kAxNuhGppcs1mTd6sXYGwy+etbKBlOqboMvnO2qyARJYmibHEGb3NOsunmPQS8D+ZHZH/QENE47mwVSKb/HgqjfIU1zsQcxEnTLQgbG9H6JYmSVXNh5DfVYXFmIDv/1kQOoeu8w8zPLeGLSQzVZ2fK9M9zzcUGWRWvZ6aNPp59o=</FirmaDte>");
    expect(xml).toContain("<Token xsi:type=\"xsd:string\">token123</Token>");
  });
});

describe("buildReenvioCorreoEnvelope", () => {
  it("incluye Token, RutEmpresa, DvEmpresa y TrackId", () => {
    const xml = buildReenvioCorreoEnvelope(NS, "tok", "76350040", "1", "53292");
    expect(xml).toContain("<Token xsi:type=\"xsd:string\">tok</Token>");
    expect(xml).toContain("<RutEmpresa xsi:type=\"xsd:string\">76350040</RutEmpresa>");
    expect(xml).toContain("<DvEmpresa xsi:type=\"xsd:string\">1</DvEmpresa>");
    expect(xml).toContain("<TrackId xsi:type=\"xsd:string\">53292</TrackId>");
    expect(xml).toContain("<m:reenvioCorreo xmlns:m=");
  });
});

describe("decodeSoapReturn", () => {
  it("extrae y decodifica el inner XML escapado", () => {
    const soap = `<soapenv:Body><ns1:getEstUpResponse xmlns:ns1="https://maullin.sii.cl/DTEWS/QueryEstUp.jws"><getEstUpReturn xsi:type="xsd:string">&lt;SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"&gt;&lt;SII:RESP_HDR&gt;&lt;ESTADO&gt;EPR&lt;/ESTADO&gt;&lt;/SII:RESP_HDR&gt;&lt;/SII:RESPUESTA&gt;</getEstUpReturn></ns1:getEstUpResponse></soapenv:Body>`;
    const inner = decodeSoapReturn(soap, "getEstUpReturn");
    expect(inner).toContain("<SII:RESPUESTA");
    expect(inner).toContain("<ESTADO>EPR</ESTADO>");
  });

  it("devuelve string vacío si no existe el returnTag", () => {
    expect(decodeSoapReturn("<soap/>", "getEstUpReturn")).toBe("");
  });
});

describe("parseSiiRespuesta", () => {
  it("parsea RESP_HDR y RESP_BODY en un record genérico", () => {
    const xml = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>0</ESTADO></SII:RESP_HDR><SII:RESP_BODY><RECIBIDO>SI</RECIBIDO><ESTADO>DOK</ESTADO><GLOSA>Documento Recibido por el SII. Datos Coinciden con los Registrados</GLOSA><TRACKID>36440</TRACKID><NUMATENCION>137416 [25/07/2006 12:08:20]</NUMATENCION></SII:RESP_BODY></SII:RESPUESTA>`;
    const resp = parseSiiRespuesta(xml);
    expect(resp.estado).toBe("DOK");
    expect(resp.recibido).toBe("SI");
    expect(resp.glosa).toBe("Documento Recibido por el SII. Datos Coinciden con los Registrados");
    expect(resp.trackId).toBe("36440");
    // Última ocurrencia gana: el ESTADO del RESP_BODY prevalece sobre el de RESP_HDR
    expect(resp.body["ESTADO"]).toBe("DOK");
  });
});

function wrapSoap(returnTag: string, innerXml: string): string {
  const escaped = innerXml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<soapenv:Body><ns1:resp xmlns:ns1="x"><${returnTag} xsi:type="xsd:string">${escaped}</${returnTag}></ns1:resp></soapenv:Body>`;
}

describe("parseQueryEstUp", () => {
  it("parsea estado EPR con detalle del envío (ejemplo del manual)", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><TRACKID>53292</TRACKID><ESTADO>EPR</ESTADO><GLOSA>Envio Procesado</GLOSA></SII:RESP_HDR><SII:RESP_BODY><TIPO_DOCTO>56</TIPO_DOCTO><INFORMADOS>1</INFORMADOS><ACEPTADOS>0</ACEPTADOS><RECHAZADOS>1</RECHAZADOS><REPAROS>0</REPAROS><NUM_ATENCION>532 ( 2004/06/14 16:44:20) </NUM_ATENCION></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseQueryEstUp(wrapSoap("getEstUpReturn", inner));
    expect(result.estado).toBe("EPR");
    expect(result.trackId).toBe("53292");
    expect(result.tipoDocto).toBe("56");
    expect(result.informados).toBe(1);
    expect(result.aceptados).toBe(0);
    expect(result.rechazados).toBe(1);
    expect(result.reparos).toBe(0);
    expect(result.numAtencion).toContain("2004/06/14");
  });

  it("sin getEstUpReturn devuelve estado Otros", () => {
    const result = parseQueryEstUp("<soap/>");
    expect(result.estado).toBe("Otros");
    expect(result.glosa).toContain("sin getEstUpReturn");
  });
});

describe("parseQueryEstDteAv", () => {
  it("parsea RECIBIDO=SI / ESTADO=DOK (ejemplo del manual)", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><RECIBIDO>SI</RECIBIDO><ESTADO>DOK</ESTADO><GLOSA>Documento Recibido por el SII. Datos Coinciden con los Registrados</GLOSA><TRACKID>36440</TRACKID><NUMATENCION>137416 [25/07/2006 12:08:20]</NUMATENCION></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseQueryEstDteAv(wrapSoap("getEstDteAvReturn", inner));
    expect(result.estado).toBe("DOK");
    expect(result.recibido).toBe("SI");
    expect(result.trackId).toBe("36440");
  });

  it("propaga errores de autenticación del RESP_HDR", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>2</SII:ESTADO><SII:GLOSA>Token no existe</SII:GLOSA></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const result = parseQueryEstDteAv(wrapSoap("getEstDteAvReturn", inner));
    expect(result.estado).toBe("2");
    expect(result.glosa).toBe("Token no existe");
    expect(result.recibido).toBe("");
  });
});

describe("parseReenvioCorreo", () => {
  it("estado 0 = requerimiento recibido OK", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const result = parseReenvioCorreo(wrapSoap("reenvioCorreoReturn", inner));
    expect(result.estado).toBe("0");
  });

  it("estado 105 con glosa TRACKID NO EXISTE", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>105</SII:ESTADO><SII:GLOSA>TRACKID NO EXISTE</SII:GLOSA></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const result = parseReenvioCorreo(wrapSoap("reenvioCorreoReturn", inner));
    expect(result.estado).toBe("105");
    expect(result.glosa).toBe("TRACKID NO EXISTE");
  });
});

describe("parseAuthWsRespuesta", () => {
  it("getSeedReturn expone la SEMILLA (estado 00)", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>00</ESTADO></SII:RESP_HDR><SII:RESP_BODY><SEMILLA>000000000078</SEMILLA></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseAuthWsRespuesta(wrapSoap("getSeedReturn", inner), "getSeedReturn");
    expect(result.estado).toBe("00");
    expect(result.semilla).toBe("000000000078");
  });

  it("getTokenReturn expone el TOKEN (estado 00 con glosa Token Creado)", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>00</ESTADO><GLOSA>Token Creado</GLOSA></SII:RESP_HDR><SII:RESP_BODY><TOKEN>XAuSbYXiNh9Ik</TOKEN></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseAuthWsRespuesta(wrapSoap("getTokenReturn", inner), "getTokenReturn");
    expect(result.estado).toBe("00");
    expect(result.token).toBe("XAuSbYXiNh9Ik");
  });

  it("estado 08 con glosa TIME-OUT DEL SEED", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><ESTADO>08</ESTADO><GLOSA>TIME-OUT DEL SEED</GLOSA></SII:RESP_HDR></SII:RESPUESTA>`;
    const result = parseAuthWsRespuesta(wrapSoap("getTokenReturn", inner), "getTokenReturn");
    expect(result.estado).toBe("08");
    expect(result.glosa).toBe("TIME-OUT DEL SEED");
  });
});

describe("formatDateSiiDdMmYyyy", () => {
  it("convierte YYYY-MM-DD a DD-MM-AAAA", () => {
    expect(formatDateSiiDdMmYyyy("2003-09-08")).toBe("08-09-2003");
  });

  it("lanza con formato invalido", () => {
    expect(() => formatDateSiiDdMmYyyy("08/09/2003")).toThrow("Formato de fecha invalido");
  });
});

describe("DTEWS_PATHS", () => {
  it("expone los paths de los 5 WS de certificación", () => {
    expect(DTEWS_PATHS.CR_SEED).toBe("/DTEWS/CrSeed.jws");
    expect(DTEWS_PATHS.GET_TOKEN_FROM_SEED).toBe("/DTEWS/GetTokenFromSeed.jws");
    expect(DTEWS_PATHS.QUERY_EST_UP).toBe("/DTEWS/QueryEstUp.jws");
    expect(DTEWS_PATHS.QUERY_EST_DTE_AV).toBe("/DTEWS/QueryEstDteAv.jws");
    expect(DTEWS_PATHS.WS_DTE_CORREO).toBe("/DTEWS/wsDTECorreo.jws");
  });
});
