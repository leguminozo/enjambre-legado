import { describe, expect, it, vi, afterEach } from "vitest";
import {
  enviarAec,
  consultarEstadoEnvioRpetc,
  consultarCesionRpetc,
  consultarCesionRelacionadaRpetc,
  ingresarAceptacionReclamo,
  listarEventosHistDoc,
  consultarDocDteCedible,
  consultarFechaRecepcionSii,
} from "./rpetc-client";

afterEach(() => {
  vi.restoreAllMocks();
});

function wrapSoap(returnTag: string, innerXml: string): string {
  const escaped = innerXml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ns1:r xmlns:ns1="x"><${returnTag} xsi:type="xsd:string">${escaped}</${returnTag}></ns1:r></soapenv:Body></soapenv:Envelope>`;
}

describe("enviarAec", () => {
  it("arma el multipart con emailNotif/rutCompany/dvCompany/archivo y parsea el TRACKID", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0"?><RECEPCIONAEC><RUTSENDER>1-9</RUTSENDER><RUTCOMPANY>88888888-8</RUTCOMPANY><FILE>AECautomOK.xml</FILE><TIMESTAMP>29-11-2006 14:50:13</TIMESTAMP><STATUS>0</STATUS><TRACKID>0000038936</TRACKID></RECEPCIONAEC>`,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await enviarAec("CERTIFICACION", "token-x", "<AEC/>", "88888888-8", "correo@empresa.cl");

    expect(result.estado).toBe("aceptado");
    expect(result.trackId).toBe("0000038936");

    const url = fetchMock.mock.calls[0]![0] as string;
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(url).toContain("/cgi_rtc/RTC/RTCAnotEnvio.cgi");
    expect((init.headers as Record<string, string>).Cookie).toBe("TOKEN=token-x");
    const body = init.body as FormData;
    expect(body.get("emailNotif")).toBe("correo@empresa.cl");
    expect(body.get("rutCompany")).toBe("88888888");
    expect(body.get("dvCompany")).toBe("8");
    expect((body.get("archivo") as File).name).toMatch(/^aec_88888888-8_\d+\.xml$/);
  });

  it("errores HTTP se devuelven como estado error", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    const result = await enviarAec("CERTIFICACION", "token-x", "<AEC/>", "88888888-8", "c@e.cl");
    expect(result.estado).toBe("error");
    expect(result.glosa).toContain("500");
  });
});

describe("consultarEstadoEnvioRpetc (getEstEnvio)", () => {
  it("consulta por TrackId y parsea ESTADO_ENVIO EOK", async () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><TRACKID>36322</TRACKID><ESTADO_ENVIO>EOK</ESTADO_ENVIO><DESC_ESTADO>Envio Aceptado</DESC_ESTADO></SII:RESP_BODY></SII:RESPUESTA>`;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getEstEnvioReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await consultarEstadoEnvioRpetc("CERTIFICACION", "token-x", "36322");
    expect(result.estadoEnvio).toBe("EOK");
    expect(result.descEstado).toBe("Envio Aceptado");

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toContain("/DTEWS/services/wsRPETCConsulta");
    expect(body).toContain("<m:getEstEnvio");
    expect(body).toContain("<TrackId xsi:type=\"xsd:string\">36322</TrackId>");
  });
});

describe("consultarCesionRpetc (getEstCesion)", () => {
  it("parsea el tenedor actual y la última anotación", async () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><RUT_TENEDOR>2-7</RUT_TENEDOR><FECHA_ULT_ANOT>2005-05-04 18:13:06</FECHA_ULT_ANOT><DEC_JURADA>EXISTE</DEC_JURADA></SII:RESP_BODY></SII:RESPUESTA>`;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getEstCesionReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await consultarCesionRpetc("CERTIFICACION", "token-x", "97975000-5", 33, 27, "ABC123");
    expect(result.rutTenedor).toBe("2-7");
    expect(result.decJurada).toBe("EXISTE");

    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(body).toContain("<m:getEstCesion");
    expect(body).toContain("<IdCesion xsi:type=\"xsd:string\">ABC123</IdCesion>");
  });
});

describe("consultarCesionRelacionadaRpetc (getEstCesionRelac)", () => {
  it("envía RutEmpresa/DVEmpresa del vinculado", async () => {
    const inner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><SII:ESTADO>0</SII:ESTADO></SII:RESP_HDR><SII:RESP_BODY><RUT_TENEDOR>76350040-1</RUT_TENEDOR></SII:RESP_BODY></SII:RESPUESTA>`;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("getEstCesionRelacReturn", inner) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await consultarCesionRelacionadaRpetc("CERTIFICACION", "token-x", "97975000-5", 33, 27, "76350040-1");
    expect(result.rutTenedor).toBe("76350040-1");

    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(body).toContain("<m:getEstCesionRelac");
    expect(body).toContain("<RutEmpresa xsi:type=\"xsd:string\">76350040</RutEmpresa>");
    expect(body).toContain("<DVEmpresa xsi:type=\"xsd:string\">1</DVEmpresa>");
  });
});

describe("WSREGISTRORECLAMODTE", () => {
  const innerOk = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><COD_RESP>1</COD_RESP><DESC_RESP>Acción Completada OK</DESC_RESP></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;

  it("ingresarAceptacionReclamo envía el método con AccionDoc y parsea la respuesta", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("ingresarAceptacionReclamoDocReturn", innerOk) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await ingresarAceptacionReclamo("CERTIFICACION", "token-x", "97975000-5", 33, 27, "ACD");
    expect(result.codigoRespuesta).toBe("1");
    expect(result.descripcionRespuesta).toBe("Acción Completada OK");

    const url = fetchMock.mock.calls[0]![0] as string;
    const body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(url).toContain("ws2.sii.cl/WSREGISTRORECLAMODTECERT");
    expect(body).toContain("<m:ingresarAceptacionReclamoDoc");
    expect(body).toContain("<AccionDoc xsi:type=\"xsd:string\">ACD</AccionDoc>");
  });

  it("listarEventosHistDoc, consultarDocDteCedible y consultarFechaRecepcionSii usan el endpoint correcto", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => wrapSoap("listarEventosHistDocReturn", innerOk) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await listarEventosHistDoc("CERTIFICACION", undefined, "97975000-5", 33, 27);
    let body = String((fetchMock.mock.calls[0]![1] as RequestInit).body);
    expect(body).toContain("<m:listarEventosHistDoc");
    expect(body).not.toContain("<Token");

    const cedibleInner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><COD_RESP>23</COD_RESP><DESC_RESP>DTE Cedible, sin reclamos</DESC_RESP></SII:RESP_HDR><SII:RESP_BODY/></SII:RESPUESTA>`;
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("consultarDocDteCedibleReturn", cedibleInner) });
    const cedible = await consultarDocDteCedible("CERTIFICACION", undefined, "97975000-5", 33, 27);
    expect(cedible.codigoRespuesta).toBe("23");
    body = String((fetchMock.mock.calls[1]![1] as RequestInit).body);
    expect(body).toContain("<m:consultarDocDteCedible");

    const fechaInner = `<SII:RESPUESTA xmlns:SII="http://www.sii.cl/XMLSchema"><SII:RESP_HDR><COD_RESP>0</COD_RESP></SII:RESP_HDR><SII:RESP_BODY><FECHA_RECEPCION>2026-08-05 10:00:00</FECHA_RECEPCION></SII:RESP_BODY></SII:RESPUESTA>`;
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => wrapSoap("consultarFechaRecepcionSiiReturn", fechaInner) });
    const fecha = await consultarFechaRecepcionSii("CERTIFICACION", undefined, "97975000-5", 33, 27);
    expect(fecha.fechaRecepcionSii).toBe("2026-08-05 10:00:00");
    body = String((fetchMock.mock.calls[2]![1] as RequestInit).body);
    expect(body).toContain("<m:consultarFechaRecepcionSii");
  });
});
