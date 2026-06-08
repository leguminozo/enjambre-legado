import { describe, it, expect } from "vitest";
import { parseUberReceipt } from "../domain/uber-parser";

describe("parseUberReceipt", () => {
  it("parses a typical Uber receipt with CLP total", () => {
    const text = `
      Uber Business
      Trip ABC123
      Date: 15/03/2025
      Total $8.500
    `;
    const result = parseUberReceipt(text);
    expect(result).not.toBeNull();
    expect(result!.montoTotal).toBe(8500);
    expect(result!.montoExento).toBe(8500);
    expect(result!.montoNeto).toBe(0);
    expect(result!.montoIva).toBe(0);
    expect(result!.fechaEmision).toBe("2025-03-15");
    expect(result!.tripId).toBe("ABC123");
  });

  it("parses receipt with explicit CLP", () => {
    const text = `
      Uber Business
      Trip XYZ-789
      Total CLP 12.300
    `;
    const result = parseUberReceipt(text);
    expect(result).not.toBeNull();
    expect(result!.montoTotal).toBe(12300);
    expect(result!.tripId).toBe("XYZ-789");
  });

  it("calculates IVA when conIva=true", () => {
    const text = `
      Uber Business
      Trip 456
      Total $11.900
    `;
    const result = parseUberReceipt(text, {
      proveedorRut: "76059780-K",
      proveedorNombre: "UBER CHILE SPA",
      proveedorGiro: "TRANSPORTE",
      conIva: true,
    });
    expect(result).not.toBeNull();
    expect(result!.montoTotal).toBe(11900);
    expect(result!.montoNeto).toBe(10000);
    expect(result!.montoIva).toBe(1900);
    expect(result!.montoExento).toBe(0);
  });

  it("returns null when no total found", () => {
    expect(parseUberReceipt("Just some random text without amounts")).toBeNull();
  });

  it("uses current date when no date found", () => {
    const text = "Uber Trip 123 Total $5000";
    const result = parseUberReceipt(text);
    expect(result).not.toBeNull();
    const today = new Date().toISOString().slice(0, 10);
    expect(result!.fechaEmision).toBe(today);
  });

  it("handles ISO date format", () => {
    const text = "Uber Trip 123 Date: 2025-06-01 Total $5000";
    const result = parseUberReceipt(text);
    expect(result).not.toBeNull();
    expect(result!.fechaEmision).toBe("2025-06-01");
  });
});
