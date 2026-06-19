import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../../../app/api/[[...routes]]/route";

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: (_url: string, _key: string, options?: any) => {
      const authHeader = options?.global?.headers?.Authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      return {
        auth: {
          getUser: async () => {
            if (token === "valid-token") {
              return { data: { user: { id: "mock-user-id", email: "mock@example.com" } }, error: null };
            }
            if (token === "admin-token") {
              return {
                data: {
                  user: {
                    id: "mock-admin-id",
                    email: "admin@example.com",
                    app_metadata: { role: "admin" },
                  },
                },
                error: null,
              };
            }
            return { data: { user: null }, error: new Error("Invalid token") };
          },
        },
        from: mockFrom,
      } as any;
    },
  };
});

const mockProcessNotificationQueue = vi.fn();
vi.mock("@/lib/notifications/worker", () => {
  return {
    processNotificationQueue: () => mockProcessNotificationQueue(),
  };
});

describe("Notifications API Routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
    process.env.NOTIFICATIONS_WORKER_SECRET = "worker-secret-123";
    mockFrom.mockReset();
    mockProcessNotificationQueue.mockReset();
  });

  const makeChain = (finalValue: any) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockReturnValue(chain);
    chain.then = (onfulfilled: any) => Promise.resolve(finalValue).then(onfulfilled);
    return chain;
  };

  describe("GET /api/notifications", () => {
    it("should return 401 if unauthorized", async () => {
      const res = await app.request("/api/notifications");
      expect(res.status).toBe(401);
    });

    it("should return 200 and in_app notification_events if authorized", async () => {
      const mockEvents = [
        {
          id: "1",
          channel: "in_app",
          subject: "Pedido confirmado",
          body: "Tu pago fue procesado",
          created_at: "2026-06-18T12:00:00Z",
          provider_response: { source: "checkout_paid" },
        },
      ];
      mockFrom.mockImplementation((table: string) => {
        if (table === "notification_events") {
          return makeChain({ data: mockEvents, error: null });
        }
        return makeChain({ data: [], error: null });
      });

      const res = await app.request("/api/notifications", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data[0].title).toBe("Pedido confirmado");
      expect(json.data[0].message).toBe("Tu pago fue procesado");
    });
  });

  describe("POST /api/notifications/read", () => {
    it("should return 200 after marking all notifications as read (client-side compat)", async () => {
      const res = await app.request("/api/notifications/read", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({ is_all: true }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("should return 200 after marking specific notification as read (client-side compat)", async () => {
      const res = await app.request("/api/notifications/read", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({ id: "986a4392-75ca-4eb6-bf55-bc287f344aa1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("should return 400 if neither id nor is_all is specified", async () => {
      const res = await app.request("/api/notifications/read", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/notifications/enqueue", () => {
    it("should return 403 if user has no company membership", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [], error: null });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await app.request("/api/notifications/enqueue", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({
          channel: "email",
          recipient: "test@example.com",
          body: "Hello world",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("should return 200 and enqueue notification if user has company membership", async () => {
      const mockQueueEntry = { id: "123", status: "pending" };
      mockFrom.mockImplementation((table: string) => {
        if (table === "usuarios_empresas") {
          return makeChain({ data: [{ empresa_id: "empresa-1", rol: "admin" }], error: null });
        }
        if (table === "notification_queue") {
          return makeChain({ data: mockQueueEntry, error: null });
        }
        return makeChain({ data: null, error: null });
      });

      const res = await app.request("/api/notifications/enqueue", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
          "x-empresa-id": "empresa-1",
        },
        body: JSON.stringify({
          channel: "email",
          recipient: "test@example.com",
          body: "Hello world",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockQueueEntry);
    });
  });

  describe("POST /api/notifications/trigger-worker", () => {
    it("should return 403 if not admin/gerente and secret is missing", async () => {
      const res = await app.request("/api/notifications/trigger-worker", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "origin": "http://localhost:3000",
        },
      });

      expect(res.status).toBe(403);
    });

    it("should run worker and return 200 if valid secret header is present", async () => {
      mockProcessNotificationQueue.mockResolvedValue({ processedCount: 5, successCount: 5 });

      const res = await app.request("/api/notifications/trigger-worker", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "x-worker-secret": "worker-secret-123",
          "origin": "http://localhost:3000",
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.processedCount).toBe(5);
      expect(json.successCount).toBe(5);
    });

    it("should run worker and return 200 if user is admin", async () => {
      mockProcessNotificationQueue.mockResolvedValue({ processedCount: 3, successCount: 3 });

      const res = await app.request("/api/notifications/trigger-worker", {
        method: "POST",
        headers: {
          "Authorization": "Bearer admin-token",
          "origin": "http://localhost:3000",
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
