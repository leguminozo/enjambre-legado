import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildCartAbandonmentEmail,
  CART_ABANDONMENT_GRACE_MINUTES,
  isAbandonmentEligible,
} from "./cart-abandonment-worker";

vi.mock("./email-sender", () => ({
  sendNotificationEmail: vi.fn(),
}));

describe("cart-abandonment-worker", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_URL_TIENDA = "https://tienda.test";
  });

  it("isAbandonmentEligible respects grace window", () => {
    const now = Date.parse("2026-06-18T12:00:00.000Z");
    const recent = new Date(now - (CART_ABANDONMENT_GRACE_MINUTES - 1) * 60 * 1000).toISOString();
    const old = new Date(now - (CART_ABANDONMENT_GRACE_MINUTES + 1) * 60 * 1000).toISOString();

    expect(isAbandonmentEligible(recent, now)).toBe(false);
    expect(isAbandonmentEligible(old, now)).toBe(true);
  });

  it("buildCartAbandonmentEmail includes items and checkout link", () => {
    const { subject, body } = buildCartAbandonmentEmail({
      id: "evt-1",
      user_id: "user-1",
      email: "buyer@example.com",
      cart_items: [
        { nombre: "Ulmo 500g", precio: 12000, cantidad: 2 },
      ],
      cart_total: 24000,
      created_at: "2026-06-18T10:00:00.000Z",
    });

    expect(subject).toContain("carrito");
    expect(body).toContain("Ulmo 500g");
    expect(body).toContain("https://tienda.test/checkout");
    expect(body).toContain("$24.000");
  });
});