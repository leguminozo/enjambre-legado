import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { SumUpClient } from "@enjambre/sumup";
import { decryptSiiSecret, encryptSiiSecret, resolveSiiEncryptionKeyBytes } from "./sii-crypto";

export type SumUpConfigRow = {
  api_key: string;
  merchant_code: string;
  environment: string;
  enabled: boolean;
  last_sync?: string | null;
  sync_interval_minutes?: number;
};

/**
 * Resolve plaintext API key. Supports:
 * - AES-GCM ciphertext (new, via encryptSiiSecret)
 * - legacy plaintext (pre-encryption)
 */
export async function resolveSumUpApiKey(stored: string | null | undefined): Promise<string | null> {
  if (!stored?.trim()) return null;
  const decrypted = await decryptSiiSecret(stored);
  if (decrypted) return decrypted;
  // Legacy plaintext keys still work until operator re-saves in UI
  return stored.trim();
}

export async function encryptSumUpApiKey(plaintext: string): Promise<string | null> {
  if (!resolveSiiEncryptionKeyBytes()) return null;
  return encryptSiiSecret(plaintext);
}

export type SumUpClientResolved =
  | { ok: true; client: SumUpClient; config: SumUpConfigRow }
  | { ok: false; code: "no_config" | "no_credentials" | "disabled"; message: string };

/**
 * Build SumUpClient for empresa. By default requires enabled=true (POS/sync path).
 * Pass requireEnabled:false for config smoke tests.
 */
export async function resolveSumUpClient(
  supabase: SupabaseClient<Database>,
  empresaId: string,
  opts?: { requireEnabled?: boolean },
): Promise<SumUpClientResolved> {
  const requireEnabled = opts?.requireEnabled !== false;

  let query = supabase
    .from("sumup_config")
    .select("api_key, merchant_code, environment, enabled, last_sync, sync_interval_minutes")
    .eq("empresa_id", empresaId);

  if (requireEnabled) {
    query = query.eq("enabled", true);
  }

  const { data: config, error } = await query.maybeSingle();

  if (error || !config) {
    return {
      ok: false,
      code: "no_config",
      message: "SumUp no configurado. Guardá merchant + API key en Pagos SumUp → Configuración.",
    };
  }

  if (requireEnabled && !config.enabled) {
    return {
      ok: false,
      code: "disabled",
      message: "SumUp está deshabilitado. Activá la integración en Configuración.",
    };
  }

  const apiKey = await resolveSumUpApiKey(config.api_key);
  if (!apiKey || !config.merchant_code) {
    return {
      ok: false,
      code: "no_credentials",
      message: "Faltan credenciales SumUp (API key o merchant code).",
    };
  }

  const client = new SumUpClient({
    apiKey,
    merchantCode: config.merchant_code,
    environment: config.environment === "live" ? "live" : "test",
  });

  return {
    ok: true,
    client,
    config: config as SumUpConfigRow,
  };
}
