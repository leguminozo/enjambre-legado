import { describe, expect, it } from "vitest";
import { computeCanonicalLoyaltyDeltas } from "../loyalty-engine";

describe("loyalty-engine", () => {
  it("computes purchase deltas: points for D2C and cycles for everyone", () => {
    // Compra D2C de $25.000 CLP: 250 puntos (1 cada $100) y 25 ciclos (1 cada $1.000)
    const d2cResult = computeCanonicalLoyaltyDeltas({
      eventType: "compra_completada",
      amountClp: 25000,
      userRole: "comprador",
    });
    expect(d2cResult.deltaPuntos).toBe(250);
    expect(d2cResult.deltaCiclos).toBe(25);
    expect(d2cResult.isEligible).toBe(true);

    // Compra mayorista de $500.000 CLP: 0 puntos de consumo, pero 500 ciclos de reputación biocultural
    const b2bResult = computeCanonicalLoyaltyDeltas({
      eventType: "compra_completada",
      amountClp: 500000,
      userRole: "revendedor",
    });
    expect(b2bResult.deltaPuntos).toBe(0);
    expect(b2bResult.deltaCiclos).toBe(500);
  });

  it("computes welcome bonus", () => {
    const welcome = computeCanonicalLoyaltyDeltas({
      eventType: "bienvenida_registro",
    });
    expect(welcome.deltaPuntos).toBe(100);
    expect(welcome.deltaCiclos).toBe(0);
  });

  it("computes replenishment subscription bonus", () => {
    const subWelcome = computeCanonicalLoyaltyDeltas({
      eventType: "bienvenida_reposicion",
    });
    expect(subWelcome.deltaPuntos).toBe(100);
    expect(subWelcome.deltaCiclos).toBe(10);
  });

  it("computes approved review bonus", () => {
    const review = computeCanonicalLoyaltyDeltas({
      eventType: "resena_aprobada",
    });
    expect(review.deltaPuntos).toBe(0);
    expect(review.deltaCiclos).toBe(5);
  });

  it("computes circular jar return rewards", () => {
    const jars = computeCanonicalLoyaltyDeltas({
      eventType: "frasco_retornado",
      frascosCount: 3,
    });
    expect(jars.deltaPuntos).toBe(150); // 3 * 50
    expect(jars.deltaCiclos).toBe(6);   // 3 * 2
  });

  it("handles checkout point redemptions safely", () => {
    const validRedeem = computeCanonicalLoyaltyDeltas({
      eventType: "canje_checkout",
      pointsToRedeem: 200,
      userRole: "comprador",
    });
    expect(validRedeem.deltaPuntos).toBe(-200);
    expect(validRedeem.deltaCiclos).toBe(0); // Ciclos are permanent, never subtracted
    expect(validRedeem.isEligible).toBe(true);

    const invalidRedeem = computeCanonicalLoyaltyDeltas({
      eventType: "canje_checkout",
      pointsToRedeem: 200,
      userRole: "revendedor",
    });
    expect(invalidRedeem.isEligible).toBe(false);
    expect(invalidRedeem.errorCode).toBe("role_not_eligible");
    expect(invalidRedeem.deltaPuntos).toBe(0);
  });
});
