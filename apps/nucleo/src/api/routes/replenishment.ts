import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { verifyInternalApiKey } from '@enjambre/auth/internal-api-secret';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const replenishmentRoutes = new Hono();

/** Cron de renovación reposición (RPC legacy: process_ritual_renewals). */
replenishmentRoutes.post('/cron/process', async (c) => {
  if (!verifyInternalApiKey(c.req.header('x-internal-key'))) {
    return c.json({ code: 'unauthorized' }, 401);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('process_ritual_renewals');

  if (error) {
    console.error('[replenishment-cron] error:', error.message);
    return c.json({ code: 'cron_failed', message: error.message }, 500);
  }

  return c.json({ ok: true, result: data });
});