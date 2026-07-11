import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authMiddleware } from "@/api/lib/middleware";
import { verifyInternalApiKey } from "@enjambre/auth/internal-api-secret";
import { logSecurityEvent } from "@enjambre/auth/security-events";
import { getEnvOrThrow } from "../lib/env";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "../lib/ratelimit";

export const securityEventRoutes = new Hono();

const SecurityEventTypeSchema = z.enum([
  "login_failed",
  "login_success",
  "password_reset_requested",
  "password_changed",
  "account_locked",
  "suspicious_activity",
  "role_change",
  "session_revoked",
  "mfa_enabled",
  "mfa_disabled",
  "oauth_linked",
  "access_denied",
  "signup_success",
]);

const AppSourceSchema = z.enum(["tienda", "nucleo", "campo", "api"]);

const SecurityEventSchema = z.strictObject({
  eventType: SecurityEventTypeSchema,
  email: z.string().min(1),
  userId: z.string().nullable().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  appSource: AppSourceSchema.optional(),
});

const toUndefined = (v: string | null | undefined): string | undefined => v ?? undefined;

securityEventRoutes.post("/internal", async (c) => {
  const identifier = getClientIdentifier(c);
  const rl = await checkRateLimit({
    identifier: `auth-events:${identifier}`,
    ...RATE_LIMIT_CONFIGS.auth,
  });
  if (!rl.success) {
    return c.json(
      { code: "rate_limited", message: "Too many requests" },
      429,
    );
  }

  const internalKey = c.req.header("x-internal-key");
  if (!verifyInternalApiKey(internalKey)) {
    return c.json({ code: "unauthorized", message: "Invalid internal key" }, 401);
  }

  const parsed = SecurityEventSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const supabase = createClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  await logSecurityEvent(supabase, {
    eventType: body.eventType,
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? toUndefined(c.req.header("x-forwarded-for")),
    userAgent: body.userAgent ?? toUndefined(c.req.header("user-agent")),
    details: body.details ?? {},
    appSource: body.appSource ?? "nucleo",
  });

  return c.json({ logged: true }, 201);
});

securityEventRoutes.post("/", authMiddleware, async (c) => {
  const identifier = getClientIdentifier(c);
  const rl = await checkRateLimit({
    identifier: `auth-events:${identifier}`,
    ...RATE_LIMIT_CONFIGS.auth,
  });
  if (!rl.success) {
    return c.json(
      { code: "rate_limited", message: "Too many requests" },
      429,
    );
  }

  const parsed = SecurityEventSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ code: "validation_error", errors: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const user = c.get("user");
  if (body.email !== user.email || (body.userId && body.userId !== user.id)) {
    return c.json({ code: "forbidden", message: "Forbidden: Cannot log security events for other users" }, 403);
  }

  const supabase = c.get("supabase");

  await logSecurityEvent(supabase, {
    eventType: body.eventType,
    email: body.email,
    userId: body.userId ?? null,
    ipAddress: body.ipAddress ?? toUndefined(c.req.header("x-forwarded-for")),
    userAgent: body.userAgent ?? toUndefined(c.req.header("user-agent")),
    details: body.details ?? {},
    appSource: body.appSource ?? "nucleo",
  });

  return c.json({ logged: true }, 201);
});
