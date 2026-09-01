import { Hono } from 'hono';
import { createAdminClient } from '@enjambre/auth/server-index';
import { logSecurityEvent } from '@enjambre/auth/security-events';
import type { AppVariables } from '@/api/lib/middleware';

export const arcoRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * GET /api/arco/export
 * Exporta todos los datos personales del usuario (Derecho a la Portabilidad).
 */
arcoRoutes.get('/export', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return c.json({ code: 'unauthorized', message: 'No autenticado' }, 401);
    }

    // Recolectar datos usando el cliente normal (RLS aplicará y solo verá los suyos)
    const [profileRes, actoresRes, apiariosRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('actores_registro').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('apiarios_registro').select('*'), // RLS filtrará por su actor
    ]);

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profileRes.data,
      actor_territorial: actoresRes.data,
      apiarios: apiariosRes.data || [],
      metadata: {
        exported_at: new Date().toISOString(),
        version: '1.0',
        ley: 'Cumplimiento Ley 21.719 - Portabilidad',
      },
    };

    return c.json(exportData);
  } catch (error) {
    console.error('[ARCO Export] Error:', error);
    return c.json({ code: 'internal_error', message: 'Error al exportar datos' }, 500);
  }
});

/**
 * DELETE /api/arco/me
 * Elimina permanentemente la cuenta del usuario (Derecho al Olvido / Cancelación).
 */
arcoRoutes.delete('/me', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return c.json({ code: 'unauthorized', message: 'No autenticado' }, 401);
    }

    // Registrar el evento de seguridad antes de borrar
    await logSecurityEvent(supabase, {
      eventType: 'arco_solicitado',
      userId: user.id,
      email: user.email ?? 'unknown',
      details: { reason: 'ARCO - Derecho al Olvido' },
      appSource: 'nucleo-bff',
      ipAddress: c.req.header('x-forwarded-for') || 'unknown',
      userAgent: c.req.header('user-agent'),
    });

    // Usar admin client para borrar el usuario de Auth (cascading borra profile y actor)
    const adminAuth = createAdminClient();
    const { error: deleteError } = await adminAuth.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('[ARCO Delete] Error de Supabase Admin:', deleteError);
      return c.json({ code: 'delete_failed', message: 'No se pudo eliminar la cuenta.' }, 500);
    }

    return c.json({ success: true, message: 'Cuenta eliminada permanentemente.' });
  } catch (error) {
    console.error('[ARCO Delete] Error:', error);
    return c.json({ code: 'internal_error', message: 'Error inesperado al eliminar' }, 500);
  }
});
