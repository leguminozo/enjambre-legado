import { Hono } from 'hono';
import { createAdminClient } from '@enjambre/auth/server-index';
import { verifyInternalApiKey } from '@enjambre/auth/internal-api-secret';

export const replenishmentRoutes = new Hono();

/** Cron de renovación reposición (RPC legacy: process_ritual_renewals). */
replenishmentRoutes.post('/cron/process', async (c) => {
  if (!verifyInternalApiKey(c.req.header('x-internal-key'))) {
    return c.json({ code: 'unauthorized' }, 401);
  }

  const admin = createAdminClient({ persistSession: false });
  const { data, error } = await admin.rpc('process_ritual_renewals');

  if (error) {
    console.error('[replenishment-cron] error:', error.message);
    return c.json({ code: 'cron_failed', message: error.message }, 500);
  }

  return c.json({ ok: true, result: data });
});