import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockExpire = vi.fn();

vi.mock("@/api/lib/payments", () => ({
  expireStaleCheckoutSessions: (...args: unknown[]) => mockExpire(...args),
}));

// Sin red en tests: createAdminClient y el dunning usan el mismo mock
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: async () => ({
      data: { deliveries_healed: 0, marked_past_due: 1, engine: "subscription_renewal_v3_flow" },
      error: null,
    }),
    from: (table: string) => {
      const q = { select: () => q, eq: () => q, limit: () => q };
      return Object.assign(q, {
        then: async (resolve: (v: { data: unknown[]; error: null }) => void) =>
          resolve({ data: [], error: null }),
      });
    },
  }),
}));

describe("GET /api/cron/checkout", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "checkout-cron-secret";
    mockExpire.mockReset();
    mockExpire.mockResolvedValue({ expired: 2, buyOrders: ["bo-1", "bo-2"] });
  });

  it("returns 401 without credentials", async () => {
    const res = await GET(new Request("http://localhost/api/cron/checkout"));
    expect(res.status).toBe(401);
  });

  it("expires stale sessions with bearer", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/checkout", {
        headers: { Authorization: "Bearer checkout-cron-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.expired).toBe(2);
    expect(mockExpire).toHaveBeenCalledWith({ olderThanMinutes: 30, limit: 100 });
  });
});
