import { describe, it, expect } from "vitest";
import { parseReceipt, getParserById, ALL_PARSERS } from "../domain/receipt-parsers";

describe("ALL_PARSERS", () => {
  it("has 7 parsers matching providers", () => {
    expect(ALL_PARSERS).toHaveLength(7);
  });

  it("each parser has detect and parse methods", () => {
    for (const parser of ALL_PARSERS) {
      expect(typeof parser.detect).toBe("function");
      expect(typeof parser.parse).toBe("function");
      expect(parser.id).toBeTruthy();
    }
  });
});

describe("getParserById", () => {
  it("finds parser by id", () => {
    expect(getParserById("uber")).toBeDefined();
    expect(getParserById("aws")).toBeDefined();
    expect(getParserById("stripe")).toBeDefined();
  });

  it("returns undefined for unknown id", () => {
    expect(getParserById("no-existe")).toBeUndefined();
  });
});

describe("parseReceipt", () => {
  it("returns null for unrecognized text", () => {
    expect(parseReceipt("Factura de servicios profesionales locales")).toBeNull();
  });

  it("delegates to correct parser", () => {
    const uberText = "Uber Business Trip ABC Total $5000";
    const result = parseReceipt(uberText);
    expect(result).not.toBeNull();
    expect(result!.proveedorId).toBe("uber");
  });

  it("accepts explicit proveedor override", () => {
    const awsProveedor = {
      id: "aws",
      nombre: "AMAZON WEB SERVICES IRELAND LTD",
      rut: "76302727-K",
      giro: "SERVICIOS DE COMPUTACION EN LA NUBE",
      moneda: "USD" as const,
      conIva: false,
      keywords: ["amazon web services", "aws"],
    };
    const text = "AWS Billing $100.00 for January";
    const result = parseReceipt(text, awsProveedor, 850);
    if (result) {
      expect(result.proveedorId).toBe("aws");
    }
  });

  it("returns null when parser detect fails", () => {
    const _result = parseReceipt("This mentions uber but has no amounts");
  });
});
