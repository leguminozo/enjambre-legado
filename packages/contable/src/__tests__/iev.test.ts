import { describe, it, expect } from "vitest";
import { buildIevVentasXml, buildIevComprasXml, buildIevResumen } from "../domain/iev";
import type { IevCaratula, IevDetalleVenta, IevDetalleCompra } from "../domain/iev";

const CARATULA: IevCaratula = {
  rutEmisor: "76350040-1",
  rutEnvia: "11111111-1",
  nroResol: 0,
  fchResol: "2026-08-01",
  periodoTributario: "2026-08",
  folioNotificacion: 1,
};

const DETALLE_VENTA: IevDetalleVenta = {
  tipoDoc: 33,
  folio: 1,
  fechaEmision: "2026-08-03",
  rutDoc: "8414240-9",
  razonSocialDoc: "JORGE GONZALEZ LTDA",
  montoExento: 0,
  montoNeto: 426226,
  montoIva: 76720,
  tasaIva: 18,
  montoTotal: 502946,
};

describe("buildIevVentasXml (formato v3.0)", () => {
  it("emite la carátula con RutEmisorLibro, ESPECIAL/TOTAL y FolioNotificacion 1", () => {
    const xml = buildIevVentasXml(CARATULA, [buildIevResumen([DETALLE_VENTA])[0]!], [DETALLE_VENTA]);
    expect(xml).toContain("<LibroVentaElectronico");
    expect(xml).toContain("<RutEmisorLibro>76350040-1</RutEmisorLibro>");
    expect(xml).toContain("<RutEnvia>11111111-1</RutEnvia>");
    expect(xml).toContain("<PeriodoTributario>2026-08</PeriodoTributario>");
    expect(xml).toContain("<FchResol>2026-08-01</FchResol>");
    expect(xml).toContain("<NroResol>0</NroResol>");
    expect(xml).toContain("<TipoOperacion>VENTA</TipoOperacion>");
    expect(xml).toContain("<TipoLibro>ESPECIAL</TipoLibro>");
    expect(xml).toContain("<TipoEnvio>TOTAL</TipoEnvio>");
    expect(xml).toContain("<FolioNotificacion>1</FolioNotificacion>");
  });

  it("no emite tags ajenos al formato v3.0 (RutEmisor/TmstFirmaEnv/TotIVA)", () => {
    const xml = buildIevVentasXml(CARATULA, [buildIevResumen([DETALLE_VENTA])[0]!], [DETALLE_VENTA]);
    expect(xml).not.toContain("<RutEmisor>");
    expect(xml).not.toContain("<TmstFirmaEnv>");
    expect(xml).not.toContain("<TotIVA>");
    expect(xml).not.toContain("<FolioDoc>");
    expect(xml).not.toContain("<FchEmis>");
    expect(xml).not.toContain("<RznSocDoc>");
  });

  it("emite el DetalleVenta con los tags de la tabla v3.0 (NroDoc/TasaImp/FchDoc/RUTDoc/RznSoc)", () => {
    const xml = buildIevVentasXml(CARATULA, [], [DETALLE_VENTA]);
    expect(xml).toContain("<TpoDoc>33</TpoDoc>");
    expect(xml).toContain("<NroDoc>1</NroDoc>");
    expect(xml).toContain("<TasaImp>18</TasaImp>");
    expect(xml).toContain("<FchDoc>2026-08-03</FchDoc>");
    expect(xml).toContain("<RUTDoc>8414240-9</RUTDoc>");
    expect(xml).toContain("<RznSoc>JORGE GONZALEZ LTDA</RznSoc>");
    expect(xml).toContain("<MntExe>0</MntExe>");
    expect(xml).toContain("<MntNeto>426226</MntNeto>");
    expect(xml).toContain("<MntIVA>76720</MntIVA>");
    expect(xml).toContain("<MntTotal>502946</MntTotal>");
  });

  it("resumen período con TotDoc/TotMntExe/TotMntNeto/TotMntIVA/TotMntTotal", () => {
    const xml = buildIevVentasXml(CARATULA, [buildIevResumen([DETALLE_VENTA])[0]!], [DETALLE_VENTA]);
    expect(xml).toContain("<TotalesPeriodo>");
    expect(xml).toContain("<TotDoc>1</TotDoc>");
    expect(xml).toContain("<TotMntNeto>426226</TotMntNeto>");
    expect(xml).toContain("<TotMntIVA>76720</TotMntIVA>");
    expect(xml).toContain("<TotMntTotal>502946</TotMntTotal>");
  });

  it("escapa la razón social", () => {
    const detalle = { ...DETALLE_VENTA, razonSocialDoc: "Miel & Cia" };
    const xml = buildIevVentasXml(CARATULA, [], [detalle]);
    expect(xml).toContain("<RznSoc>Miel &amp; Cia</RznSoc>");
  });

  it("lanza con periodo tributario invalido", () => {
    expect(() => buildIevVentasXml({ ...CARATULA, periodoTributario: "2026" }, [], []))
      .toThrow("Formato de periodo tributario invalido");
  });
});

describe("buildIevComprasXml (formato v3.0)", () => {
  it("emite LibroCompraElectronico con TipoOperacion COMPRA y FolioNotificacion 2", () => {
    const caratula: IevCaratula = { ...CARATULA, folioNotificacion: 2 };
    const detalle: IevDetalleCompra = {
      tipoDoc: 46,
      folio: 10,
      fechaEmision: "2026-08-04",
      rutDoc: "97975000-5",
      razonSocialDoc: "RUT DE PRUEBA",
      montoExento: 0,
      montoNeto: 100000,
      montoIva: 19000,
      tasaIva: 0.19,
      montoTotal: 119000,
    };
    const xml = buildIevComprasXml(caratula, buildIevResumen([detalle]), [detalle]);
    expect(xml).toContain("<LibroCompraElectronico");
    expect(xml).toContain("<RutEmisorLibro>76350040-1</RutEmisorLibro>");
    expect(xml).toContain("<TipoOperacion>COMPRA</TipoOperacion>");
    expect(xml).toContain("<FolioNotificacion>2</FolioNotificacion>");
    expect(xml).toContain("<DetalleCompra>");
    expect(xml).toContain("<NroDoc>10</NroDoc>");
    expect(xml).toContain("<TasaImp>19</TasaImp>");
    // v3.0 no lleva FchRecepcion
    expect(xml).not.toContain("<FchRecepcion>");
  });
});

describe("buildIevResumen", () => {
  it("totaliza por tipo de documento", () => {
    const resumen = buildIevResumen([
      DETALLE_VENTA,
      { ...DETALLE_VENTA, folio: 2, montoNeto: 1000, montoIva: 190, montoTotal: 1190 },
      { ...DETALLE_VENTA, tipoDoc: 61, folio: 3, montoNeto: 500, montoIva: 95, montoTotal: 595 },
    ]);
    expect(resumen).toHaveLength(2);
    const factura = resumen.find((r) => r.tipoDoc === 33)!;
    expect(factura.totDoc).toBe(2);
    expect(factura.totMntNeto).toBe(427226);
    expect(factura.totMntIva).toBe(76910);
    expect(factura.totMntTotal).toBe(504136);
    const nota = resumen.find((r) => r.tipoDoc === 61)!;
    expect(nota.totDoc).toBe(1);
    expect(nota.totMntTotal).toBe(595);
  });
});
