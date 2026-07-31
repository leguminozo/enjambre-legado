import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";

/**
 * Acceso a tablas/columnas presentes en runtime pero aún no (o desfasadas) en
 * `database.types.ts` (CRM legacy, cosechas.empresa_id, RPCs, etc.).
 *
 * Preferir `supabase.from(...)` tipado cuando el typegen ya cubre la tabla.
 * Grep: `fromLoose` / `rpcLoose` para deuda de typegen.
 *
 * El escape (`as unknown as`) es local y controlado: el `Database` real del repo
 * se mantiene fuera del boundary en el caller y nunca se propaga `any` a los
 * consumidores. Las APIs `.from(string)` / `.rpc(fn, args)` que supra-js expone
 * tienen sobrecargas genéricas `DefaultSchema`, así que devolvemos el cliente con
 * el esquema genérico por defecto en lugar de `any`.
 */
type LooseClient = SupabaseClient;

export function looseClient(supabase: SupabaseClient<Database>): LooseClient {
  return supabase as unknown as LooseClient;
}

export function fromLoose(
  supabase: SupabaseClient<Database>,
  table: string,
) {
  return looseClient(supabase).from(table);
}

export function rpcLoose(
  supabase: SupabaseClient<Database>,
  fn: string,
  args?: Record<string, unknown>,
) {
  return looseClient(supabase).rpc(fn, args ?? {});
}
