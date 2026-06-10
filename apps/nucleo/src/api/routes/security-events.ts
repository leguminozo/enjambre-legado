import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authMiddleware } from "@/api/lib/middleware";
import { logSecurityEvent } from "@enjambre/auth/security-events";

export const securityEventRoutes = new Hono();

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

const SecurityEventSchema = z.strictObject({
  eventType: z.string().min(1),
  email: z.string().min(1),
  userId: z.string().nullable().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  appSource: z.string().optional(),
});

const toUndefined = (v: string | null | undefined): string | undefined => v ?? undefined;

securityEventRoutes.post("/internal", async (c) => {
  const internalKey = c.req.header("x-internal-key");
  if (!internalKey || internalKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return c.json({ code: "unauthorized", message: "Invalid internal key" }, 401);
  }

  const parsed = SecurityEventSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const supabase = createClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  await logSecurityEvent(supabase, {
    eventType: body.eventType as "access_denied",
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? toUndefined(c.req.header("x-forwarded-for")),
    userAgent: body.userAgent ?? toUndefined(c.req.header("user-agent")),
    details: body.details ?? {},
    appSource: (body.appSource ?? "nucleo") as "nucleo",
  });

  return c.json({ logged: true }, 201);
});

securityEventRoutes.post("/", authMiddleware, async (c) => {
  const parsed = SecurityEventSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const supabase = c.get("supabase");

  await logSecurityEvent(supabase, {
    eventType: body.eventType as "access_denied",
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? toUndefined(c.req.header("x-forwarded-for")),
    userAgent: body.userAgent ?? toUndefined(c.req.header("user-agent")),
    details: body.details ?? {},
    appSource: (body.appSource ?? "nucleo") as "nucleo",
  });

  return c.json({ logged: true }, 201);
});
