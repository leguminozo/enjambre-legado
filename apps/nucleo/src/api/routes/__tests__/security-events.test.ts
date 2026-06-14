import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../../../../app/api/[[...routes]]/route";

vi.mock("@enjambre/auth/security-events", () => {
  return {
    logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  };
});

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
            return { data: { user: null }, error: new Error("Invalid token") };
          },
        },
      } as any;
    },
  };
});

describe("Security Events API Routes", () => {
  const serviceRoleKey = "test-service-role-key";

  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
  });

  describe("POST /api/security-events/internal", () => {
    it("should return 401 if x-internal-key is missing or invalid", async () => {
      const res = await app.request("/api/security-events/internal", {
        method: "POST",
        body: JSON.stringify({
          eventType: "login_success",
          email: "test@example.com",
        }),
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("unauthorized");
    });

    it("should return 400 if validation fails", async () => {
      const res = await app.request("/api/security-events/internal", {
        method: "POST",
        headers: {
          "x-internal-key": serviceRoleKey,
        },
        body: JSON.stringify({
          eventType: "login_success",
          // Missing email
        }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("validation_error");
    });

    it("should return 201 if internal key and body are valid", async () => {
      const res = await app.request("/api/security-events/internal", {
        method: "POST",
        headers: {
          "x-internal-key": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: "login_success",
          email: "test@example.com",
        }),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({ logged: true });
    });
  });

  describe("POST /api/security-events", () => {
    it("should return 401 if unauthorized", async () => {
      const res = await app.request("/api/security-events", {
        method: "POST",
        headers: {
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({
          eventType: "access_denied",
          email: "test@example.com",
        }),
      });
      expect(res.status).toBe(401);
    });

    it("should return 201 if valid JWT and body are sent with matching email", async () => {
      const res = await app.request("/api/security-events", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({
          eventType: "access_denied",
          email: "mock@example.com",
        }),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({ logged: true });
    });

    it("should return 403 if email in JWT does not match payload email", async () => {
      const res = await app.request("/api/security-events", {
        method: "POST",
        headers: {
          "Authorization": "Bearer valid-token",
          "Content-Type": "application/json",
          "origin": "http://localhost:3000",
        },
        body: JSON.stringify({
          eventType: "access_denied",
          email: "mismatch@example.com",
        }),
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe("forbidden");
    });
  });
});
