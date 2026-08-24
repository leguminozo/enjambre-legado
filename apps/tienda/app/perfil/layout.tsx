import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { PerfilLayoutClient } from './perfil-layout-client';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { resolveOyzRole } from '@/lib/shop/role';
import { getParticipacionActiva } from '@/lib/shop/participacion';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

import { createAdminClient } from '@enjambre/auth/server-index';

/** Cache per-user (60s) para participacion/perfil: el layout se re-ejecuta
 * en cada navegación entre secciones del perfil y esas llamadas eran el lag
 * percibido al cambiar de pestaña. La sesión (getUser) y headers() quedan frescos, sin cache. */
const getPerfilContextCached = unstable_cache(
  async (userId: string) => {
    // Usamos admin client para no acceder a cookies() dentro de unstable_cache
    const supabaseAdmin = createAdminClient();
    const participacion = await getParticipacionActiva(supabaseAdmin, userId);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, arboles_personal')
      .eq('id', userId)
      .maybeSingle();
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtenemos el rol desde los headers/JWT (no puede ir en unstable_cache)
  const role = await resolveOyzRole(user);

  const { participacion, profile } = await getPerfilContextCached(user.id);

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
