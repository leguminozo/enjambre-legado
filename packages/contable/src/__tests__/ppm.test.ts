import { describe, it, expect } from "vitest";
import { calcularPPM, esPymeTransparente, esPymeGeneral, calculaIDPC, getTasaIDPC } from "../domain/ppm";
import type { EmpresaRegimen } from "../domain/ppm";

describe("calcularPPM", () => {
  const valorUF = 40766;

  it("calcula 0.125% para Pyme Transparente bajo umbral con rebaja 50% (2025-2027)", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: "2020-03-15",
      ingresosBrutosAnioAnterior: 1000000,
    };
    const result = calcularPPM(empresa, 500000, valorUF);
    expect(result.tasaBase).toBe(0.0025);
    expect(result.aplicaRebaja50).toBe(true);
    expect(result.tasa).toBe(0.00125);
    expect(result.monto).toBe(625);
    expect(result.codigoBase).toBe(563);
    expect(result.codigoTasa).toBe(115);
    expect(result.codigoMonto).toBe(62);
  });

  it("calcula 0.25% para Pyme Transparente sobre umbral con rebaja 50%", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: "2020-03-15",
      ingresosBrutosAnioAnterior: 2500000000,
    };
    const result = calcularPPM(empresa, 5000000, valorUF);
    expect(result.tasaBase).toBe(0.005);
    expect(result.aplicaRebaja50).toBe(true);
    expect(result.tasa).toBe(0.0025);
    expect(result.monto).toBe(12500);
  });

  it("calcula correctamente para anio de inicio de actividades", () => {
    const anioActual = new Date().getFullYear();
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: `${anioActual}-01-01`,
      ingresosBrutosAnioAnterior: 0,
    };
    const result = calcularPPM(empresa, 1000000, valorUF);
    expect(result.esAnioInicio).toBe(true);
    expect(result.tasaBase).toBe(0.002);
    const aplicaRebaja = [2025, 2026, 2027].includes(anioActual);
    const tasaEsperada = aplicaRebaja ? 0.001 : 0.002;
    expect(result.tasa).toBe(tasaEsperada);
    expect(result.monto).toBe(Math.round(1000000 * tasaEsperada));
  });

  it("calcula 1% para regimen general sin rebaja", () => {
    const empresa: EmpresaRegimen = {
      regimen: "general",
      fechaInicioActividades: "2018-01-01",
      ingresosBrutosAnioAnterior: 5000000,
    };
    const result = calcularPPM(empresa, 2000000, valorUF);
    expect(result.tasaBase).toBe(0.01);
    expect(result.aplicaRebaja50).toBe(false);
    expect(result.tasa).toBe(0.01);
    expect(result.monto).toBe(20000);
  });

  it("calcula 0.125% para Pyme General bajo umbral con rebaja 50%", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_general",
      fechaInicioActividades: "2020-06-01",
      ingresosBrutosAnioAnterior: 500000,
    };
    const result = calcularPPM(empresa, 800000, valorUF);
    expect(result.tasaBase).toBe(0.0025);
    expect(result.aplicaRebaja50).toBe(true);
    expect(result.tasa).toBe(0.00125);
    expect(result.monto).toBe(1000);
  });

  it("clasifica bajo umbral cuando ingresos < 50000 UF", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: "2020-01-01",
      ingresosBrutosAnioAnterior: 40766 * 49999,
    };
    const result = calcularPPM(empresa, 100000, valorUF);
    expect(result.tasaBase).toBe(0.0025);
  });

  it("clasifica sobre umbral cuando ingresos >= 50000 UF", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: "2020-01-01",
      ingresosBrutosAnioAnterior: 40766 * 50001,
    };
    const result = calcularPPM(empresa, 100000, valorUF);
    expect(result.tasaBase).toBe(0.005);
  });

  it("maneja ingresos brututos anio anterior en cero", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: "2021-05-10",
      ingresosBrutosAnioAnterior: 0,
    };
    const result = calcularPPM(empresa, 300000, valorUF);
    expect(result.tasaBase).toBe(0.0025);
    expect(result.monto).toBe(Math.round(300000 * 0.00125));
  });

  it("sin fecha inicio actividades no es anio inicio", () => {
    const empresa: EmpresaRegimen = {
      regimen: "pro_pyme_transparente",
      fechaInicioActividades: null,
      ingresosBrutosAnioAnterior: 1000000,
    };
    const result = calcularPPM(empresa, 500000, valorUF);
    expect(result.esAnioInicio).toBe(false);
  });
});

describe("esPymeTransparente", () => {
  it("retorna true para pro_pyme_transparente", () => {
    expect(esPymeTransparente("pro_pyme_transparente")).toBe(true);
  });

  it("retorna false para otros regimenes", () => {
    expect(esPymeTransparente("pro_pyme_general")).toBe(false);
    expect(esPymeTransparente("semi_integrado")).toBe(false);
    expect(esPymeTransparente("general")).toBe(false);
  });
});

describe("esPymeGeneral", () => {
  it("retorna true para pro_pyme_general", () => {
    expect(esPymeGeneral("pro_pyme_general")).toBe(true);
  });

  it("retorna false para otros regimenes", () => {
    expect(esPymeGeneral("pro_pyme_transparente")).toBe(false);
  });
});

describe("calculaIDPC", () => {
  it("Pyme Transparente no calcula IDPC", () => {
    expect(calculaIDPC("pro_pyme_transparente")).toBe(false);
  });

  it("otros regimenes si calculan IDPC", () => {
    expect(calculaIDPC("pro_pyme_general")).toBe(true);
    expect(calculaIDPC("semi_integrado")).toBe(true);
    expect(calculaIDPC("general")).toBe(true);
  });
});

describe("getTasaIDPC", () => {
  it("Pyme Transparente = 0%", () => {
    expect(getTasaIDPC("pro_pyme_transparente", 2025)).toBe(0);
  });

  it("Pyme General 2025-2027 = 12.5%", () => {
    expect(getTasaIDPC("pro_pyme_general", 2025)).toBe(0.125);
    expect(getTasaIDPC("pro_pyme_general", 2026)).toBe(0.125);
    expect(getTasaIDPC("pro_pyme_general", 2027)).toBe(0.125);
  });

  it("Pyme General 2028 = 15%", () => {
    expect(getTasaIDPC("pro_pyme_general", 2028)).toBe(0.15);
  });

  it("Pyme General 2029+ = 25%", () => {
    expect(getTasaIDPC("pro_pyme_general", 2029)).toBe(0.25);
  });

  it("Semi-integrado 2025-2027 = 12.5%", () => {
    expect(getTasaIDPC("semi_integrado", 2026)).toBe(0.125);
  });

  it("General = 25% siempre", () => {
    expect(getTasaIDPC("general", 2025)).toBe(0.25);
    expect(getTasaIDPC("general", 2030)).toBe(0.25);
  });
});
