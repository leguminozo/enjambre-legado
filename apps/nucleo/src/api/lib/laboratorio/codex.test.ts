import { describe, expect, it } from "vitest";

import { evaluarCodex, HMF_LIMITE_CODEX } from "./codex";

describe("evaluarCodex", () => {
  it("bloquea venta con HMF sobre el límite", () => {
    expect(evaluarCodex({ hmf_mgkg: 45, humedad_pct: 17 })).toEqual({
      bloqueado: true,
      alertaHumedad: false,
    });
  });

  it("alerta humedad sobre 20% sin bloquear", () => {
    expect(evaluarCodex({ hmf_mgkg: 8, humedad_pct: 21 })).toEqual({
      bloqueado: false,
      alertaHumedad: true,
    });
  });

  it("aprueba análisis dentro de norma", () => {
    expect(evaluarCodex({ hmf_mgkg: 8, humedad_pct: 17.2 })).toEqual({
      bloqueado: false,
      alertaHumedad: false,
    });
  });

  it("el límite exacto no bloquea", () => {
    expect(evaluarCodex({ hmf_mgkg: HMF_LIMITE_CODEX })).toEqual({
      bloqueado: false,
      alertaHumedad: false,
    });
  });

  it("sin parámetros no bloquea", () => {
    expect(evaluarCodex({})).toEqual({ bloqueado: false, alertaHumedad: false });
  });
});
