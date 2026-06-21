import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import type { AppVariables } from "../middleware";
import { requireProfileRole } from "../middleware";

type Vars = AppVariables;

function appWithRole(profileRole: string) {
  const app = new Hono<{ Variables: Vars }>();
  app.use("*", async (c, next) => {
    c.set("profileRole", profileRole);
    await next();
  });
  app.use("*", requireProfileRole("rep_ventas", "admin"));
  app.get("/pos", (c) => c.json({ ok: true }));
  return app;
}

describe("requireProfileRole", () => {
  it("allows rep_ventas", async () => {
    const res = await appWithRole("rep_ventas").request("/pos");
    expect(res.status).toBe(200);
  });

  it("allows admin", async () => {
    const res = await appWithRole("admin").request("/pos");
    expect(res.status).toBe(200);
  });

  it("blocks cliente", async () => {
    const res = await appWithRole("cliente").request("/pos");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("forbidden");
  });
});