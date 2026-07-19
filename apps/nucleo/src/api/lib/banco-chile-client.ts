import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { BancoChileClient } from "@enjambre/banco-chile";
import {
  decryptSiiSecret,
  encryptSiiSecret,
  resolveSiiEncryptionKeyBytes,
} from "./sii-crypto";

export type BancoChileConfigRow = {
  id: string;
  empresa_id: string;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  environment: string;
  enabled: boolean;
  last_sync?: string | null;
};

async function resolveSecret(stored: string | null | undefined): Promise<string> {
  if (!stored?.trim()) return "";
  const dec = await decryptSiiSecret(stored);
  return dec ?? stored.trim();
}

export async function encryptBancoSecret(plaintext: string): Promise<string | null> {
  if (!resolveSiiEncryptionKeyBytes()) return null;
  return encryptSiiSecret(plaintext);
}

export type BancoChileClientResolved =
  | { ok: true; client: BancoChileClient; config: BancoChileConfigRow }
  | { ok: false; code: "no_config" | "disabled" | "no_credentials"; message: string };

export async function resolveBancoChileClient(
  supabase: SupabaseClient<Database>,
  empresaId: string,
  opts?: { requireEnabled?: boolean },
): Promise<BancoChileClientResolved> {
  const requireEnabled = opts?.requireEnabled !== false;

  let q = supabase.from("banco_chile_config").select("*").eq("empresa_id", empresaId);
  if (requireEnabled) q = q.eq("enabled", true);

  const { data: config, error } = await q.maybeSingle();
  if (error || !config) {
    return {
      ok: false,
      code: "no_config",
      message: "Banco Chile no configurado. Guardá credenciales en Banco Chile → Configurar.",
    };
  }

  const row = config as BancoChileConfigRow;
  if (requireEnabled && !row.enabled) {
    return {
      ok: false,
      code: "disabled",
      message: "Banco Chile deshabilitado. Activá la integración en configuración.",
    };
  }

  const clientId = await resolveSecret(row.client_id);
  const clientSecret = await resolveSecret(row.client_secret);
  const username = await resolveSecret(row.username);
  const password = await resolveSecret(row.password);

  if (!clientId || !clientSecret || !username || !password) {
    return {
      ok: false,
      code: "no_credentials",
      message: "Credenciales incompletas (client id/secret, usuario y password).",
    };
  }

  const client = new BancoChileClient({
    clientId,
    clientSecret,
    username,
    password,
    environment: row.environment === "production" ? "production" : "sandbox",
  });

  // Hydrate non-expired token from DB (avoids password-grant on every request)
  const { data: tokRows } = await supabase
    .from("banco_chile_tokens")
    .select("access_token, refresh_token, expires_at, token_type")
    .eq("config_id", row.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const tok = Array.isArray(tokRows) ? tokRows[0] : tokRows;

  if (tok?.access_token && tok.expires_at && new Date(tok.expires_at) > new Date()) {
    client.setStoredToken(
      {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? undefined,
        expires_in: Math.max(
          0,
          Math.floor((new Date(tok.expires_at).getTime() - Date.now()) / 1000),
        ),
        token_type: "Bearer",
        scope: "",
      },
      tok.expires_at,
    );
  }

  return { ok: true, client, config: row };
}

/** Authenticate if needed and persist token to banco_chile_tokens. */
export async function ensureBancoChileAuth(
  supabase: SupabaseClient<Database>,
  resolved: { client: BancoChileClient; config: BancoChileConfigRow },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (resolved.client.isAccessTokenFresh()) {
    return { ok: true };
  }

  const auth = await resolved.client.authenticate();
  if (!auth.success) {
    return { ok: false, message: auth.error.message };
  }

  const { token, expiresAtMs } = resolved.client.getStoredTokenMeta();
  if (!token) return { ok: false, message: "Token vacío tras autenticar" };

  const expiresAt = new Date(expiresAtMs || Date.now() + 3600_000).toISOString();
  const payload = {
    config_id: resolved.config.id,
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? null,
    expires_at: expiresAt,
    token_type: token.token_type || "Bearer",
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("banco_chile_tokens")
    .select("id")
    .eq("config_id", resolved.config.id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("banco_chile_tokens").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("banco_chile_tokens").insert(payload);
  }

  return { ok: true };
}

/** Encrypt secret fields for storage. Returns null if encryption material missing. */
export async function sealBancoSecrets(fields: {
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
}): Promise<
  | { ok: true; sealed: Record<string, string> }
  | { ok: false; code: "encryption_key_missing" }
> {
  const hasAny = Object.values(fields).some((v) => v && v.trim());
  if (!hasAny) return { ok: true, sealed: {} };

  if (!resolveSiiEncryptionKeyBytes()) {
    if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
      return { ok: false, code: "encryption_key_missing" };
    }
    // non-prod: store plaintext
    const sealed: Record<string, string> = {};
    if (fields.clientId?.trim()) sealed.client_id = fields.clientId.trim();
    if (fields.clientSecret?.trim()) sealed.client_secret = fields.clientSecret.trim();
    if (fields.username?.trim()) sealed.username = fields.username.trim();
    if (fields.password?.trim()) sealed.password = fields.password.trim();
    return { ok: true, sealed };
  }

  const sealed: Record<string, string> = {};
  for (const [key, plainKey] of [
    ["client_id", fields.clientId],
    ["client_secret", fields.clientSecret],
    ["username", fields.username],
    ["password", fields.password],
  ] as const) {
    if (plainKey?.trim()) {
      const enc = await encryptBancoSecret(plainKey.trim());
      if (!enc) return { ok: false, code: "encryption_key_missing" };
      sealed[key] = enc;
    }
  }
  return { ok: true, sealed };
}
