import { Hono } from "hono";
import { authMiddleware } from "@/api/lib/middleware";

export const healthRoutes = new Hono();

type DepStatus = "ok" | "missing";

function envPresent(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

/** Liveness: sin auth (probes, balanceadores). */
healthRoutes.get("/live", (c) =>
  c.json({
    status: "ok",
    service: "enjambre-api",
    version: "v1",
    timestamp: new Date().toISOString(),
  }),
);

/**
 * Dependencias de configuración (sin secretos en respuesta).
 * Solo presencia de env — para probes de deploy / go-live.
 */
healthRoutes.get("/deps", (c) => {
  const hasAnon =
    envPresent("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
    envPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const isProdLike =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  const checks: Record<string, DepStatus> = {
    supabase_url: envPresent("NEXT_PUBLIC_SUPABASE_URL") ? "ok" : "missing",
    supabase_anon: hasAnon ? "ok" : "missing",
    service_role: envPresent("SUPABASE_SERVICE_ROLE_KEY") ? "ok" : "missing",
    internal_api_secret: isProdLike
      ? envPresent("INTERNAL_API_SECRET")
        ? "ok"
        : "missing"
      : envPresent("INTERNAL_API_SECRET") || envPresent("SUPABASE_SERVICE_ROLE_KEY")
        ? "ok"
        : "missing",
    upstash:
      envPresent("UPSTASH_REDIS_REST_URL") && envPresent("UPSTASH_REDIS_REST_TOKEN")
        ? "ok"
        : "missing",
  };

  const critical: Array<keyof typeof checks> = [
    "supabase_url",
    "supabase_anon",
    "service_role",
  ];
  const degraded = critical.some((k) => checks[k] !== "ok");

  return c.json(
    {
      status: degraded ? "degraded" : "ok",
      service: "enjambre-api",
      checks,
      timestamp: new Date().toISOString(),
    },
    degraded ? 503 : 200,
  );
});

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
