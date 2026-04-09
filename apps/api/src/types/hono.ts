import type { SupabaseClient } from "@supabase/supabase-js";

export type AppVariables = {
  user: { id: string; email?: string };
  accessToken: string;
  supabase: SupabaseClient;
  empresaId: string;
  rol: string;
};
