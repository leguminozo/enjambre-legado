import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './env';

export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para operaciones server-only');
  }
  return createClient(getSupabaseUrl(), serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

