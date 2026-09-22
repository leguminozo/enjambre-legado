import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockProcessNotificationQueue = vi.fn();
const mockProcessCartAbandonmentEmails = vi.fn();
const mockProcessArcoExpirations = vi.fn();

vi.mock("@/lib/notifications/worker", () => ({
  processNotificationQueue: () => mockProcessNotificationQueue(),
}));

vi.mock("@/lib/notifications/cart-abandonment-worker", () => ({
  processCartAbandonmentEmails: () => mockProcessCartAbandonmentEmails(),
}));

vi.mock("@/lib/arco/execute-solicitud", () => ({
  processArcoExpirations: (...args: unknown[]) => mockProcessArcoExpirations(...args),
}));

vi.mock("@enjambre/auth/server-index", () => ({
  createAdminClient: () => ({ auth: { admin: { deleteUser: vi.fn() } } }),
}));

describe("GET /api/cron/notifications", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-secret-abc";
    delete process.env.NOTIFICATIONS_WORKER_SECRET;
    delete process.env.INTEGRATIONS_CRON_SECRET;
    mockProcessNotificationQueue.mockReset();
    mockProcessCartAbandonmentEmails.mockReset();
    mockProcessArcoExpirations.mockReset();
    mockProcessCartAbandonmentEmails.mockResolvedValue({
      scannedCount: 0,
      sentCount: 0,
      skippedCount: 0,
    });
    mockProcessArcoExpirations.mockResolvedValue({ executed: 0 });
  });

  it("returns 401 without credentials", async () => {
    const res = await GET(new Request("http://localhost/api/cron/notifications"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid bearer", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/notifications", {
        headers: { Authorization: "Bearer wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with Vercel cron bearer", async () => {
    mockProcessNotificationQueue.mockResolvedValue({ processedCount: 4, successCount: 3 });

    const res = await GET(
      new Request("http://localhost/api/cron/notifications", {
        headers: { Authorization: "Bearer cron-secret-abc" },
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processedCount).toBe(4);
    expect(json.successCount).toBe(3);
    expect(json.abandonment).toEqual({ scannedCount: 0, sentCount: 0, skippedCount: 0 });
    expect(json.arco).toEqual({ executed: 0 });
    expect(mockProcessCartAbandonmentEmails).toHaveBeenCalledTimes(1);
    expect(mockProcessArcoExpirations).toHaveBeenCalledTimes(1);
  });

  it("accepts x-worker-secret as fallback", async () => {
    mockProcessNotificationQueue.mockResolvedValue({ processedCount: 1, successCount: 1 });

    const res = await GET(
      new Request("http://localhost/api/cron/notifications", {
        headers: { "x-worker-secret": "cron-secret-abc" },
      }),
    );

    expect(res.status).toBe(200);
  });
});