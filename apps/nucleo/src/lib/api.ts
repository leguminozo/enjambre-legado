import { supabase } from "./supabase";

/** Cache por sesión de usuario: evita reconsultar membership en cada fetch. */
let empresaIdCache: { userId: string; empresaId: string } | null = null;

export function clearEmpresaIdCache(): void {
  empresaIdCache = null;
}

export const getAccessToken = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser(); // Validates JWT with server
  if (!user) {
    throw new Error("No hay sesión activa");
  }
  const { data } = await supabase.auth.getSession(); // Get session for access_token (after validation)
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay sesión activa");
  }
  return token;
};

/**
 * Resuelve la empresa del usuario:
 * 1) claim JWT `app_metadata.empresa_id` (si existe)
 * 2) primera membership en `usuarios_empresas` (mismo criterio que tenantMiddleware sin header)
 */
export async function getEmpresaId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    empresaIdCache = null;
    return "";
  }

  const cached = empresaIdCache;
  if (cached && cached.userId === userId && cached.empresaId) {
    return cached.empresaId;
  }

  const fromJwt =
    typeof user?.app_metadata?.empresa_id === "string"
      ? user.app_metadata.empresa_id.trim()
      : "";
  if (fromJwt) {
    empresaIdCache = { userId, empresaId: fromJwt };
    return fromJwt;
  }

  const { data: membership, error } = await supabase
    .from("usuarios_empresas")
    .select("empresa_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getEmpresaId] membership lookup:", error.message);
  }

  const fromMembership =
    membership && typeof membership.empresa_id === "string"
      ? membership.empresa_id
      : "";

  empresaIdCache = { userId, empresaId: fromMembership };
  return fromMembership;
}
