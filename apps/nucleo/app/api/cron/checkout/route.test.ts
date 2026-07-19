import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockExpire = vi.fn();

vi.mock("@/api/lib/payments", () => ({
  expireStaleCheckoutSessions: (...args: unknown[]) => mockExpire(...args),
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
