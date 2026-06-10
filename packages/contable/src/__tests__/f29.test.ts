import { describe, it, expect } from "vitest";
import { calcularF29, F29_CODIGO } from "../domain/f29";
import type { F29Input } from "../domain/f29";

describe("calcularF29", () => {
  const baseInput: F29Input = {
    debitoFacturas: 0,
    debitoBoletasAfectas: 0,
    debitoNotasDebito: 0,
    creditoFacturasNacionales: 0,
    creditoFacturaCompraDigital: 0,
    remanenteCFAnteriorReajustado: 0,
    retencionHonorarios: 0,
    ppmBase: 0,
    ppmTasa: 0,
    ppmMonto: 0,
  };

  it("todo cero retorna IVA pagar 0 y remanente 0", () => {
    const result = calcularF29(baseInput);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximoPeriodo).toBe(0);
    expect(result.totalPagar).toBe(0);
    expect(result.lineas).toHaveLength(16);
  });

  it("debitos > creditos = IVA por pagar", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 190000,
      creditoFacturasNacionales: 95000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(95000);
    expect(result.remanenteProximoPeriodo).toBe(0);
  });

  it("creditos > debitos = remanente proximo periodo", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 50000,
      creditoFacturasNacionales: 190000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximoPeriodo).toBe(140000);
  });

  it("debitos == creditos = ni IVA ni remanente", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 100000,
      creditoFacturasNacionales: 100000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(0);
    expect(result.remanenteProximoPeriodo).toBe(0);
  });

  it("totalPagar = IVA + retencion honorarios + PPM", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 200000,
      creditoFacturasNacionales: 50000,
      retencionHonorarios: 15250,
      ppmMonto: 3000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(150000);
    expect(result.totalPagar).toBe(150000 + 15250 + 3000);
  });

  it("incluye remanente CF anterior reajustado en creditos", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 100000,
      creditoFacturasNacionales: 30000,
      remanenteCFAnteriorReajustado: 50000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(20000);
  });

  it("IVA digital se incluye como credito en cambio sujeto", () => {
    const input: F29Input = {
      ...baseInput,
      debitoFacturas: 100000,
      creditoFacturaCompraDigital: 38000,
    };
    const result = calcularF29(input);
    expect(result.ivaPagar).toBe(62000);

    const montoNetoDigital = result.lineas.find((l) => l.codigo === F29_CODIGO.MONTO_NETO_DIGITAL);
    expect(montoNetoDigital?.monto).toBe(Math.round(38000 / 0.19));

    const ivaDigital = result.lineas.find((l) => l.codigo === F29_CODIGO.IVA_DIGITAL_CAMBIO_SUJETO);
    expect(ivaDigital?.monto).toBe(38000);
  });

  it("lineas tienen codigos SII correctos", () => {
    const result = calcularF29(baseInput);
    const codigos = result.lineas.map((l) => l.codigo);

    expect(codigos).toContain(F29_CODIGO.DEBITO_FACTURAS_VENTA);
    expect(codigos).toContain(F29_CODIGO.DEBITO_BOLETAS);
    expect(codigos).toContain(F29_CODIGO.TOTAL_DEBITOS);
    expect(codigos).toContain(F29_CODIGO.CREDITO_COMPRAS_NACIONALES);
    expect(codigos).toContain(F29_CODIGO.IVA_DIGITAL_CAMBIO_SUJETO);
    expect(codigos).toContain(F29_CODIGO.REMANENTE_CF_ANTERIOR);
    expect(codigos).toContain(F29_CODIGO.TOTAL_CREDITOS);
    expect(codigos).toContain(F29_CODIGO.IVA_PAGAR);
    expect(codigos).toContain(F29_CODIGO.REMANENTE_PROXIMO);
    expect(codigos).toContain(F29_CODIGO.RETENCION_HONORARIOS);
    expect(codigos).toContain(F29_CODIGO.PPM_BASE_INGRESOS);
    expect(codigos).toContain(F29_CODIGO.PPM_TASA);
    expect(codigos).toContain(F29_CODIGO.PPM_MONTO);
  });

  it("PPM se refleja en lineas 69 cod 563/115/62", () => {
    const input: F29Input = {
      ...baseInput,
      ppmBase: 1000000,
      ppmTasa: 0.00125,
      ppmMonto: 1250,
    };
    const result = calcularF29(input);

    const baseLine = result.lineas.find((l) => l.codigo === 563);
    const tasaLine = result.lineas.find((l) => l.codigo === 115);
    const montoLine = result.lineas.find((l) => l.codigo === 62);

    expect(baseLine?.monto).toBe(1000000);
    expect(tasaLine?.monto).toBe(0.00125);
    expect(montoLine?.monto).toBe(1250);
  });

  it("escenario completo EIRL Pyme Transparente", () => {
    const input: F29Input = {
      debitoFacturas: 95000,
      debitoBoletasAfectas: 28500,
      debitoNotasDebito: 0,
      creditoFacturasNacionales: 57000,
      creditoFacturaCompraDigital: 19000,
      remanenteCFAnteriorReajustado: 10000,
      retencionHonorarios: 15250,
      ppmBase: 500000,
      ppmTasa: 0.00125,
      ppmMonto: 625,
    };
    const result = calcularF29(input);

    const totalDebitos = 95000 + 28500;
    const totalCreditos = 57000 + 19000 + 10000;
    const expectedIva = totalDebitos - totalCreditos;

    expect(result.ivaPagar).toBe(expectedIva);
    expect(result.ppmDeterminado).toBe(625);
    expect(result.totalPagar).toBe(expectedIva + 15250 + 625);
  });
});

describe("F29_CODIGO", () => {
  it("codigos criticos coinciden con instructivo SII", () => {
    expect(F29_CODIGO.DEBITO_FACTURAS_VENTA).toBe(503);
    expect(F29_CODIGO.DEBITO_BOLETAS).toBe(110);
    expect(F29_CODIGO.TOTAL_DEBITOS).toBe(538);
    expect(F29_CODIGO.REMANENTE_CF_ANTERIOR).toBe(504);
    expect(F29_CODIGO.TOTAL_CREDITOS).toBe(537);
    expect(F29_CODIGO.IVA_PAGAR).toBe(89);
    expect(F29_CODIGO.REMANENTE_PROXIMO).toBe(77);
    expect(F29_CODIGO.RETENCION_HONORARIOS).toBe(151);
    expect(F29_CODIGO.PPM_BASE_INGRESOS).toBe(563);
    expect(F29_CODIGO.PPM_TASA).toBe(115);
    expect(F29_CODIGO.PPM_MONTO).toBe(62);
    expect(F29_CODIGO.IVA_DIGITAL_CAMBIO_SUJETO).toBe(511);
    expect(F29_CODIGO.CANTIDAD_DOCS_DIGITAL).toBe(519);
    expect(F29_CODIGO.MONTO_NETO_DIGITAL).toBe(520);
  });
});
