import { createClient } from '@/utils/supabase/client';

const client = createClient();
if (!client) {
  throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = client;
