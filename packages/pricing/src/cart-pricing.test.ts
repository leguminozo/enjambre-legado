import { describe, it, expect } from "vitest";
import {
  computeCartPricing,
  computeUnitPrice,
  resolvePricingMultipliers,
} from "./cart-pricing";

const products = [
  { id: "p1", nombre: "Miel", slug: "miel", precio: 10000 },
  { id: "p2", nombre: "Propóleo", slug: "propolis", precio: 5000 },
];

describe("cart-pricing", () => {
  it("applies suscriptor multiplier", () => {
    expect(computeUnitPrice(10000, "suscriptor", 0)).toBe(9000);
  });

  it("applies volume discount for embajador with 10+ orders", () => {
    const { finalMultiplier } = resolvePricingMultipliers("embajador", 10);
    expect(finalMultiplier).toBeCloseTo(0.7 * 0.95, 5);
  });

  it("computes cart totals with line items", () => {
    const result = computeCartPricing(
      [
        { product_id: "p1", quantity: 2 },
        { product_id: "p2", quantity: 1 },
      ],
      products,
      "comprador",
      0,
    );

    expect(result.subtotal).toBe(25000);
    expect(result.total).toBe(25000);
    expect(result.discount_amount).toBe(0);
    expect(result.line_items).toHaveLength(2);
    expect(result.line_items[0]?.line_total).toBe(20000);
  });

  it("skips unknown product ids", () => {
    const result = computeCartPricing(
      [{ product_id: "missing", quantity: 1 }],
      products,
      "comprador",
      0,
    );
    expect(result.line_items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});