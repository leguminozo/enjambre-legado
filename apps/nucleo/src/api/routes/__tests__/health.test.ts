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
});
