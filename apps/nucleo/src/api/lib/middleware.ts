import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createMiddleware } from "hono/factory";

export type AppVariables = {
  user: { id: string; email?: string };
  accessToken: string;
  supabase: SupabaseClient;
  empresaId: string;
  rol: string;
};

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export function createSupabaseUserClient(accessToken: string): SupabaseClient {
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
  c.set("user", { id: user.id, email: user.email ?? undefined });
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
