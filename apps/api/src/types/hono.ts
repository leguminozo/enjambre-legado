import type { SupabaseClient } from "@supabase/supabase-js";
import type { Hono } from "hono";

export type AppVariables = {
  user: { id: string; email?: string };
  accessToken: string;
  supabase: SupabaseClient;
  empresaId: string;
  rol: string;
};

export type AppHono = Hono<{ Variables: AppVariables }>;
