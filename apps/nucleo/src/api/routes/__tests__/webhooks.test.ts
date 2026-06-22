import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCommit = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

vi.mock("@enjambre/auth/browser", () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock("@/api/lib/payments/provider", () => ({
  getPaymentProviderByName: () => ({ commit: mockCommit }),
}));

vi.mock("@/api/lib/payments/types", () => ({
  getCheckoutSession: vi.fn(),
}));

vi.mock("@/api/lib/payments/checkout-fulfill", () => ({
  fulfillCheckout: vi.fn(),
}));

vi.mock("@/api/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60_000,
  })),
  getClientIdentifier: () => "test",
  RATE_LIMIT_CONFIGS: { webhook: { limit: 100, window: "1 m" } },
}));

const { webhooksApp } = await import("../webhooks");

function chainMock(result: { data: unknown; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => result,
    update: () => ({ eq: async () => ({ error: null }) }),
    insert: async () => ({ error: null }),
  };
  return chain;
}

describe("webhooks /transbank", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = "test-internal-secret";
  });

  it("rejects buyOrder mismatch vs provider", async () => {
    mockCommit.mockResolvedValue({
      authorized: true,
      buyOrder: "ORD-provider",
      authorizationCode: "AUTH1",
    });

    const res = await webhooksApp.request("/transbank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_ws: "tok", buyOrder: "ORD-attacker" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("buy_order_mismatch");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("uses provider buyOrder when client omits it", async () => {
    mockCommit.mockResolvedValue({
      authorized: false,
      buyOrder: "ORD-provider",
      authorizationCode: "",
    });

    mockFrom.mockReturnValue(
      chainMock({ data: { buy_order: "ORD-provider", status: "pending" }, error: null }),
    );

    const res = await webhooksApp.request("/transbank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_ws: "tok" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe("payment_failed");
    expect(mockCommit).toHaveBeenCalledWith("tok");
  });
});

describe("webhooks /retry-failed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_API_SECRET = "test-internal-secret";
  });

  it("rejects without internal key", async () => {
    const res = await webhooksApp.request("/retry-failed", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("accepts x-internal-key", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        in: () => ({
          lte: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    });

    const res = await webhooksApp.request("/retry-failed", {
      method: "POST",
      headers: { "x-internal-key": "test-internal-secret" },
    });

    expect(res.status).toBe(200);
  });
});