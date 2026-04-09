import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types/hono";

type TenantMembership = {
  empresa_id: string;
  rol: string;
};

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
