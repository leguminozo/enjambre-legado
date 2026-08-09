import { describe, it, expect } from "vitest";
import { buildRespuestaDteXml } from "../domain/respuesta-dte";
import { GLOSA_ESTADO_RECEPCION_ENVIO, GLOSA_ESTADO_RECEPCION_DOC, GLOSA_ESTADO_RESULTADO } from "../domain/respuesta-dte";
import type { RecepcionEnvio, ResultadoDte, RespuestaDteCaratula } from "../domain/respuesta-dte";

const CARATULA: RespuestaDteCaratula = {
  rutResponde: "76350040-1",
  rutRecibe: "97975000-5",
  nroRespuesta: 1,
  contacto: "Contabilidad",
  correo: "contabilidad@enjambre.cl",
  fchRespuesta: "2026-08-08T12:00:00",
};

const RECEPCION: RecepcionEnvio = {
  nombreArchivo: "envio_76350040-1.xml",
  fechaRecepcion: "2026-08-08T11:30:00",
  codigoEnvio: 53292,
  idEnvio: "SetDoc",
  digestEnvio: "z4vLb55G61Q3156xX9/PiUR0d5A=",
  rutEmisor: "97975000-5",
  rutReceptor: "76350040-1",
  estadoRecepcionEnvio: 0,
  glosaEstadoRecepcionEnvio: GLOSA_ESTADO_RECEPCION_ENVIO[0]!,
  documentos: [{
    tipoDocumento: 33,
    folio: 27,
    fechaEmision: "2026-08-03",
    rutEmisor: "97975000-5",
    rutReceptor: "76350040-1",
    montoTotal: 502946,
    estadoRecepcionDoc: 0,
    glosaObservacion: GLOSA_ESTADO_RECEPCION_DOC[0]!,
  }],
};

const RESULTADO: ResultadoDte = {
  tipoDte: 33,
  folio: 27,
  fechaEmision: "2026-08-03",
  rutEmisor: "97975000-5",
  rutReceptor: "76350040-1",
  montoTotal: 502946,
  codigoEnvio: "53292",
  estado: 0,
  glosa: GLOSA_ESTADO_RESULTADO[0]!,
  codigoMotivo: 0,
};

describe("buildRespuestaDteXml", () => {
  it("emite la carátula completa (RutResponde/RutRecibe/NroRespuesta/NroDetalles/FchRespuesta)", () => {
    const xml = buildRespuestaDteXml(CARATULA, { recepciones: [RECEPCION] });
    expect(xml).toContain("<RespuestaDTE");
    expect(xml).toContain("<RutResponde>76350040-1</RutResponde>");
    expect(xml).toContain("<RutRecibe>97975000-5</RutRecibe>");
    expect(xml).toContain("<NroRespuesta>1</NroRespuesta>");
    expect(xml).toContain("<NroDetalles>1</NroDetalles>");
    expect(xml).toContain("<Contacto>Contabilidad</Contacto>");
    expect(xml).toContain("<Correo>contabilidad@enjambre.cl</Correo>");
    expect(xml).toContain("<FchRespuesta>2026-08-08T12:00:00</FchRespuesta>");
  });

  it("emite RecepcionEnvio con sus campos y la tabla de documentos", () => {
    const xml = buildRespuestaDteXml(CARATULA, { recepciones: [RECEPCION] });
    expect(xml).toContain("<NmbArchivo>envio_76350040-1.xml</NmbArchivo>");
    expect(xml).toContain("<FchRecep>2026-08-08T11:30:00</FchRecep>");
    expect(xml).toContain("<CodEnvio>53292</CodEnvio>");
    expect(xml).toContain("<IDEnvio>SetDoc</IDEnvio>");
    expect(xml).toContain("<DigestEnvio>z4vLb55G61Q3156xX9/PiUR0d5A=</DigestEnvio>");
    expect(xml).toContain("<EstadoRecepEnv>0</EstadoRecepEnv>");
    expect(xml).toContain("<GlosaEstadoRecepEnv>Envío Recibido Conforme</GlosaEstadoRecepEnv>");
    expect(xml).toContain("<NroDocumentos>1</NroDocumentos>");
    expect(xml).toContain("<Documentos>");
    expect(xml).toContain("<TipoDocumento>33</TipoDocumento>");
    expect(xml).toContain("<Folio>27</Folio>");
    expect(xml).toContain("<EstadoRecepDoc>0</EstadoRecepDoc>");
  });

  it("emite ResultadoDTE con Estado/Glosa/CodRchDsc", () => {
    const xml = buildRespuestaDteXml(CARATULA, { resultados: [RESULTADO] });
    expect(xml).toContain("<ResultadoDTE>");
    expect(xml).toContain("<TipoDTE>33</TipoDTE>");
    expect(xml).toContain("<CodEnvio>53292</CodEnvio>");
    expect(xml).toContain("<Estado>0</Estado>");
    expect(xml).toContain("<Glosa>ACEPTADO OK</Glosa>");
    expect(xml).toContain("<CodRchDsc>0</CodRchDsc>");
  });

  it("omite DigEnvio/Digest y Contacto cuando no vienen", () => {
    const sinOpcionales: RecepcionEnvio = { ...RECEPCION, digestEnvio: undefined, documentos: undefined };
    const caratulaSinContacto = { ...CARATULA, contacto: undefined, telefono: undefined, correo: undefined };
    const xml = buildRespuestaDteXml(caratulaSinContacto, { recepciones: [sinOpcionales] });
    expect(xml).not.toContain("<DigestEnvio>");
    expect(xml).not.toContain("<Contacto>");
    expect(xml).not.toContain("<Documentos>");
  });

  it("lanza si se usan recepciones y resultados a la vez (mensaje excluyente)", () => {
    expect(() => buildRespuestaDteXml(CARATULA, { recepciones: [RECEPCION], resultados: [RESULTADO] }))
      .toThrow("excluyente");
  });

  it("lanza si no hay ni recepciones ni resultados", () => {
    expect(() => buildRespuestaDteXml(CARATULA)).toThrow("al menos un envío o un documento");
  });
});
