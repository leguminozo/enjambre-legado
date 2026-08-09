import { describe, it, expect } from "vitest";
import {
  buildDteSetPruebas,
  buildSetPruebasEnvio,
  assertRutsReceptorDistintos,
  calcularMontoNotaCreditoDevolucion,
  calcularMontoNotaCreditoDiferencia,
  tasaIvaParaFecha,
  RUT_RECEPTOR_SII,
} from "../domain/set-pruebas";
import { buildDteXml } from "../domain/dte-xml";
import type { DteEmisor, DteDocumento } from "../domain/sii-dte";
import type { SetPruebasCaso } from "../domain/set-pruebas";

// Datos del DTE de ejemplo del manual del SII (Caso 4256-1)
const EMISOR: DteEmisor = {
  rut: "97975000-5",
  razonSocial: "RUT DE PRUEBA",
  giro: "Insumos de Computacion",
  direccion: "Teatinos 120, Piso 4",
  comuna: "Santiago",
  ciudad: "Santiago",
  actividadEconomica: 31341,
};

const CASO_4256: SetPruebasCaso = {
  numero: "4256-1",
  tipoDte: 33,
  folio: 27,
  fechaEmision: "2003-09-08",
  receptor: {
    rut: "8414240-9",
    razonSocial: "JORGE GONZALEZ LTDA",
    giro: "COMPUTACION",
    direccion: "SAN DIEGO 2222",
    comuna: "LA FLORIDA",
    ciudad: "SANTIAGO",
  },
  detalles: [
    { nombre: "Cajon AFECTO", cantidad: 139, precioUnitario: 1807, montoItem: 251173 },
    { nombre: "Relleno AFECTO", cantidad: 59, precioUnitario: 2967, montoItem: 175053 },
  ],
};

describe("tasaIvaParaFecha", () => {
  it("18% antes del 01/10/2003", () => {
    expect(tasaIvaParaFecha("2003-09-08")).toBe(0.18);
    expect(tasaIvaParaFecha("2003-09-30")).toBe(0.18);
  });

  it("19% desde el 01/10/2003", () => {
    expect(tasaIvaParaFecha("2003-10-01")).toBe(0.19);
    expect(tasaIvaParaFecha("2026-08-08")).toBe(0.19);
  });

  it("acepta la tasa explícita por sobre la fecha", () => {
    const doc = buildDteSetPruebas(CASO_4256, EMISOR, { tasaIVA: 0.19 });
    expect(doc.encabezado.tasaIva).toBe(0.19);
  });
});

describe("buildDteSetPruebas", () => {
  it("reproduce los montos del ejemplo del manual (Caso 4256-1)", () => {
    const doc = buildDteSetPruebas(CASO_4256, EMISOR);
    expect(doc.encabezado.montoNeto).toBe(426226);
    expect(doc.encabezado.montoIva).toBe(76720); // 18% al 08/09/2003
    expect(doc.encabezado.montoTotal).toBe(502946);
    expect(doc.encabezado.folio).toBe(27);
  });

  it("agrega la referencia SET/CASO como línea 1", () => {
    const doc = buildDteSetPruebas(CASO_4256, EMISOR);
    expect(doc.referencias).toHaveLength(1);
    expect(doc.referencias![0]!.tipoDocumento).toBe("SET");
    expect(doc.referencias![0]!.razonReferencia).toBe("CASO 4256-1");
    const xml = buildDteXml(doc);
    expect(xml).toContain("<NroLinRef>1</NroLinRef>");
    expect(xml).toContain("<TpoDocRef>SET</TpoDocRef>");
    expect(xml).toContain("<RazonRef>CASO 4256-1</RazonRef>");
    // La referencia SET no lleva FolioRef/FchRef (opcionales en el schema)
    expect(xml).not.toContain("<FolioRef>");
  });

  it("emite referencias adicionales después de la línea 1", () => {
    const caso: SetPruebasCaso = {
      ...CASO_4256,
      referenciasAdicionales: [{
        tipoDocumento: 33,
        folio: 26,
        fecha: "2003-08-01",
        razonReferencia: "FACTURA ORIGINAL",
      }],
    };
    const doc = buildDteSetPruebas(caso, EMISOR);
    const xml = buildDteXml(doc);
    expect(doc.referencias).toHaveLength(2);
    expect(doc.referencias![1]!.tipoDocumento).toBe(33);
    expect(xml.indexOf("<TpoDocRef>SET</TpoDocRef>")).toBeLessThan(xml.indexOf("<TpoDocRef>33</TpoDocRef>"));
    expect(xml).toContain("<FolioRef>26</FolioRef>");
  });

  it("lanza si el caso no trae líneas de detalle", () => {
    expect(() => buildDteSetPruebas({ ...CASO_4256, detalles: [] }, EMISOR))
      .toThrow("Caso 4256-1: el detalle no puede estar vacio");
  });
});

describe("notas de crédito del set", () => {
  it("devolución: precio unitario = precio de la factura original", () => {
    const monto = calcularMontoNotaCreditoDevolucion(10, 1807);
    expect(monto).toBe(18070);
  });

  it("diferencia de precio: la diferencia se aplica a todas las unidades", () => {
    const monto = calcularMontoNotaCreditoDiferencia(139, 1807, 1500);
    expect(monto).toBe(139 * 307);
  });
});

describe("assertRutsReceptorDistintos", () => {
  function docConRutReceptor(rut: string, folio: number): DteDocumento {
    const d = buildDteSetPruebas({ ...CASO_4256, folio, receptor: { ...CASO_4256.receptor, rut } }, EMISOR);
    return d;
  }

  it("acepta RUTs distintos", () => {
    expect(() => assertRutsReceptorDistintos([
      docConRutReceptor("8414240-9", 1),
      docConRutReceptor("11111111-1", 2),
    ])).not.toThrow();
  });

  it("lanza si un RUT se repite", () => {
    expect(() => assertRutsReceptorDistintos([
      docConRutReceptor("8414240-9", 1),
      docConRutReceptor("8414240-9", 2),
    ])).toThrow("RUT receptor 8414240-9 repetido");
  });
});

describe("buildSetPruebasEnvio", () => {
  it("construye un EnvioDTE único con carátula completa y en el orden entregado", () => {
    const doc1 = buildDteSetPruebas(CASO_4256, EMISOR, { tasaIVA: 0.18 });
    const doc2 = buildDteSetPruebas({ ...CASO_4256, numero: "4256-2", folio: 28 }, EMISOR, { tasaIVA: 0.18 });
    const xml = buildSetPruebasEnvio(
      [buildDteXml(doc1), buildDteXml(doc2)],
      EMISOR.rut,
      0,
      "2003-09-02",
      { rutEnvia: "7880442-4", tmstFirmaEnv: "2003-09-08T12:31:59" },
    );

    expect(xml).toContain("<EnvioDTE");
    expect(xml).toContain("<RutEmisor>97975000-5</RutEmisor>");
    expect(xml).toContain("<RutEnvia>7880442-4</RutEnvia>");
    expect(xml).toContain(`<RutReceptor>${RUT_RECEPTOR_SII}</RutReceptor>`);
    expect(xml).toContain("<TmstFirmaEnv>2003-09-08T12:31:59</TmstFirmaEnv>");
    expect(xml).toContain("<SubTotDTE>");
    expect(xml).toContain("<TpoDTE>33</TpoDTE>");
    expect(xml).toContain("<NroDTE>2</NroDTE>");
    expect(xml.indexOf("CASO 4256-1")).toBeLessThan(xml.indexOf("CASO 4256-2"));
  });
});
