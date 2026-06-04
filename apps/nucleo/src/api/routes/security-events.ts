import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "@/api/lib/middleware";
import { logSecurityEvent } from "@enjambre/auth/security-events";

export const securityEventRoutes = new Hono();

type SecurityEventBody = {
  eventType: string;
  email: string;
  userId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
};

securityEventRoutes.post("/internal", async (c) => {
  const internalKey = c.req.header("x-internal-key");
  if (!internalKey || internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.json({ code: "unauthorized", message: "Invalid internal key" }, 401);
  }

  const body = await c.req.json<SecurityEventBody>();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  await logSecurityEvent(supabase, {
    eventType: body.eventType as "access_denied",
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? c.req.header("x-forwarded-for") ?? null,
    userAgent: body.userAgent ?? c.req.header("user-agent") ?? null,
    details: body.details ?? {},
    appSource: "nucleo",
  });

  return c.json({ logged: true }, 201);
});

securityEventRoutes.post("/", authMiddleware, async (c) => {
  const body = await c.req.json<SecurityEventBody>();
  const supabase = c.get("supabase");

  await logSecurityEvent(supabase, {
    eventType: body.eventType as "access_denied",
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? c.req.header("x-forwarded-for") ?? null,
    userAgent: body.userAgent ?? c.req.header("user-agent") ?? null,
    details: body.details ?? {},
    appSource: "nucleo",
  });

  return c.json({ logged: true }, 201);
});
