import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { PerfilLayoutClient } from './perfil-layout-client';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { getOyzRole } from '@/lib/shop/role';
import { getParticipacionActiva } from '@/lib/shop/participacion';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

/** Cache per-user (60s) para role/participacion/perfil: el layout se re-ejecuta
 * en cada navegación entre secciones del perfil y esas 4 llamadas eran el lag
 * percibido al cambiar de pestaña. La sesión (getUser) queda fresca, sin cache. */
const getPerfilContextCached = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient();
    const role = await getOyzRole();
    const participacion = await getParticipacionActiva(supabase, userId);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, arboles_personal')
      .eq('id', userId)
      .maybeSingle();
    return { role, participacion, profile };
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

  const { role, participacion, profile } = await getPerfilContextCached(user.id);

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
