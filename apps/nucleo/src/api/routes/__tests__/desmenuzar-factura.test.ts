import { describe, it, expect } from "vitest";
import {
  parseDteXml,
  parseHeuristicText,
  desmenuzarDocumento,
} from "../logistica/desmenuzar-factura";

describe("Desmenuzar Factura - Extractor DTE e Insumos", () => {
  const mockDteXml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DTE-33-48192">
    <Encabezado>
      <IdDoc>
        <TipoDTE>33</TipoDTE>
        <Folio>48192</Folio>
        <FchEmis>2026-09-14</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>76.452.123-9</RUTEmisor>
        <RznSoc>Envases Vidrio del Sur SpA</RznSoc>
        <GiroEmis>Fabricación de envases de vidrio</GiroEmis>
      </Emisor>
      <Totales>
        <MntNeto>465000</MntNeto>
        <IVA>88350</IVA>
        <MntTotal>553350</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
      <NroLinDet>1</NroLinDet>
      <NmbItem>Frasco Vidrio Hexagonal 500g</NmbItem>
      <QtyItem>1000</QtyItem>
      <PrcItem>380</PrcItem>
      <MontoItem>380000</MontoItem>
    </Detalle>
    <Detalle>
      <NroLinDet>2</NroLinDet>
      <NmbItem>Tapa Twist-Off 63mm Dorada</NmbItem>
      <QtyItem>1000</QtyItem>
      <PrcItem>85</PrcItem>
      <MontoItem>85000</MontoItem>
    </Detalle>
  </Documento>
</DTE>`;

  it("extrae de forma determinista y exacta todos los datos de un DTE XML chileno", () => {
    const res = parseDteXml(mockDteXml);
    expect(res).not.toBeNull();
    expect(res?.metodo_extraccion).toBe("xml_dte");
    expect(res?.proveedor_nombre).toBe("Envases Vidrio del Sur SpA");
    expect(res?.proveedor_rut).toBe("76.452.123-9");
    expect(res?.folio).toBe("48192");
    expect(res?.fecha).toBe("2026-09-14");
    expect(res?.monto_neto).toBe(465000);
    expect(res?.monto_total).toBe(553350);

    expect(res?.lineas).toHaveLength(2);
    expect(res?.lineas[0]).toEqual({
      nombre: "Frasco Vidrio Hexagonal 500g",
      cantidad: 1000,
      precio_unitario: 380,
      total: 380000,
    });
    expect(res?.lineas[1]).toEqual({
      nombre: "Tapa Twist-Off 63mm Dorada",
      cantidad: 1000,
      precio_unitario: 85,
      total: 85000,
    });
  });

  it("retorna null si el XML no contiene estructura tributaria", () => {
    const invalidXml = "<root><data>hola</data></root>";
    const res = parseDteXml(invalidXml);
    expect(res).toBeNull();
  });

  it("extrae líneas mediante heurística cuando se proporciona texto plano", () => {
    const plainText = `
      Factura Electrónica N°: 9941
      RUT: 77.890.123-4
      Fecha: 2026-08-20
      Detalle:
      Caja Kraft Master 20 1200 24000
      Etiquetas Adhesivas 500g 2000 95 190000
    `;

    const res = parseHeuristicText(plainText);
    expect(res.metodo_extraccion).toBe("heuristica");
    expect(res.folio).toBe("9941");
    expect(res.proveedor_rut).toBe("77890123-4");
    expect(res.fecha).toBe("2026-08-20");
    expect(res.lineas.length).toBeGreaterThan(0);
  });

  it("desmenuzarDocumento procesa un buffer XML DTE directamente", async () => {
    const buffer = Buffer.from(mockDteXml, "utf-8");
    const res = await desmenuzarDocumento("factura_electronica.xml", "application/xml", buffer);

    expect(res.metodo_extraccion).toBe("xml_dte");
    expect(res.folio).toBe("48192");
    expect(res.lineas).toHaveLength(2);
    expect(res.lineas[0].precio_unitario).toBe(380);
  });
});
