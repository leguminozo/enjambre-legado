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
    supabase.from('cliente_direcciones').select('id, alias, comuna, ciudad, region, created_at').eq('user_id', user.id),
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

  await supabase.from('carrito_items').delete().eq('user_id', user.id);

  return { ok: true };
}

export async function deleteAccountInstantly(): Promise<{ ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const userId = user.id;

  // 1. Limpieza de datos personales en profiles (anonimización obligatoria por Código Tributario)
  const prefs = {
    pedidos: { email: false, in_app: false },
    floracion: { email: false, in_app: false },
    sistema: { email: false, in_app: false },
  };

  await supabase
    .from('profiles')
    .update({
      full_name: 'Titular Eliminado',
      notification_preferences: prefs,
      deletion_requested_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // 2. Limpiar elementos volátiles
  await Promise.all([
    supabase.from('carrito_items').delete().eq('user_id', userId),
    supabase.from('cliente_direcciones').delete().eq('user_id', userId),
  ]);

  // 3. Registrar en arco_solicitudes si la tabla existe
  try {
    await supabase.from('arco_solicitudes').insert({
      user_id: userId,
      tipo: 'supresion',
      estado: 'ejecutada',
      motivo: 'Supresión instantánea solicitada por el titular',
      ejecutada_at: new Date().toISOString(),
    });
  } catch {
    /* ignore si aún no migrado */
  }

  // 4. Borrar el usuario de Supabase Auth para revocar acceso inmediato
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const admin = createAdminClient();
  if (admin) {
    await admin.auth.admin.deleteUser(userId);
  }

  return { ok: true };
}

