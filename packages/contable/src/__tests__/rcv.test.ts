import { describe, it, expect } from "vitest";
import { parsearEstadoRcv, RCV_ESTADO_SII, type RcvEstadoRegistro } from "../domain/rcv";

describe("parsearEstadoRcv", () => {
  it("mapea EPR a aceptado", () => {
    expect(parsearEstadoRcv("EPR")).toBe("aceptado");
  });

  it("mapea RCP a pendiente", () => {
    expect(parsearEstadoRcv("RCP")).toBe("pendiente");
  });

  it("mapea RCT a reclamado", () => {
    expect(parsearEstadoRcv("RCT")).toBe("reclamado");
  });

  it("mapea ANU a anulado", () => {
    expect(parsearEstadoRcv("ANU")).toBe("anulado");
  });

  it("mapea REG a registrar", () => {
    expect(parsearEstadoRcv("REG")).toBe("registrar");
  });

  it("devuelve pendiente para codigo desconocido", () => {
    expect(parsearEstadoRcv("XXX")).toBe("pendiente");
  });

  it("devuelve pendiente para string vacio", () => {
    expect(parsearEstadoRcv("")).toBe("pendiente");
  });

  it("RCV_ESTADO_SII tiene 5 mapeos", () => {
    expect(Object.keys(RCV_ESTADO_SII)).toHaveLength(5);
  });

  it("todos los valores del mapping son RcvEstadoRegistro validos", () => {
    const validEstados: RcvEstadoRegistro[] = ["registrar", "pendiente", "aceptado", "reclamado", "anulado"];
    for (const val of Object.values(RCV_ESTADO_SII)) {
      expect(validEstados).toContain(val);
    }
  });

  it("preserva tipo para codigo en minusculas desconocido", () => {
    expect(parsearEstadoRcv("epr")).toBe("pendiente");
  });

  it("preserva tipo para codigo parcial", () => {
    expect(parsearEstadoRcv("EP")).toBe("pendiente");
  });
});
