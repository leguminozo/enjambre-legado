import { Hono } from 'hono';
import type { AppVariables } from '@/api/lib/middleware';
import { authMiddleware, requireProfileRole } from '@/api/lib/middleware';

export const saludRoutes = new Hono<{ Variables: AppVariables }>();
saludRoutes.use('*', authMiddleware);
saludRoutes.use('*', requireProfileRole('admin'));

saludRoutes.get('/', async (c) => {
  const supabase = c.var.supabase as any;

  const [dbRes, syncRes, loyaltyRes] = await Promise.all([
    supabase.rpc('admin_db_health'),
    supabase.rpc('admin_sync_queue_health'),
    supabase.rpc('admin_loyalty_health')
  ]);

  if (dbRes.error) console.error('[salud] admin_db_health error:', dbRes.error);
  if (syncRes.error) console.error('[salud] admin_sync_queue_health error:', syncRes.error);
  if (loyaltyRes.error) console.error('[salud] admin_loyalty_health error:', loyaltyRes.error);

  return c.json({
    db: dbRes.data || null,
    sync: syncRes.data || null,
    loyalty: loyaltyRes.data || null,
  });
});

saludRoutes.get('/crons', async (c) => {
  const supabase = c.var.supabase as any;
  
  const [notifRes, ventasRes] = await Promise.all([
    supabase.from('notification_queue').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ventas').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle()
  ]);
  
  return c.json({
    last_notification: notifRes.data?.created_at || null,
    last_venta: ventasRes.data?.created_at || null
  });
});
