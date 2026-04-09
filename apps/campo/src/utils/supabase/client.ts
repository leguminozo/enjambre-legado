import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseKey());
}
