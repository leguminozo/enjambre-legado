'use server';

import { createClient } from '@/utils/supabase/server';

export type AccountExportPayload = {
  exported_at: string;
  law: 'Ley 21.719 — portabilidad';
  profile: Record<string, unknown> | null;
  direcciones: unknown[];
  carrito: unknown[];
  puntos: unknown[];
  pedidos: unknown[];
  nota: string;
};

export async function exportAccountData(): Promise<AccountExportPayload> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const [profile, direcciones, carrito, puntos, pedidos] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, role, notification_preferences')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('cliente_direcciones').select('id, etiqueta, comuna, ciudad, region, created_at').eq('user_id', user.id),
    supabase.from('carrito_items').select('product_id, quantity, updated_at').eq('user_id', user.id),
    supabase.from('puntos_fidelizacion').select('puntos, puntos_acumulados_total, nivel_actual, updated_at').eq('user_id', user.id),
    supabase
      .from('ventas')
      .select('id, total, created_at, channel, estado')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  return {
    exported_at: new Date().toISOString(),
    law: 'Ley 21.719 — portabilidad',
    profile: profile.data,
    direcciones: direcciones.data ?? [],
    carrito: carrito.data ?? [],
    puntos: puntos.data ?? [],
    pedidos: pedidos.data ?? [],
    nota: 'Las ventas y documentos tributarios se conservan por obligación legal (hasta 10 años).',
  };
}

export async function requestAccountDeletion(): Promise<{ ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const prefs = {
    pedidos: { email: false, in_app: false },
    floracion: { email: false, in_app: false },
    sistema: { email: false, in_app: false },
  };
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: 'Cuenta en eliminación',
      notification_preferences: prefs,
      deletion_requested_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw new Error('No se pudo registrar la solicitud');

  const { error: cartError } = await supabase.from('carrito_items').delete().eq('user_id', user.id);
  if (cartError) {
    console.error('[account-privacy] error limpiando carrito:', cartError.message);
    throw new Error('No se pudo completar la solicitud de supresión');
  }

  return { ok: true };
}

export async function deleteAccountInstantly(): Promise<{ ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const userId = user.id;
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const admin = createAdminClient();
  if (!admin) {
    throw new Error('Servicio de administración no disponible');
  }

  // 1. Limpieza de datos personales en profiles (anonimización obligatoria por Código Tributario)
  const prefs = {
    pedidos: { email: false, in_app: false },
    floracion: { email: false, in_app: false },
    sistema: { email: false, in_app: false },
  };

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: 'Titular Eliminado',
      email: `anon_${userId}@eliminado.local`,
      notification_preferences: prefs,
      deletion_requested_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('[account-privacy] error anonimizando perfil:', profileError.message);
    throw new Error('No se pudo registrar la supresión');
  }

  // 2. Limpiar elementos volátiles y disociar ventas (se conservan anonimizadas
  // por deber tributario). Un fallo detiene la revocación de Auth para permitir reintento.
  const results = await Promise.allSettled([
    admin.from('carrito_items').delete().eq('user_id', userId),
    admin.from('cliente_direcciones').delete().eq('user_id', userId),
    admin
      .from('ventas')
      .update({
        buyer_email: `anon_${userId}@eliminado.local`,
        direccion_envio: null,
        cliente_id: null,
        vendedor_id: null,
        claimed_by: null,
      })
      .eq('user_id', userId),
    admin.from('ventas').update({ cliente_id: null }).eq('cliente_id', userId),
    admin.from('ventas').update({ vendedor_id: null }).eq('vendedor_id', userId),
    admin.from('ventas').update({ claimed_by: null }).eq('claimed_by', userId),
    admin.from('security_events').delete().eq('user_id', userId),
    admin.from('tickets_fidelizacion').delete().eq('cliente_id', userId),
  ]);
  const cleanupErrors: unknown[] = [];
  for (const r of results) {
    if (r.status === 'rejected') {
      cleanupErrors.push(r.reason);
    } else if (r.value.error) {
      cleanupErrors.push(r.value.error);
    }
  }
  if (cleanupErrors.length > 0) {
    console.error('[account-privacy] limpieza incompleta; no se revoca Auth:', cleanupErrors);
    throw new Error('No se pudo completar la supresión de datos');
  }

  // 3. Borrar el usuario de Supabase Auth. Esto revoca los refresh tokens;
  // los access tokens ya emitidos caducan según su exp y no pueden revocarse retroactivamente.
  const { data: existingArco, error: arcoLookupError } = await admin
    .from('arco_solicitudes')
    .select('id')
    .eq('user_id', userId)
    .eq('tipo', 'supresion')
    .in('estado', ['pendiente', 'en_revision'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (arcoLookupError) {
    console.error('[account-privacy] no se pudo localizar la solicitud ARCO:', arcoLookupError.message);
    throw new Error('No se pudo registrar la supresión');
  }

  let arcoSolicitudId = existingArco?.id ?? null;
  if (arcoSolicitudId) {
    const { error: arcoUpdateError } = await admin
      .from('arco_solicitudes')
      .update({ estado: 'ejecutada', ejecutada_at: new Date().toISOString() })
      .eq('id', arcoSolicitudId);
    if (arcoUpdateError) {
      console.error('[account-privacy] no se pudo cerrar la solicitud ARCO:', arcoUpdateError.message);
      throw new Error('No se pudo registrar la supresión');
    }
  } else {
    const { data: insertedArco, error: arcoInsertError } = await admin
      .from('arco_solicitudes')
      .insert({
        user_id: userId,
        tipo: 'supresion',
        estado: 'ejecutada',
        motivo: 'Supresión instantánea solicitada por el titular',
        ejecutada_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (arcoInsertError || !insertedArco) {
      console.error('[account-privacy] no se pudo registrar la solicitud ARCO:', arcoInsertError?.message);
      throw new Error('No se pudo registrar la supresión');
    }
    arcoSolicitudId = insertedArco.id;
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('[account-privacy] deleteUser falló:', deleteError.message);
    if (arcoSolicitudId) {
      await admin
        .from('arco_solicitudes')
        .update({ estado: 'en_revision', notas_admin: 'La limpieza se completó, pero Auth no pudo revocar el acceso.' })
        .eq('id', arcoSolicitudId);
    }
    throw new Error('No se pudo completar la eliminación de la cuenta');
  }

  return { ok: true };
}

