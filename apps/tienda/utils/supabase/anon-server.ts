import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from './env';

export function createAnonServerClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseKey());
}
