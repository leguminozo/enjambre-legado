import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { createMiddleware } from "hono/factory";
import { getEnvOrThrow } from "./env";

export type AppVariables = {
  user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
  };
  accessToken: string;
  supabase: SupabaseClient<Database>;
  empresaId: string;
  rol: string;
};

export function createSupabaseUserClient(accessToken: string): SupabaseClient<Database> {
  return createClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export const authMiddleware = createMiddleware<{
  Variables: Pick<AppVariables, "user" | "accessToken" | "supabase">;
}>(async (c, next) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ code: "unauthorized", message: "Missing Bearer token" }, 401);
  }

  const supabase = createSupabaseUserClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ code: "unauthorized", message: "Invalid token" }, 401);
  }

  c.set("accessToken", token);
  c.set("supabase", supabase);
  c.set("user", {
    id: user.id,
    email: user.email ?? undefined,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  await next();
});

type TenantMembership = { empresa_id: string; rol: string };

export const tenantMiddleware = createMiddleware<{
  Variables: AppVariables;
}>(async (c, next) => {
  const user = c.get("user");
  const supabase = c.get("supabase");
  const requestedEmpresaId = c.req.header("x-empresa-id");

  const { data, error } = await supabase
    .from("usuarios_empresas")
    .select("empresa_id, rol")
    .eq("user_id", user.id);

  if (error) {
    return c.json({ code: "tenant_lookup_failed", message: error.message }, 500);
  }

  const rows = (data ?? []) as TenantMembership[];

  if (rows.length === 0) {
    return c.json({ code: "tenant_not_found", message: "User has no company membership" }, 403);
  }

  const membership = requestedEmpresaId
    ? rows.find((item) => item.empresa_id === requestedEmpresaId)
    : rows[0];

  if (!membership) {
    return c.json({ code: "tenant_forbidden", message: "User has no access to requested company" }, 403);
  }

  c.set("empresaId", membership.empresa_id);
  c.set("rol", membership.rol);
  await next();
});

export const csrfMiddleware = createMiddleware(async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const path = new URL(c.req.url).pathname;

  const isWebhook =
    path.startsWith("/api/webhooks") ||
    path.startsWith("/api/checkout/webhook") ||
    path.startsWith("/api/banco-chile/webhook") ||
    path === "/api/security-events/internal";

  if (isWebhook) {
    return next();
  }

  const getRequestOrigin = () => {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    if (host) {
      return `${proto}://${host}`;
    }
    try {
      return new URL(c.req.url).origin;
    } catch {
      return "";
    }
  };

  const requestOrigin = getRequestOrigin();
  const origin = c.req.header("origin");
  const referer = c.req.header("referer");

  const allowedOrigins = new Set(
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_TIENDA_URL,
      process.env.NEXT_PUBLIC_CAMPO_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ]
      .filter(Boolean)
      .map((o) => {
        try {
          return new URL(o!).origin;
        } catch {
          return o!;
        }
      })
  );

  // 1. Verify Origin header
  if (origin) {
    if (origin === requestOrigin || allowedOrigins.has(origin)) {
      return next();
    }
    return c.json({ code: "forbidden", message: "CSRF: Origin not allowed" }, 403);
  }

  // 2. Fallback to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === requestOrigin || allowedOrigins.has(refererOrigin)) {
        return next();
      }
    } catch {
      // Invalid URL format in referer header
    }
    return c.json({ code: "forbidden", message: "CSRF: Referer not allowed" }, 403);
  }

  // 3. Reject mutating requests if both Origin and Referer are missing
  return c.json({ code: "forbidden", message: "CSRF: Missing Origin or Referer header" }, 403);
});
