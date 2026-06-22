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

  it("computes paid total with floor of 1 CLP", () => {
    expect(computePaidTotal(10000, 0, 9999)).toBe(1);
    expect(computePaidTotal(10000, 0, 1000)).toBe(9000);
  });
});