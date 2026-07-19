import { describe, it, expect, vi } from "vitest";
import { app } from "../../../../app/api/[[...routes]]/route";

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

describe("Health API Routes", () => {
  it("GET /api/health/live should return 200 and status ok", async () => {
    const res = await app.request("/api/health/live");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      status: "ok",
      service: "enjambre-api",
      version: "v1",
      timestamp: expect.any(String),
    });
  });

  it("GET /api/health/ready should return 401 if unauthorized", async () => {
    const res = await app.request("/api/health/ready");
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe("unauthorized");
  });

  it("GET /api/health/ready should return 200 if valid authorization token is sent", async () => {
    const res = await app.request("/api/health/ready", {
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      status: "ok",
      service: "enjambre-api",
      userId: "mock-user-id",
      timestamp: expect.any(String),
    });
  });

  it("GET /api/health/deps reports config checks without leaking secrets", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-at-least-32chars!!";
    process.env.NEXT_PUBLIC_URL_TIENDA = "https://tienda.example";
    process.env.INTERNAL_API_SECRET = "internal-test";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const res = await app.request("/api/health/deps");
    expect([200, 503]).toContain(res.status);
    const json = await res.json();
    expect(json.service).toBe("enjambre-api");
    expect(json.checks.supabase_url).toBe("ok");
    expect(json.checks.supabase_anon).toBe("ok");
    expect(json.checks.service_role).toBe("ok");
    expect(json.checks.tienda_url).toBe("ok");
    expect(json.checks.upstash).toBe("missing");
    expect(json.status).toBe("ok");
    expect(JSON.stringify(json)).not.toMatch(/service-role-key|anon-key|internal-test/i);
  });
});
