import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/server-index';
import { logSecurityEvent } from '@enjambre/auth/security-events';
import type { AppVariables } from '@/api/lib/middleware';
import { requireProfileRole } from '@/api/lib/middleware';

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

// Admin: List all ARCO requests
arcoRoutes.get('/admin/solicitudes', requireProfileRole('admin'), async (c) => {
  try {
    const supabase = c.get('supabase') as any;
    const { data, error } = await supabase
      .from('arco_solicitudes')
      .select('*, profiles:user_id(id, full_name, email, role)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('[ARCO Admin] List Error:', error);
    return c.json({ code: 'internal_error', message: 'Error al listar solicitudes' }, 500);
  }
});

const UpdateArcoSchema = z.object({
  estado: z.enum(['pendiente', 'en_revision', 'ejecutada', 'rechazada', 'cancelada']),
  notas_admin: z.string().optional(),
});

// Admin: Review/update a request
arcoRoutes.patch('/admin/solicitudes/:id', requireProfileRole('admin'), zValidator('json', UpdateArcoSchema), async (c) => {
  try {
    const supabase = c.get('supabase') as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return c.json({ code: 'unauthorized', message: 'No autenticado' }, 401);

    const id = c.req.param('id');
    const body = c.req.valid('json');

    const { data, error } = await supabase
      .from('arco_solicitudes')
      .update({
        ...body,
        revisado_por: user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error) {
    console.error('[ARCO Admin] Update Error:', error);
    return c.json({ code: 'internal_error', message: 'Error al actualizar solicitud' }, 500);
  }
});

// Admin: Execute deletion (anonymize, don't hard delete)
arcoRoutes.post('/admin/solicitudes/:id/ejecutar', requireProfileRole('admin'), async (c) => {
  try {
    const supabase = c.get('supabase') as any;
    const id = c.req.param('id');
    
    // get solicitud
    const { data: solicitud, error: getError } = await supabase
      .from('arco_solicitudes')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !solicitud) {
      return c.json({ code: 'not_found', message: 'Solicitud no encontrada' }, 404);
    }
    
    // 1. Anonymize profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Usuario eliminado',
        email: `anon_${solicitud.user_id}@eliminado.local`
      })
      .eq('id', solicitud.user_id);
      
    if (profileError) throw profileError;
    
    // 2. Delete security events
    const { error: securityError } = await supabase
      .from('security_events')
      .delete()
      .eq('user_id', solicitud.user_id);
      
    if (securityError) throw securityError;

    // 3. Mark arco_solicitud as ejecutada
    const { error: updateError } = await supabase
      .from('arco_solicitudes')
      .update({
        estado: 'ejecutada',
        ejecutada_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (updateError) throw updateError;
    
    // 4. Delete auth.users record via admin client
    const adminAuth = createAdminClient();
    const { error: deleteError } = await adminAuth.auth.admin.deleteUser(solicitud.user_id);
    
    if (deleteError) {
      console.error('[ARCO Execute] Auth delete error:', deleteError);
      // We don't fail the whole operation if just the auth delete fails since it's an extra
    }

    return c.json({ success: true, message: 'Anonimización ejecutada.' });
  } catch (error) {
    console.error('[ARCO Admin] Execute Error:', error);
    return c.json({ code: 'internal_error', message: 'Error al ejecutar solicitud' }, 500);
  }
});

// Admin: Get stats
arcoRoutes.get('/admin/stats', requireProfileRole('admin'), async (c) => {
  try {
    const supabase = c.get('supabase') as any;
    const { data, error } = await supabase
      .from('arco_solicitudes')
      .select('estado, fecha_limite');

    if (error) throw error;
    
    const now = new Date();
    const stats = {
      pendientes: data.filter((s: { estado: string }) => s.estado === 'pendiente').length,
      en_revision: data.filter((s: { estado: string }) => s.estado === 'en_revision').length,
      ejecutadas: data.filter((s: { estado: string }) => s.estado === 'ejecutada').length,
      atrasadas: data.filter((s: { estado: string; fecha_limite: string }) => (s.estado === 'pendiente' || s.estado === 'en_revision') && new Date(s.fecha_limite) < now).length,
      total: data.length
    };
    
    return c.json(stats);
  } catch (error) {
    console.error('[ARCO Admin] Stats Error:', error);
    return c.json({ code: 'internal_error', message: 'Error al obtener estadísticas' }, 500);
  }
});
