import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { PerfilLayoutClient } from './perfil-layout-client';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { resolveOyzRole } from '@/lib/shop/role';
import { getParticipacionActiva } from '@/lib/shop/participacion';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';
import { createClient as createVanillaClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from '@enjambre/auth/server-index';

/** Cache per-user (60s) para participacion/perfil: el layout se re-ejecuta
 * en cada navegación entre secciones del perfil y esas llamadas eran el lag
 * percibido al cambiar de pestaña. La sesión (getUser) y headers() quedan frescos, sin cache. */
const getPerfilContextCached = unstable_cache(
  async (userId: string, accessToken: string) => {
    // Vanilla client con el token para evitar cookies() dentro de unstable_cache
    const supabase = createVanillaClient(getSupabaseUrl(), getSupabaseKey(), {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    
    const participacion = await getParticipacionActiva(supabase, userId);
    let profile = null;
    try {
      const res = await supabase
        .from('profiles')
        .select('id, full_name, email, role, arboles_personal')
        .eq('id', userId)
        .maybeSingle();
      if (res.error) {
        console.warn('[perfil-layout] Error al cargar perfil:', res.error.message);
        const fallbackRes = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', userId)
          .maybeSingle();
        profile = fallbackRes.data ? { ...fallbackRes.data, arboles_personal: 0 } : null;
      } else {
        profile = res.data;
      }
    } catch (err) {
      console.error('[perfil-layout] Error inesperado:', err);
    }
    return { participacion, profile };
  },
  ['perfil-context'],
  { revalidate: 60, tags: ['perfil-context'] },
);

export default async function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Validar el JWT y la sesión con el servidor auth (regla inviolable de seguridad)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // 2. Extraer el access_token para pasarlo al cliente dentro de unstable_cache
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token || '';

  // Obtenemos el rol desde los headers/JWT (no puede ir en unstable_cache)
  const role = await resolveOyzRole(user);

  const { participacion, profile } = await getPerfilContextCached(user.id, accessToken);

  const tiendaUser = toTiendaUserProfile(
    profile
      ? {
          id: user.id,
          full_name: profile.full_name,
          email: profile.email ?? user.email,
          role: profile.role,
          arboles_personal: profile.arboles_personal,
        }
      : null,
  );

  return (
    <div className="perfil-shell h-[var(--vh-full)] overflow-hidden bg-background text-foreground flex">
      <CustomCursor />

      <PerfilLayoutClient user={tiendaUser} role={role} participacion={participacion}>
        <Suspense
          fallback={
            <div className="space-y-4 animate-pulse" aria-busy="true">
              <div className="h-8 w-2/3 bg-surface-raised rounded-lg" />
              <div className="h-40 bg-surface-raised rounded-2xl" />
              <div className="h-40 bg-surface-raised rounded-2xl" />
            </div>
          }
        >
          {children}
        </Suspense>
      </PerfilLayoutClient>
    </div>
  );
}
