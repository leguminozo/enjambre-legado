import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from './env';

let client: SupabaseClient | null = null;

export function createAnonServerClient(): SupabaseClient {
  if (client) return client;
  client = createSupabaseClient(getSupabaseUrl(), getSupabaseKey());
  return client;
}
