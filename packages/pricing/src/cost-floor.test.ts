import { describe, expect, it } from "vitest";

import { validateTotalAboveCost } from "./cost-floor";

describe("validateTotalAboveCost", () => {
  it("aprueba cuando el neto cubre el costo", () => {
    const res = validateTotalAboveCost(
      [{ costoUnitario: 5000, cantidad: 2, precioUnitario: 14900 }],
      3000,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.costoTotal).toBe(10000);
      expect(res.cobertura).toBe(1);
    }
  });

  it("rechaza cuando el descuento deja el neto bajo costo", () => {
    const res = validateTotalAboveCost(
      [{ costoUnitario: 8000, cantidad: 1, precioUnitario: 10000 }],
      3000,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.faltante).toBe(1000);
  });

  it("fail-open sin costos conocidos", () => {
    const res = validateTotalAboveCost(
      [{ costoUnitario: null, cantidad: 1, precioUnitario: 10000 }],
      9999,
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.cobertura).toBe(0);
  });

  it("ignora cantidades nulas", () => {
    const res = validateTotalAboveCost(
      [
        { costoUnitario: 5000, cantidad: 0, precioUnitario: 14900 },
        { costoUnitario: 5000, cantidad: 1, precioUnitario: 14900 },
      ],
      0,
    );
    expect(res.ok).toBe(true);
  });
});
