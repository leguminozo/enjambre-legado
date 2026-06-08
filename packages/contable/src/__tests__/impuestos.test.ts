import { describe, it, expect } from "vitest";
import { IVA, calcularIVA, calcularNetoDesdeTotal, calcularTotal } from "../domain/impuestos";

describe("IVA constant", () => {
  it("is 19%", () => {
    expect(IVA).toBe(0.19);
  });
});

describe("calcularIVA", () => {
  it("calculates IVA from neto", () => {
    expect(calcularIVA(100000)).toBe(19000);
  });

  it("handles zero", () => {
    expect(calcularIVA(0)).toBe(0);
  });

  it("rounds to 4 decimals", () => {
    const result = calcularIVA(33333);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBe(6333.27);
  });
});

describe("calcularNetoDesdeTotal", () => {
  it("extracts neto from total with IVA", () => {
    expect(calcularNetoDesdeTotal(119000)).toBe(100000);
  });

  it("zero total = zero neto", () => {
    expect(calcularNetoDesdeTotal(0)).toBe(0);
  });
});

describe("calcularTotal", () => {
  it("calculates total from neto + auto IVA", () => {
    expect(calcularTotal(100000)).toBe(119000);
  });

  it("accepts explicit IVA", () => {
    expect(calcularTotal(100000, 5000)).toBe(105000);
  });

  it("throws on non-finite input", () => {
    expect(() => calcularTotal(NaN)).toThrow("Monto invalido");
    expect(() => calcularTotal(Infinity)).toThrow("Monto invalido");
  });
});
