import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../../../app/api/[[...routes]]/route";
import { cleanupRateLimitMap } from "@/api/lib/rate-limit";

vi.mock("@/api/lib/payments/checkout-fulfill", () => ({
  fulfillCheckout: vi.fn().mockResolvedValue({ ok: true, ventaId: "venta-uuid-1" }),
}));

vi.mock("@/api/lib/payments", () => {
  return {
    getPaymentProvider: () => ({
      name: "transbank",
      init: async () => ({
        url: "https://webpay.cl/mock",
        token: "mock-token",
        buyOrder: "ORD-mock",
        sessionId: "sess-mock",
      }),
      commit: async () => ({
        authorized: true,
        buyOrder: "ORD-mock",
        authorizationCode: "123456",
        raw: {},
      }),
    }),
    saveCheckoutSession: vi.fn().mockResolvedValue(undefined),
    getCheckoutSession: vi.fn().mockResolvedValue({
      total: 10000,
      cart: [
        {
          productId: "a2b724f8-4e12-40f4-90cc-172bf421e428",
          slug: "miel",
          name: "Miel Ulmo",
          unitPrice: 10000,
          quantity: 1,
        },
      ],
      provider: "transbank",
      shipping: {
        nombre: "Juan",
        email: "buyer@example.com",
        telefono: "+56912345678",
        direccion: "Calle 1",
        comuna: "Providencia",
        ciudad: "Santiago",
        region: "Metropolitana",
      },
      buyerMode: "legado",
      clienteId: "mock-user-id",
      courierCode: "blueexpress",
      shippingCost: 0,
      subtotal: 10000,
      loyaltyPointsRedeemed: 0,
      loyaltyDiscountClp: 0,
    }),
    completeCheckoutSession: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "mock-user-id",
              email: "buyer@example.com",
              app_metadata: { oyz_role: "suscriptor" },
            },
          },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          in: () => ({
            data: [
              {
                id: "a2b724f8-4e12-40f4-90cc-172bf421e428",
                precio: 11111, // Base price * 0.9 suscriptor mult = 10000
                stock: 10,
                nombre: "Miel Ulmo",
                visible: true,
              },
            ],
            error: null,
          }),
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            data: [],
          }),
          limit: () => ({
            single: async () => ({ data: { id: "empresa-id" }, error: null }),
          }),
        }),
        insert: async () => ({ error: null }),
        delete: () => ({
          eq: async () => ({ error: null }),
        }),
      }),
      rpc: async (fn: string) => ({
        data: fn === 'reserve_checkout_stock' ? { success: true } : true,
        error: null,
      }),
    }),
  };
});

let requestSeq = 0;

function checkoutHeaders(extra: Record<string, string> = {}) {
  requestSeq += 1;
  return {
    "Content-Type": "application/json",
    origin: "http://localhost:3000",
    "x-forwarded-for": `10.99.0.${requestSeq}`,
    ...extra,
  };
}

describe("Checkout API Routes", () => {
  beforeEach(() => {
    cleanupRateLimitMap();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.FLOW_SECRET = "mock-secret";
    process.env.INTERNAL_API_SECRET = "mock-internal";
  });

  describe("POST /api/checkout/init", () => {
    it("should return 400 if request body is invalid", async () => {
      const res = await app.request("/api/checkout/init", {
        method: "POST",
        headers: checkoutHeaders(),
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should return 200 and payment details if request is valid", async () => {
      const res = await app.request("/api/checkout/init", {
        method: "POST",
        headers: checkoutHeaders({ Authorization: "Bearer valid-token" }),
        body: JSON.stringify({
          cart: [
            {
              productId: "a2b724f8-4e12-40f4-90cc-172bf421e428",
              slug: "miel",
              name: "Miel Ulmo",
              unitPrice: 10000,
              quantity: 1,
            },
          ],
          shipping: {
            nombre: "Juan Pérez",
            email: "buyer@example.com",
            telefono: "+56912345678",
            direccion: "Calle Falsa 123",
            comuna: "Providencia",
            ciudad: "Santiago",
            region: "Metropolitana",
          },
        }),
      });
      if (res.status !== 200) {
        console.error("INIT ERROR RESPONSE:", await res.json());
      }
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.url).toBe("https://webpay.cl/mock");
      expect(json.total).toBe(15900);
      expect(json.shippingCost).toBe(5900);
    });
  });

  describe('POST /api/checkout/quote', () => {
    it('returns shipping and total for valid quote', async () => {
      const res = await app.request('/api/checkout/quote', {
        method: 'POST',
        headers: checkoutHeaders(),
        body: JSON.stringify({
          subtotal: 10000,
          region: 'Metropolitana',
          courierCode: 'blueexpress',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.shippingCost).toBe(5900);
      expect(json.total).toBe(15900);
    });

    it('quotes without service role when no discount or loyalty', async () => {
      const prev = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const res = await app.request('/api/checkout/quote', {
        method: 'POST',
        headers: checkoutHeaders(),
        body: JSON.stringify({
          subtotal: 10000,
          region: 'Metropolitana',
          courierCode: 'blueexpress',
        }),
      });

      if (prev) process.env.SUPABASE_SERVICE_ROLE_KEY = prev;

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.total).toBe(15900);
    });
  });

  describe("POST /api/checkout/preview", () => {
    it("should return pricing preview for valid items", async () => {
      const res = await app.request("/api/checkout/preview", {
        method: "POST",
        headers: checkoutHeaders({ Authorization: "Bearer valid-token" }),
        body: JSON.stringify({
          items: [{ product_id: "a2b724f8-4e12-40f4-90cc-172bf421e428", quantity: 1 }],
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pricing.total).toBe(10000);
      expect(json.pricing.line_items).toHaveLength(1);
    });
  });

  describe("POST /api/checkout/commit", () => {
    it("should process authorized transaction and return 200", async () => {
      const res = await app.request("/api/checkout/commit", {
        method: "POST",
        headers: checkoutHeaders(),
        body: JSON.stringify({
          token_ws: "mock-ws-token",
        }),
      });
      if (res.status !== 200) {
        console.error("COMMIT ERROR RESPONSE:", await res.json());
      }
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.authorized).toBe(true);
    });
  });
});
