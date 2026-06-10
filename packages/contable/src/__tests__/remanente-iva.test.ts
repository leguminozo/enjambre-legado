import { describe, it, expect } from "vitest";
import { calcularReajusteRemanente, calcularRemanenteProximo } from "../domain/remanente-iva";

describe("calcularReajusteRemanente", () => {
  it("reajusta remanente usando factor UTM", () => {
    const result = calcularReajusteRemanente(100000, 68000, 70000);
    const expectedFactor = 70000 / 68000;
    const expectedMonto = Math.round(100000 * expectedFactor);
    expect(result.factorUTM).toBeCloseTo(expectedFactor, 10);
    expect(result.montoReajustado).toBe(expectedMonto);
  });

  it("factor 1 cuando UTM periodo anterior es 0", () => {
    const result = calcularReajusteRemanente(50000, 0, 70000);
    expect(result.factorUTM).toBe(1);
    expect(result.montoReajustado).toBe(50000);
  });

  it("factor 1 cuando remanente anterior es 0", () => {
    const result = calcularReajusteRemanente(0, 68000, 70000);
    expect(result.factorUTM).toBe(1);
    expect(result.montoReajustado).toBe(0);
  });

  it("UTM igual = sin reajuste", () => {
    const result = calcularReajusteRemanente(200000, 68000, 68000);
    expect(result.factorUTM).toBe(1);
    expect(result.montoReajustado).toBe(200000);
  });

  it("UTM aumento 2.94% reajusta correctamente", () => {
    const utmAnterior = 68000;
    const utmActual = 70000;
    const result = calcularReajusteRemanente(150000, utmAnterior, utmActual);
    const expectedFactor = utmActual / utmAnterior;
    expect(result.montoReajustado).toBe(Math.round(150000 * expectedFactor));
    expect(result.factorUTM).toBeCloseTo(1.0294, 3);
  });

  it("redondea al entero mas cercano", () => {
    const result = calcularReajusteRemanente(99999, 68000, 69999);
    expect(Number.isInteger(result.montoReajustado)).toBe(true);
  });
});

describe("calcularRemanenteProximo", () => {
  it("debito > credito = IVA pagar, sin remanente", () => {
    const result = calcularRemanenteProximo(200000, 100000, 30000);
    expect(result.ivaPagar).toBe(200000 - 100000 - 30000);
    expect(result.remanenteProximo).toBe(0);
  });

  it("credito total > debito = remanente proximo, sin IVA", () => {
    const creditoTotal = 100000;
    const remanente = 50000;
    const debito = 120000;
    const result = calcularRemanenteProximo(debito, creditoTotal, remanente);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximo).toBe(creditoTotal + remanente - debito);
  });

  it("debito == credito total = cero ambos", () => {
    const result = calcularRemanenteProximo(150000, 100000, 50000);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximo).toBe(0);
  });

  it("sin remanente anterior, debito < credito", () => {
    const result = calcularRemanenteProximo(80000, 120000, 0);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximo).toBe(40000);
  });

  it("sin remanente anterior, debito > credito", () => {
    const result = calcularRemanenteProximo(120000, 80000, 0);
    expect(result.ivaPagar).toBe(40000);
    expect(result.remanenteProximo).toBe(0);
  });

  it("todo cero = cero ambos", () => {
    const result = calcularRemanenteProximo(0, 0, 0);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximo).toBe(0);
  });
});
