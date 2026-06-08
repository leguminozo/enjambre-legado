import { describe, it, expect } from "vitest";
import { normalizarRUT, validarRUT, formatearRUT } from "../domain/rut";

describe("normalizarRUT", () => {
  it("strips dots and dashes", () => {
    expect(normalizarRUT("12.345.678-9")).toBe("123456789");
  });

  it("uppercases K", () => {
    expect(normalizarRUT("12345678-k")).toBe("12345678K");
  });

  it("handles already-normal input", () => {
    expect(normalizarRUT("12345678K")).toBe("12345678K");
  });
});

describe("validarRUT", () => {
  it("accepts valid RUTs", () => {
    expect(validarRUT("11111111-1")).toBe(true);
    expect(validarRUT("22222222-2")).toBe(true);
    expect(validarRUT("60803000-K")).toBe(true);
    expect(validarRUT("12345678-5")).toBe(true);
    expect(validarRUT("76350040-3")).toBe(true);
  });

  it("rejects invalid RUTs", () => {
    expect(validarRUT("12345678-0")).toBe(false);
    expect(validarRUT("76350040-1")).toBe(false);
  });

  it("rejects too-short input", () => {
    expect(validarRUT("1")).toBe(false);
    expect(validarRUT("")).toBe(false);
  });

  it("rejects non-numeric body", () => {
    expect(validarRUT("abc-9")).toBe(false);
  });

  it("works with formatted RUTs", () => {
    expect(validarRUT("76.350.040-3")).toBe(true);
  });
});

describe("formatearRUT", () => {
  it("formats with dots and dash", () => {
    expect(formatearRUT("76350040-1")).toBe("76.350.040-1");
  });

  it("formats from raw input", () => {
    expect(formatearRUT("76059780K")).toBe("76.059.780-K");
  });

  it("returns raw for too-short input", () => {
    expect(formatearRUT("1")).toBe("1");
  });
});
