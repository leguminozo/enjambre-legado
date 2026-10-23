import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../app";
import { cleanupRateLimitMap } from "@/api/lib/rate-limit";

const paymentMocks = vi.hoisted(() => ({
  save: vi.fn(),
  lookup: vi.fn(),
  detach: vi.fn(),
}));

vi.mock("@/api/lib/payments/settle-checkout", () => ({
  settleCheckout: vi.fn().mockResolvedValue({ ok: true, ventaId: "venta-uuid-1" }),
}));

vi.mock("@/api/lib/payments", () => {
  const session = {
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
  };

  const provider = {
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
  };

  return {
    getPaymentProvider: () => provider,
    getPaymentProviderByName: () => provider,
    getCheckoutSession: vi.fn().mockResolvedValue(session),
    getCheckoutSessionByBuyOrder: vi.fn().mockResolvedValue(session),
    saveCheckoutSession: paymentMocks.save,
    completeCheckoutSession: vi.fn().mockResolvedValue(undefined),
    lookupCheckoutAttempt: paymentMocks.lookup,
    detachCheckoutAttemptKey: paymentMocks.detach,
  };
});

vi.mock("@supabase/supabase-js", () => {
  const productRows = [
    {
      id: "a2b724f8-4e12-40f4-90cc-172bf421e428",
      precio: 11111, // Base price * 0.9 suscriptor mult = 10000
      stock: 10,
      nombre: "Miel Ulmo",
      visible: true,
    },
  ];

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
      from: (table: string) => {
        if (table === "empresas") {
          return {
            select: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: { id: "empresa-id" }, error: null }),
              }),
            }),
          };
        }
        if (table === "sii_caf") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: { folio_hasta: 100, folio_actual: 50 },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            in: () => ({
              data: productRows,
              error: null,
            }),
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
              data: [],
            }),
            limit: () => ({
              maybeSingle: async () => ({ data: { id: "empresa-id" }, error: null }),
            }),
          }),
          insert: async () => ({ error: null }),
          delete: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      },
      rpc: async (fn: string) => ({
        data: fn === "reserve_checkout_stock" ? { success: true } : true,
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
    paymentMocks.save.mockReset();
    paymentMocks.save.mockResolvedValue(undefined);
    paymentMocks.lookup.mockReset();
    paymentMocks.lookup.mockResolvedValue({ kind: "none" });
    paymentMocks.detach.mockReset();
    paymentMocks.detach.mockResolvedValue(undefined);
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

    it("should accept and preserve utm attribution parameters", async () => {
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
            utm: {
              source: "instagram",
              medium: "cpc",
              campaign: "lanzamiento_cremas",
              content: "video_recoleccion",
              fbclid: "fb_click_id_999",
            },
          },
        }),
      });
      expect(res.status).toBe(200);
    });

    function initBody(extra: Record<string, unknown> = {}) {
      return JSON.stringify({
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
        ...extra,
      });
    }

    it("reanuda el intento reciente sin crear sesión nueva (respuesta perdida)", async () => {
      paymentMocks.lookup.mockResolvedValue({
        kind: "replay",
        replay: {
          buyOrder: "ORD-aaaaaaaa-1111-4111-8111-111111111111",
          sessionId: "sess-replay",
          provider: "transbank",
          total: 15900,
          subtotal: 10000,
          shippingCost: 5900,
          discountClp: 0,
          discountCode: null,
          loyaltyPointsRedeemed: 0,
          loyaltyDiscountClp: 0,
          buyerMode: "legado",
          url: "https://webpay.cl/reanudado",
          token: "token-reanudado",
        },
      });

      const res = await app.request("/api/checkout/init", {
        method: "POST",
        headers: checkoutHeaders({ Authorization: "Bearer valid-token" }),
        body: initBody({ attemptKey: "attempt-key-0001" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.replayed).toBe(true);
      expect(json.url).toBe("https://webpay.cl/reanudado");
      expect(json.token).toBe("token-reanudado");
      expect(json.buyOrder).toBe("ORD-aaaaaaaa-1111-4111-8111-111111111111");
      expect(paymentMocks.save).not.toHaveBeenCalled();
      expect(paymentMocks.lookup).toHaveBeenCalledWith("attempt-key-0001", "mock-user-id");
    });

    it("clave vencida: libera la clave y crea una sesión nueva", async () => {
      paymentMocks.lookup.mockResolvedValue({ kind: "stale", buyOrder: "ORD-vieja" });

      const res = await app.request("/api/checkout/init", {
        method: "POST",
        headers: checkoutHeaders({ Authorization: "Bearer valid-token" }),
        body: initBody({ attemptKey: "attempt-key-0002" }),
      });

      expect(res.status).toBe(200);
      expect(paymentMocks.detach).toHaveBeenCalledWith("ORD-vieja");
      expect(paymentMocks.save).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptKey: "attempt-key-0002",
          pspUrl: "https://webpay.cl/mock",
          pspToken: "mock-token",
        }),
      );
    });

    it("clave de otro comprador: 409 sin crear sesión", async () => {
      paymentMocks.lookup.mockResolvedValue({ kind: "conflict" });

      const res = await app.request("/api/checkout/init", {
        method: "POST",
        headers: checkoutHeaders({ Authorization: "Bearer valid-token" }),
        body: initBody({ attemptKey: "attempt-key-0003" }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("attempt_conflict");
      expect(paymentMocks.save).not.toHaveBeenCalled();
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
