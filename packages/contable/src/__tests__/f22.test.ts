import { describe, it, expect } from "vitest";
import { calcularF22, F22_CODIGO } from "../domain/f22";
import type { F22Input } from "../domain/f22";

describe("calcularF22", () => {
  const baseInput: F22Input = {
    anioComercial: 2025,
    regimen: "pro_pyme_transparente",
    baseImponibleTransparente: 10000000,
    idpcPagada: 0,
    ppmTotalPagado: 12500,
    retencionesHonorariosTotal: 183000,
    ivaDebitoAnual: 1900000,
    ivaCreditoAnual: 1200000,
  };

  it("Pyme Transparente: base imponible codigo 1609", () => {
    const result = calcularF22(baseInput);
    const baseLine = result.lineas.find((l) => l.codigo === F22_CODIGO.BASE_IMPONIBLE_TRANSPARENCIA);
    expect(baseLine?.monto).toBe(10000000);
  });

  it("Pyme Transparente: IDPC exenta = 0", () => {
    const result = calcularF22(baseInput);
    expect(result.idpcExenta).toBe(0);
  });

  it("Pyme Transparente: utilidades se atribuyen al dueno", () => {
    const result = calcularF22(baseInput);
    expect(result.atribucionDueno).toBe(10000000);
    const attrLine = result.lineas.find((l) => l.codigo === F22_CODIGO.ATRIBUCION_UTILIDADES);
    expect(attrLine?.monto).toBe(10000000);
  });

  it("Pyme Transparente: PPM es credito personal del dueno (DJ 1947, cod 1645)", () => {
    const result = calcularF22(baseInput);
    expect(result.ppmCreditoPersonal).toBe(12500);
    const ppmLine = result.lineas.find((l) => l.codigo === F22_CODIGO.CREDITO_PPM_DJ1947);
    expect(ppmLine?.monto).toBe(12500);
  });

  it("Pyme Transparente: retenciones honorarios codigo 1665", () => {
    const result = calcularF22(baseInput);
    const retLine = result.lineas.find((l) => l.codigo === F22_CODIGO.RETENCIONES_HONORARIOS);
    expect(retLine?.monto).toBe(183000);
  });

  it("Pro Pyme General: NO aplica transparencia", () => {
    const input: F22Input = {
      ...baseInput,
      regimen: "pro_pyme_general",
      idpcPagada: 1250000,
    };
    const result = calcularF22(input);
    expect(result.baseImponibleTransparente).toBe(0);
    expect(result.atribucionDueno).toBe(0);
    expect(result.idpcExenta).toBe(1250000);
    expect(result.ppmCreditoPersonal).toBe(0);
  });

  it("Semi-integrado: no aplica transparencia", () => {
    const input: F22Input = {
      ...baseInput,
      regimen: "semi_integrado",
      idpcPagada: 2500000,
    };
    const result = calcularF22(input);
    expect(result.baseImponibleTransparente).toBe(0);
  });

  it("General: no aplica transparencia", () => {
    const input: F22Input = {
      ...baseInput,
      regimen: "general",
      idpcPagada: 2500000,
    };
    const result = calcularF22(input);
    expect(result.baseImponibleTransparente).toBe(0);
  });

  it("lineas tiene 4 codigos F22", () => {
    const result = calcularF22(baseInput);
    expect(result.lineas).toHaveLength(4);
  });
});

describe("F22_CODIGO", () => {
  it("codigos coinciden con SII", () => {
    expect(F22_CODIGO.BASE_IMPONIBLE_TRANSPARENCIA).toBe(1609);
    expect(F22_CODIGO.ATRIBUCION_UTILIDADES).toBe(1610);
    expect(F22_CODIGO.CREDITO_PPM_DJ1947).toBe(1645);
    expect(F22_CODIGO.RETENCIONES_HONORARIOS).toBe(1665);
  });
});
