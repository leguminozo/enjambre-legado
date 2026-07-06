import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { csrfMiddleware } from "../middleware";

describe("CSRF Middleware", () => {
  const app = new Hono();

  app.use("*", csrfMiddleware);

  app.get("/test", (c) => c.text("GET ok"));
  app.post("/test", (c) => c.text("POST ok"));
  app.options("/test", (c) => c.text("OPTIONS ok"));
  app.post("/api/webhooks/transbank", (c) => c.text("Webhook ok"));

  it("should allow GET requests without origin headers", async () => {
    const res = await app.request("/test", { method: "GET" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("GET ok");
  });

  it("should allow OPTIONS requests without origin headers", async () => {
    const res = await app.request("/test", { method: "OPTIONS" });
    expect(res.status).toBe(200);
  });

  it("should allow POST requests with matching allowed origin", async () => {
    const res = await app.request("/test", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
      },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("POST ok");
  });

  it("should allow POST requests with request matching origin (self)", async () => {
    const res = await app.request("http://localhost/test", {
      method: "POST",
      headers: {
        origin: "http://localhost",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should reject POST requests with mismatched origin", async () => {
    const res = await app.request("/test", {
      method: "POST",
      headers: {
        origin: "https://malicious.com",
      },
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("forbidden");
    expect(json.message).toContain("Origin not allowed");
  });

  it("should allow POST requests with allowed Referer when Origin is missing", async () => {
    const res = await app.request("/test", {
      method: "POST",
      headers: {
        referer: "http://localhost:3000/some-page",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should reject POST requests with mismatched Referer when Origin is missing", async () => {
    const res = await app.request("/test", {
      method: "POST",
      headers: {
        referer: "https://malicious.com/some-page",
      },
    });
    expect(res.status).toBe(403);
  });

  it("should reject POST requests if both Origin and Referer are missing", async () => {
    const res = await app.request("/test", {
      method: "POST",
    });
    expect(res.status).toBe(403);
  });

  it("should exempt webhooks from CSRF checks even if headers are missing", async () => {
    const res = await app.request("/api/webhooks/transbank", {
      method: "POST",
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Webhook ok");
  });

  it("should allow POST from canonical production tienda origin", async () => {
    const res = await app.request("/test", {
      method: "POST",
      headers: {
        origin: "https://tienda-eta-lime.vercel.app",
      },
    });
    expect(res.status).toBe(200);
  });
});
