import { describe, it, expect } from "vitest";
import { PROVEEDORES, getProveedorById, detectarProveedor, convertirALCLP } from "../domain/gasto-extranjero";

describe("PROVEEDORES", () => {
  it("has 12 providers", () => {
    expect(PROVEEDORES).toHaveLength(12);
  });

  it("every provider has required fields", () => {
    for (const p of PROVEEDORES) {
      expect(p.id).toBeTruthy();
      expect(p.nombre).toBeTruthy();
      expect(p.rut).toBeTruthy();
      expect(p.giro).toBeTruthy();
      expect(p.moneda).toMatch(/^(CLP|USD|EUR)$/);
      expect(p.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("getProveedorById", () => {
  it("finds existing provider", () => {
    const uber = getProveedorById("uber");
    expect(uber?.nombre).toBe("UBER CHILE SPA");
  });

  it("returns undefined for unknown id", () => {
    expect(getProveedorById("no-existe")).toBeUndefined();
  });
});

describe("detectarProveedor", () => {
  it("detects uber from text", () => {
    const result = detectarProveedor("Recibo de Uber Business viaje al aeropuerto");
    expect(result?.id).toBe("uber");
  });

  it("detects google ads from text", () => {
    const result = detectarProveedor("Google Ads Invoice for December 2024");
    expect(result?.id).toBe("google-ads");
  });

  it("detects aws from text", () => {
    const result = detectarProveedor("Amazon Web Services Ireland Ltd billing statement");
    expect(result?.id).toBe("aws");
  });

  it("returns undefined for unrecognized text", () => {
    expect(detectarProveedor("Factura de servicios profesionales")).toBeUndefined();
  });

  it("detects stripe from text (word-boundary fix prevents trip/stripe collision)", () => {
    const result = detectarProveedor("stripe fee for January 2025");
    expect(result?.id).toBe("stripe");
  });

  it("no longer matches uber 'trip' keyword inside 'stripe'", () => {
    const result = detectarProveedor("stripe payments receipt");
    expect(result?.id).toBe("stripe");
  });

  it("case-insensitive detection", () => {
    const result = detectarProveedor("HOSTINGER hosting plan renewal");
    expect(result?.id).toBe("hostinger");
  });
});

describe("convertirALCLP", () => {
  it("returns same amount for CLP", () => {
    expect(convertirALCLP(5000, "CLP", 800)).toBe(5000);
  });

  it("converts USD using tasa", () => {
    expect(convertirALCLP(100, "USD", 850)).toBe(85000);
  });

  it("converts EUR using tasa", () => {
    expect(convertirALCLP(100, "EUR", 920)).toBe(92000);
  });

  it("rounds result", () => {
    expect(convertirALCLP(99.99, "USD", 850.5)).toBe(85041);
  });
});
