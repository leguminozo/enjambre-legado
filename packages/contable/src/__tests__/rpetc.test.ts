import { describe, it, expect } from "vitest";
import {
  parseRecepcionAec,
  buildGetEstEnvioEnvelope,
  buildGetEstCesionEnvelope,
  buildGetEstCesionRelacEnvelope,
  parseGetEstEnvio,
  parseGetEstCesion,
  buildIngresarAceptacionReclamoEnvelope,
  buildListarEventosHistDocEnvelope,
  buildConsultarDocDteCedibleEnvelope,
  buildConsultarFechaRecepcionSiiEnvelope,
  parseRegistroReclamoRespuesta,
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
  RPETC_ENDPOINTS,
  REGISTRO_RECLAMO_URLS,
  RPETC_API_PATHS,
  RPETC_SCOPES,
} from "../domain/rpetc";

const NS = "http://DefaultNamespace";

describe("parseRecepcionAec", () => {
  it("parsea la respuesta OK con TRACKID (ejemplo del manual)", () => {
    const xml = `<?xml version="1.0"?><RECEPCIONAEC><RUTSENDER>1-9</RUTSENDER><RUTCOMPANY>88888888-8</RUTCOMPANY><FILE>AECautomOK.xml</FILE><TIMESTAMP>29-11-2006 14:50:13</TIMESTAMP><STATUS>0</STATUS><TRACKID>0000038936</TRACKID></RECEPCIONAEC>`;
    const result = parseRecepcionAec(xml);
    expect(result.estado).toBe("aceptado");
    expect(result.trackId).toBe("0000038936");
    expect(result.rutCompany).toBe("88888888-8");
    expect(result.archivo).toBe("AECautomOK.xml");
  });

  it("mapea errores: STATUS 1 = sin permiso, 5 = token inválido", () => {
    const sinPermiso = parseRecepcionAec('<RECEPCIONAEC><RUTSENDER>1-9</RUTSENDER><RUTCOMPANY>77777777-7</RUTCOMPANY><FILE>a.xml</FILE><TIMESTAMP>x</TIMESTAMP><STATUS>1</STATUS></RECEPCIONAEC>');
    expect(sinPermiso.estado).toBe("rechazado");
    expect(sinPermiso.glosa).toContain("permiso");

    const token = parseRecepcionAec('<RECEPCIONAEC><RUTSENDER>-</RUTSENDER><RUTCOMPANY>88888888-8</RUTCOMPANY><FILE>a.xml</FILE><TIMESTAMP>x</TIMESTAMP><STATUS>5</STATUS></RECEPCIONAEC>');
    expect(token.estado).toBe("rechazado");
    expect(token.glosa).toContain("TOKEN");
  });
});

describe("wsRPETCConsulta — sobres SOAP", () => {
  it("getEstEnvio lleva Token y TrackId", () => {
    const xml = buildGetEstEnvioEnvelope(NS, "token-x", "53292");
    expect(xml).toContain("<m:getEstEnvio xmlns:m=\"http://DefaultNamespace\">");
    expect(xml).toContain("<Token xsi:type=\"xsd:string\">token-x</Token>");
    expect(xml).toContain("<TrackId xsi:type=\"xsd:string\">53292</TrackId>");
  });

  it("getEstCesion lleva los 6 parámetros e incluye IdCesion opcional", () => {
    const xml = buildGetEstCesionEnvelope(NS, "token-x", "97975000", "5", 33, 27, "ABC123");
    expect(xml).toContain("<RutEmisor xsi:type=\"xsd:string\">97975000</RutEmisor>");
    expect(xml).toContain("<DVEmisor xsi:type=\"xsd:string\">5</DVEmisor>");
    expect(xml).toContain("<TipoDoc xsi:type=\"xsd:string\">33</TipoDoc>");
    expect(xml).toContain("<FolioDoc xsi:type=\"xsd:string\">27</FolioDoc>");
    expect(xml).toContain("<IdCesion xsi:type=\"xsd:string\">ABC123</IdCesion>");

    const sinId = buildGetEstCesionEnvelope(NS, "token-x", "97975000", "5", 33, 27);
    expect(sinId).not.toContain("<IdCesion");
  });

  it("getEstCesionRelac lleva RutEmpresa/DVEmpresa", () => {
    const xml = buildGetEstCesionRelacEnvelope(NS, "token-x", "97975000", "5", 33, 27, "76350040", "1");
    expect(xml).toContain("<RutEmpresa xsi:type=\"xsd:string\">76350040</RutEmpresa>");
    expect(xml).toContain("<DVEmpresa xsi:type=\"xsd:string\">1</DVEmpresa>");
  });
});

function wrapSoap(returnTag: string, innerXml: string): string {
  const escaped = innerXml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<soapenv:Body><ns1:r xmlns:ns1="x"><${returnTag} xsi:type="xsd:string">${escaped}</${returnTag}></ns1:r></soapenv:Body>`;
}

describe("wsRPETCConsulta — parsers", () => {
  it("getEstEnvio parsea ESTADO_ENVIO EOK (ejemplo del manual)", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><TRACKID>36322</TRACKID><ESTADO_ENVIO>EOK</ESTADO_ENVIO><DESC_ESTADO>Envio Aceptado</DESC_ESTADO></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseGetEstEnvio(wrapSoap("getEstEnvioReturn", inner));
    expect(result.estado).toBe("0");
    expect(result.trackId).toBe("36322");
    expect(result.estadoEnvio).toBe("EOK");
    expect(result.descEstado).toBe("Envio Aceptado");
  });

  it("getEstCesion parsea el tenedor y la última anotación", () => {
    const inner = `<?xml version="1.0" encoding="UTF-8"?><SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><RUT_TENEDOR>2-7</RUT_TENEDOR><FECHA_ULT_ANOT>2005-05-04 18:13:06</FECHA_ULT_ANOT><DEC_JURADA>EXISTE</DEC_JURADA></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseGetEstCesion(wrapSoap("getEstCesionReturn", inner));
    expect(result.estado).toBe("0");
    expect(result.rutTenedor).toBe("2-7");
    expect(result.fechaUltAnot).toBe("2005-05-04 18:13:06");
    expect(result.decJurada).toBe("EXISTE");
  });

  it("getEstCesion sin IdCesion expone la glosa Documento Cedido", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO><SII:GLOSA>Documento Cedido</SII:GLOSA></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const result = parseGetEstCesion(wrapSoap("getEstCesionReturn", inner));
    expect(result.estado).toBe("0");
    expect(result.glosa).toBe("Documento Cedido");
  });
});

describe("WSREGISTRORECLAMODTE — sobres y parser", () => {
  it("ingresarAceptacionReclamoDoc lleva los 5 parámetros + AccionDoc", () => {
    const xml = buildIngresarAceptacionReclamoEnvelope(NS, "token-x", "97975000", "5", 33, 27, "ACD");
    expect(xml).toContain("<m:ingresarAceptacionReclamoDoc");
    expect(xml).toContain("<Token xsi:type=\"xsd:string\">token-x</Token>");
    expect(xml).toContain("<RutEmisor xsi:type=\"xsd:string\">97975000</RutEmisor>");
    expect(xml).toContain("<DvEmisor xsi:type=\"xsd:string\">5</DvEmisor>");
    expect(xml).toContain("<TipoDoc xsi:type=\"xsd:string\">33</TipoDoc>");
    expect(xml).toContain("<Folio xsi:type=\"xsd:string\">27</Folio>");
    expect(xml).toContain("<AccionDoc xsi:type=\"xsd:string\">ACD</AccionDoc>");
  });

  it("los demás métodos llevan solo los 4 parámetros del documento", () => {
    const eventos = buildListarEventosHistDocEnvelope(NS, undefined, "97975000", "5", 33, 27);
    expect(eventos).toContain("<m:listarEventosHistDoc");
    expect(eventos).not.toContain("<Token");
    expect(eventos).toContain("<Folio xsi:type=\"xsd:string\">27</Folio>");

    const cedible = buildConsultarDocDteCedibleEnvelope(NS, undefined, "97975000", "5", 33, 27);
    expect(cedible).toContain("<m:consultarDocDteCedible");

    const fecha = buildConsultarFechaRecepcionSiiEnvelope(NS, undefined, "97975000", "5", 33, 27);
    expect(fecha).toContain("<m:consultarFechaRecepcionSii");
  });

  it("parsea código y descripción de respuesta", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><COD_RESP>1</COD_RESP><DESC_RESP>Acción Completada OK</DESC_RESP></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    const result = parseRegistroReclamoRespuesta(wrapSoap("ingresarAceptacionReclamoDocReturn", inner), "ingresarAceptacionReclamoDocReturn");
    expect(result.codigoRespuesta).toBe("1");
    expect(result.descripcionRespuesta).toBe("Acción Completada OK");
  });

  it("parsea la fecha de recepción SII", () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><COD_RESP>0</COD_RESP></SII:RESP_HDR><SII:RESP_BODY><FECHA_RECEPCION>2026-08-05 10:00:00</FECHA_RECEPCION></SII:RESP_BODY></SII:RESPUESTA>`;
    const result = parseRegistroReclamoRespuesta(wrapSoap("consultarFechaRecepcionSiiReturn", inner), "consultarFechaRecepcionSiiReturn");
    expect(result.fechaRecepcionSii).toBe("2026-08-05 10:00:00");
  });
});

describe("API-RPETC — JWT y token", () => {
  it("base64urlEncode codifica sin padding y con caracteres seguros", () => {
    expect(base64urlEncode('{"alg":"RS256"}')).toBe("eyJhbGciOiJSUzI1NiJ9");
    // bytes con + y / en base64 → - y _ ; sin "=" de padding
    expect(base64urlEncode("\u00fb\u00ff\u00fe")).toBe("w7vDv8O-");
    expect(base64urlEncode('{"aio":"8315495"}')).not.toMatch(/[=+/]/);
  });

  it("el header lleva x5c en base64 estándar (no url, con padding)", () => {
    const header = JSON.parse(buildRpetcJwtHeader("MIIGbjCCBVagAwIBAgIDBnVcMA0+8==")) as { alg: string; x5c: string };
    expect(header.alg).toBe("RS256");
    expect(header.x5c).toBe("MIIGbjCCBVagAwIBAgIDBnVcMA0+8==");
    expect(header.x5c).toContain("+");
    expect(header.x5c).toContain("=");
  });

  it("el payload lleva aio/exp/aud", () => {
    const payload = JSON.parse(buildRpetcJwtPayload("8315495", 1760629427, "https://apicert.sii.cl/oauthsii-v1-ms/extauth/v1/token")) as {
      aio: string;
      exp: number;
      aud: string;
    };
    expect(payload.aio).toBe("8315495");
    expect(payload.exp).toBe(1760629427);
    expect(payload.aud).toContain("apicert.sii.cl");
  });

  it("assembla el JWT en tres secciones", () => {
    const h = base64urlEncode(buildRpetcJwtHeader("c"));
    const p = base64urlEncode(buildRpetcJwtPayload("1", 2, "u"));
    const jwt = assembleJwt(h, p, "firma");
    expect(jwt.split(".")).toHaveLength(3);
    expect(buildJwtSigningInput(h, p)).toBe(`${h}.${p}`);
  });

  it("parsea la respuesta de token y valida access_token", () => {
    const parsed = parseRpetcTokenResponse({
      access_token: "31ad0f2f-72b4-4685-a041-b0d13f4d949f",
      token_type: "Bearer",
      expires_in: 1763040967,
      refresh_token: "b11b9b1d-3a34-4cdf-a602-ea0b9f3c1c3b",
      scope: RPETC_SCOPES,
    });
    expect(parsed.accessToken).toBe("31ad0f2f-72b4-4685-a041-b0d13f4d949f");
    expect(parsed.refreshToken).toBe("b11b9b1d-3a34-4cdf-a602-ea0b9f3c1c3b");
    expect(parsed.scope).toContain("RTC_TAR");
  });

  it("lanza si la respuesta no trae access_token", () => {
    expect(() => parseRpetcTokenResponse({ error: "invalid_grant" })).toThrow("sin access_token");
  });

  it("construye las rutas de tareas y consultas", () => {
    expect(buildRpetcTareaPath("8315495", "0", "cesiones", "deudor"))
      .toBe("/api/api-rpetc/recurso/v1/tarea/8315495-0/cesiones.deudor");
    expect(buildRpetcTareaPath("8315495", "0", "certificados", "cedente"))
      .toBe("/api/api-rpetc/recurso/v1/tarea/8315495-0/certificados.cesiones.cedente");
    expect(buildRpetcResultadoPath("8315495", "0", "t1"))
      .toBe("/api/api-rpetc/recurso/v1/resultado/8315495-0/t1");
    expect(buildRpetcEstadoTareaPath("8315495", "0", "t1"))
      .toBe("/api/api-rpetc/recurso/v1/estado/8315495-0/t1");
    expect(buildRpetcEstadosPath("8315495", "0"))
      .toBe("/api/api-rpetc/recurso/v1/estados/8315495-0");
    expect(buildRpetcEstadosPath("8315495", "0", "2026-08"))
      .toBe("/api/api-rpetc/recurso/v1/estados/8315495-0/periodo/2026-08");
  });
});

describe("endpoints RPETC", () => {
  it("expone los paths de upload y consulta, URLs de reclamo y API", () => {
    expect(RPETC_ENDPOINTS.AEC_UPLOAD).toBe("/cgi_rtc/RTC/RTCAnotEnvio.cgi");
    expect(RPETC_ENDPOINTS.WS_RPETC_CONSULTA).toBe("/DTEWS/services/wsRPETCConsulta");
    expect(REGISTRO_RECLAMO_URLS.CERTIFICACION).toContain("ws2.sii.cl");
    expect(REGISTRO_RECLAMO_URLS.PRODUCCION).toContain("ws1.sii.cl");
    expect(RPETC_API_PATHS.TOKEN).toContain("/oauthsii-v1-ms/extauth/v1/token");
    expect(RPETC_API_PATHS.TOKEN_REFRESH).toContain("/authorization/v1/token");
  });
});
