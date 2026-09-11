import { describe, expect, it } from "vitest";
import {
  computePaidTotal,
  loyaltyDiscountFromPoints,
  maxRedeemablePoints,
  validatePointsRedeemInput,
} from "./loyalty-checkout";

describe("loyalty-checkout", () => {
  it("converts 100 points to 1000 CLP discount", () => {
    expect(loyaltyDiscountFromPoints(100)).toBe(1000);
    expect(loyaltyDiscountFromPoints(250)).toBe(2000);
  });

  it("caps redeemable points by subtotal", () => {
    expect(maxRedeemablePoints(5000, 1500)).toBe(100);
    // $10.000 subtotal → máx $9.999 descuento → 900 pts ($9.000), menor que saldo 5.000
    expect(maxRedeemablePoints(5000, 10000)).toBe(900);
    expect(maxRedeemablePoints(20000, 10000)).toBe(900);
  });

  it("rejects discount that would zero out payment", () => {
    const result = validatePointsRedeemInput(1000, 5000, 500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("exceeds_max");
  });

  it("supports dynamic loyalty redemption config", () => {
    // Caso personalizado: 50 puntos = 500 CLP
    const customConfig = { pointsPerBlock: 50, clpPerBlock: 500 };
    expect(loyaltyDiscountFromPoints(120, customConfig)).toBe(1000); // 2 bloques de 50 = 1000 CLP
    expect(maxRedeemablePoints(500, 1200, customConfig)).toBe(100); // máx $1.199 -> 2 bloques de 500 CLP = 100 pts
    const valid = validatePointsRedeemInput(50, 500, 2000, customConfig);
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(valid.discountClp).toBe(500);
  });

  it("computes paid total with floor of 1 CLP", () => {
    expect(computePaidTotal(10000, 0, 9999)).toBe(1);
    expect(computePaidTotal(10000, 0, 1000)).toBe(9000);
  });

  it("blocks B2B roles (revendedor, embajador) from redeeming points", () => {
    const validComprador = validatePointsRedeemInput(100, 500, 5000, undefined, "comprador");
    expect(validComprador.ok).toBe(true);

    const validSuscriptor = validatePointsRedeemInput(100, 500, 5000, undefined, "suscriptor");
    expect(validSuscriptor.ok).toBe(true);

    const blockedRevendedor = validatePointsRedeemInput(100, 500, 5000, undefined, "revendedor");
    expect(blockedRevendedor.ok).toBe(false);
    if (!blockedRevendedor.ok) expect(blockedRevendedor.code).toBe("role_not_eligible");

    const blockedEmbajador = validatePointsRedeemInput(100, 500, 5000, undefined, "embajador");
    expect(blockedEmbajador.ok).toBe(false);
    if (!blockedEmbajador.ok) expect(blockedEmbajador.code).toBe("role_not_eligible");
  });
});