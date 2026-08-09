import { describe, it, expect } from "vitest";
import { buildDteXml } from "../domain/dte-xml";
import { DTE_TIPO } from "../domain/sii-dte";
import type { DteDocumento } from "../domain/sii-dte";
import { CAMBIOS_DE_SUJETO, buscarCambioSujeto, buscarProductoCpcs } from "../domain/cambio-sujeto";

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

function facturaConRetencion(): DteDocumento {
  return {
    encabezado: {
      tipoDte: DTE_TIPO.FACTURA_COMPRA,
      folio: 1,
      fechaEmision: "2026-08-01",
      emisor: EMISOR,
      receptor: RECEPTOR,
      montoNeto: 100000,
      montoExento: 0,
      tasaIva: 0.19,
      montoIva: 19000,
      montoTotal: 119000,
      tasaImp: 5,
      montoImp: 950,
    },
    detalles: [{
      nombre: "Bovino en pie",
      cantidad: 10,
      precioUnitario: 10000,
      montoItem: 100000,
      indAgente: true,
      codigoItem: { tipoCodigo: "CPCS", valorCodigo: "3201" },
      unidadMedida: "KG",
      cantidadReferencia: 10,
      unidadMedidaReferencia: "UNID",
      codigoImpuestoAdicional: 32,
    }],
  };
}

describe("buildDteXml — agente retenedor (cambio de sujeto)", () => {
  it("emite IndAgente=R y el CdgItem CPCS en el detalle", () => {
    const xml = buildDteXml(facturaConRetencion());
    expect(xml).toContain("<IndAgente>R</IndAgente>");
    expect(xml).toContain("<CdgItem>");
    expect(xml).toContain("<TpoCodigo>CPCS</TpoCodigo>");
    expect(xml).toContain("<VlrCodigo>3201</VlrCodigo>");
  });

  it("emite UnmdItem, QtyRef/UnmdRef y CodImpAdic en el detalle", () => {
    const xml = buildDteXml(facturaConRetencion());
    expect(xml).toContain("<UnmdItem>KG</UnmdItem>");
    expect(xml).toContain("<QtyRef>10</QtyRef>");
    expect(xml).toContain("<UnmdRef>UNID</UnmdRef>");
    expect(xml).toContain("<CodImpAdic>32</CodImpAdic>");
  });

  it("emite TasaImp y MontoImp en Totales (retención del documento)", () => {
    const xml = buildDteXml(facturaConRetencion());
    expect(xml).toContain("<TasaImp>5</TasaImp>");
    expect(xml).toContain("<MontoImp>950</MontoImp>");
  });

  it("no emite campos de retención cuando no se declaran", () => {
    const xml = buildDteXml({
      encabezado: {
        tipoDte: DTE_TIPO.FACTURA_ELECTRONICA,
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
      detalles: [{ nombre: "Miel", cantidad: 1, precioUnitario: 100000, montoItem: 100000 }],
    });
    expect(xml).not.toContain("<IndAgente>");
    expect(xml).not.toContain("<CdgItem>");
    expect(xml).not.toContain("<CodImpAdic>");
    expect(xml).not.toContain("<TasaImp>");
    expect(xml).not.toContain("<MontoImp>");
  });

  it("el orden del detalle respeta el schema (NroLinDet, CdgItem, NmbItem, QtyRef, IndAgente, UnmdItem, QtyItem, MontoItem, CodImpAdic)", () => {
    const xml = buildDteXml(facturaConRetencion());
    const pos = (tag: string) => xml.indexOf(`<${tag}>`);
    expect(pos("NroLinDet")).toBeLessThan(pos("CdgItem"));
    expect(pos("CdgItem")).toBeLessThan(pos("NmbItem"));
    expect(pos("NmbItem")).toBeLessThan(pos("QtyRef"));
    expect(pos("QtyRef")).toBeLessThan(pos("IndAgente"));
    expect(pos("IndAgente")).toBeLessThan(pos("UnmdItem"));
    expect(pos("UnmdItem")).toBeLessThan(pos("QtyItem"));
    expect(pos("QtyItem")).toBeLessThan(pos("MontoItem"));
    expect(pos("MontoItem")).toBeLessThan(pos("CodImpAdic"));
  });
});

describe("CAMBIOS_DE_SUJETO (tabla anexa del instructivo)", () => {
  it("contiene los 16 cambios de sujeto del instructivo", () => {
    expect(CAMBIOS_DE_SUJETO).toHaveLength(16);
    const nombres = CAMBIOS_DE_SUJETO.map((cs) => cs.nombre);
    expect(nombres).toContain("Arroz");
    expect(nombres).toContain("Berries");
    expect(nombres).toContain("Ganado");
    expect(nombres).toContain("Productos Silvestres");
    expect(nombres).toContain("Pequeños Productores Agrícolas");
  });

  it("busca por código CPCS (3201 → Ganado, tasa 8%, retención total 321)", () => {
    const encontrado = buscarCambioSujeto("3201");
    expect(encontrado?.nombre).toBe("Ganado");
    expect(encontrado?.codigoRetencion).toBe(32);
    expect(encontrado?.codigoRetencionTotal).toBe(321);
    expect(encontrado?.tasaRetencion).toBe(8);
    expect(encontrado?.productos[0]?.unidadMedidaRef).toBe("UNID");
  });

  it("busca el producto por su código (4812 → berries, servicios de maquila)", () => {
    const encontrado = buscarProductoCpcs("4812");
    expect(encontrado?.cambioSujeto.nombre).toBe("Berries");
    expect(encontrado?.producto.nombre).toBe("Servicios de maquila");
    expect(encontrado?.cambioSujeto.tasaRetencion).toBe(14);
  });

  it("retorna undefined para códigos inexistentes", () => {
    expect(buscarCambioSujeto("9999")).toBeUndefined();
    expect(buscarProductoCpcs("9999")).toBeUndefined();
  });

  it("los códigos de retención total existen donde el instructivo los define", () => {
    // Con retención parcial: solo arroz, berries, especies, ganado, legumbres,
    // madera y trigo tienen código de retención total (3 dígitos).
    // Faenamiento (17), ventas de carne (18) y harina (19) no lo tienen.
    const conCodigoTotal = CAMBIOS_DE_SUJETO.filter((cs) => cs.codigoRetencionTotal !== undefined);
    expect(conCodigoTotal.map((cs) => cs.codigoRetencion)).toEqual([36, 48, 37, 32, 30, 33, 34]);
    for (const cs of conCodigoTotal) {
      expect(String(cs.codigoRetencionTotal)).toHaveLength(3);
    }
    const sinCodigoTotal = CAMBIOS_DE_SUJETO.filter((cs) => cs.tasaRetencion !== undefined && cs.codigoRetencionTotal === undefined);
    expect(sinCodigoTotal.map((cs) => cs.codigoRetencion)).toEqual([17, 18, 19]);
    // Cartones/chatarra/construcción/PPA/silvestres/prepago: retención total siempre, sin tasa
    const sinTasa = CAMBIOS_DE_SUJETO.filter((cs) => cs.tasaRetencion === undefined);
    expect(sinTasa.map((cs) => cs.nombre)).toEqual(expect.arrayContaining(["Cartones", "Chatarra", "Construcción"]));
  });
});
