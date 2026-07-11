import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";

/**
 * Acceso a tablas/columnas presentes en runtime pero aún no (o desfasadas) en
 * `database.types.ts` (CRM legacy, cosechas.empresa_id, RPCs, etc.).
 *
 * Preferir `supabase.from(...)` tipado cuando el typegen ya cubre la tabla.
 * Grep: `fromLoose` / `rpcLoose` para deuda de typegen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = SupabaseClient<any>;

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
