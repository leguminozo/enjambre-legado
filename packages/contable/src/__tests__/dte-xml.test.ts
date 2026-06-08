import { describe, it, expect } from "vitest";
import { buildDteXml, buildEnvioDteXml } from "../domain/dte-xml";
import type { DteDocumento } from "../domain/sii-dte";
import { DTE_TIPO } from "../domain/sii-dte";

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

const FACTURA_DOC: DteDocumento = {
  encabezado: {
    tipoDte: DTE_TIPO.FACTURA_ELECTRONICA,
    folio: 123,
    fechaEmision: "2025-01-15",
    emisor: EMISOR,
    receptor: RECEPTOR,
    montoNeto: 100000,
    montoExento: 0,
    tasaIva: 19,
    montoIva: 19000,
    montoTotal: 119000,
  },
  detalles: [
    { nombre: "Miel 500g", cantidad: 2, precioUnitario: 50000, montoItem: 100000 },
  ],
};

describe("buildDteXml", () => {
  it("produces valid XML structure", () => {
    const xml = buildDteXml(FACTURA_DOC);
    expect(xml).toContain("<?xml version=\"1.0\"");
    expect(xml).toContain("<DTE xmlns=\"http://www.sii.cl/SiiDte\"");
    expect(xml).toContain("<TipoDTE>33</TipoDTE>");
    expect(xml).toContain("<Folio>123</Folio>");
    expect(xml).toContain("<FchEmis>2025-01-15</FchEmis>");
  });

  it("includes emisor and receptor", () => {
    const xml = buildDteXml(FACTURA_DOC);
    expect(xml).toContain("<RUTEmisor>76350040-1</RUTEmisor>");
    expect(xml).toContain("<RznSoc>Enjambre SpA</RznSoc>");
    expect(xml).toContain("<RUTRecep>60803000-K</RUTRecep>");
  });

  it("includes totals", () => {
    const xml = buildDteXml(FACTURA_DOC);
    expect(xml).toContain("<MntNeto>100000</MntNeto>");
    expect(xml).toContain("<TasaIVA>19</TasaIVA>");
    expect(xml).toContain("<IVA>19000</IVA>");
    expect(xml).toContain("<MntTotal>119000</MntTotal>");
  });

  it("includes detalle items", () => {
    const xml = buildDteXml(FACTURA_DOC);
    expect(xml).toContain("<NmbItem>Miel 500g</NmbItem>");
    expect(xml).toContain("<QtyItem>2</QtyItem>");
    expect(xml).toContain("<MontoItem>100000</MontoItem>");
  });

  it("escapes XML special characters", () => {
    const doc: DteDocumento = {
      ...FACTURA_DOC,
      detalles: [{ nombre: "Miel & Propoleo <Especial>", cantidad: 1, precioUnitario: 10000, montoItem: 10000 }],
    };
    const xml = buildDteXml(doc);
    expect(xml).toContain("Miel &amp; Propoleo &lt;Especial&gt;");
    expect(xml).not.toContain("Miel & Propoleo");
  });

  it("omits MntNeto and TasaIVA when montoNeto is 0", () => {
    const doc: DteDocumento = {
      encabezado: { ...FACTURA_DOC.encabezado, montoNeto: 0, montoIva: 0, montoExento: 50000, montoTotal: 50000, tipoDte: DTE_TIPO.BOLETA_NO_AFECTA },
      detalles: [{ nombre: "Item exento", cantidad: 1, precioUnitario: 50000, montoItem: 50000 }],
    };
    const xml = buildDteXml(doc);
    expect(xml).toContain("<MntExe>50000</MntExe>");
    expect(xml).not.toContain("<MntNeto>");
    expect(xml).not.toContain("<TasaIVA>");
  });

  it("includes referencias when present", () => {
    const doc: DteDocumento = {
      ...FACTURA_DOC,
      referencias: [
        { tipoDocumento: 33, folio: 100, fecha: "2025-01-01", razonReferencia: "Anula factura" },
      ],
    };
    const xml = buildDteXml(doc);
    expect(xml).toContain("<TpoDocRef>33</TpoDocRef>");
    expect(xml).toContain("<FolioRef>100</FolioRef>");
    expect(xml).toContain("<RazonRef>Anula factura</RazonRef>");
  });

  it("includes IndServicio for factura electronica", () => {
    const xml = buildDteXml(FACTURA_DOC);
    expect(xml).toContain("<IndServicio>3</IndServicio>");
  });

  it("includes IndTraslado for guia de despacho", () => {
    const doc: DteDocumento = {
      encabezado: { ...FACTURA_DOC.encabezado, tipoDte: DTE_TIPO.GUIA_DESPACHO },
      detalles: FACTURA_DOC.detalles,
    };
    const xml = buildDteXml(doc);
    expect(xml).toContain("<IndTraslado>1</IndTraslado>");
  });

  it("throws on invalid date format", () => {
    const doc: DteDocumento = {
      ...FACTURA_DOC,
      encabezado: { ...FACTURA_DOC.encabezado, fechaEmision: "not-a-date" },
    };
    expect(() => buildDteXml(doc)).toThrow("Formato de fecha invalido");
  });
});

describe("buildEnvioDteXml", () => {
  it("wraps DTEs in EnvioDTE", () => {
    const dteXml = buildDteXml(FACTURA_DOC);
    const envio = buildEnvioDteXml([dteXml], "76350040-1", 1024, "2024-12-01");
    expect(envio).toContain("<EnvioDTE");
    expect(envio).toContain("<RutEmisor>76350040-1</RutEmisor>");
    expect(envio).toContain("<NroResol>1024</NroResol>");
    expect(envio).toContain("<FchResol>2024-12-01</FchResol>");
  });
});
