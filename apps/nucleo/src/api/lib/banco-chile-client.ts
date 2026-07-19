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

  return { ok: true, client, config: row };
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
