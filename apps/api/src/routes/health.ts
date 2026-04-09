import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

export const healthRoutes = new Hono();

/** Liveness: sin auth (probes, balanceadores). */
healthRoutes.get("/live", (c) =>
  c.json({
    status: "ok",
    service: "enjambre-api",
    timestamp: new Date().toISOString(),
  }),
);

/** Readiness: valida Bearer contra Supabase Auth. */
healthRoutes.get("/ready", authMiddleware, (c) => {
  const user = c.get("user");
  return c.json({
    status: "ok",
    service: "enjambre-api",
    userId: user.id,
    timestamp: new Date().toISOString(),
  });
});
