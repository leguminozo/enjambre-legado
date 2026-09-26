import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';

export const saludRoutes = new Hono<{ Variables: AppVariables }>();
saludRoutes.use('*', authMiddleware);
saludRoutes.use('*', requireProfileRole('admin'));

saludRoutes.get('/', async (c) => {
  const supabase = c.var.supabase;

  const [dbRes, syncRes, loyaltyRes, webhooksRes, cronsRes, umbralesRes, queueRes] = await Promise.all([
    supabase.rpc('admin_db_health'),
    supabase.rpc('admin_sync_queue_health'),
    supabase.rpc('admin_loyalty_health'),
    supabase.rpc('admin_webhooks_health'),
    supabase.rpc('admin_crons_health'),
    supabase.from('salud_umbrales').select('key, warning, critical'),
    supabase.from('notification_queue').select('id, status', { count: 'exact' }).eq('status', 'pending').limit(1),
  ]);

  if (dbRes.error) console.error('[salud] admin_db_health error:', dbRes.error);
  if (syncRes.error) console.error('[salud] admin_sync_queue_health error:', syncRes.error);
  if (loyaltyRes.error) console.error('[salud] admin_loyalty_health error:', loyaltyRes.error);
  if (webhooksRes.error) console.error('[salud] admin_webhooks_health error:', webhooksRes.error);
  if (cronsRes.error) console.error('[salud] admin_crons_health error:', cronsRes.error);

  const umbrales: Record<string, { warning: number; critical: number }> = {};
  for (const row of (umbralesRes.data ?? []) as Array<{ key: string; warning: number; critical: number }>) {
    umbrales[row.key] = { warning: Number(row.warning), critical: Number(row.critical) };
  }

  return c.json({
    db: dbRes.data || null,
    sync: syncRes.data || null,
    loyalty: loyaltyRes.data || null,
    webhooks: webhooksRes.data || null,
    crons: cronsRes.data || null,
    umbrales,
    queue_pending: typeof queueRes.count === 'number' ? queueRes.count : null,
  });
});

const UmbralesPatchSchema = z.object({
  warning: z.number().nonnegative(),
  critical: z.number().positive(),
}).refine((v) => v.warning < v.critical, { message: 'warning debe ser menor que critical' });

// PATCH /api/salud/umbrales/:key — ajustar semáforo (solo admin)
saludRoutes.patch('/umbrales/:key', zValidator('json', UmbralesPatchSchema), async (c) => {
  const supabase = c.var.supabase;
  const key = c.req.param('key');
  const body = c.req.valid('json');

  const { data, error } = await supabase
    .from('salud_umbrales')
    .update({ warning: body.warning, critical: body.critical, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('key, warning, critical')
    .maybeSingle();

  if (error) return c.json({ code: 'update_failed', message: error.message }, 500);
  if (!data) return c.json({ code: 'not_found', message: 'Umbral no existe' }, 404);
  return c.json({ data });
});

saludRoutes.get('/crons', async (c) => {
  const supabase = c.var.supabase;
  
  const [notifRes, ventasRes] = await Promise.all([
    supabase.from('notification_queue').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ventas').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()
  ]);
  
  return c.json({
    last_notification: notifRes.data?.created_at || null,
    last_venta: ventasRes.data?.created_at || null
  });
});
