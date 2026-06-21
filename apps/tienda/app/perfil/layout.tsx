import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { PerfilLayoutClient } from './perfil-layout-client';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { getOyzRole } from '@/lib/shop/role';
import { getParticipacionActiva } from '@/lib/shop/participacion';
import { toTiendaUserProfile } from '@/lib/shop/user-profile';

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

  const role = await getOyzRole();
  const participacion = await getParticipacionActiva(supabase, user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, arboles_personal')
    .eq('id', user.id)
    .maybeSingle();

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
    <div className="min-h-screen bg-background text-foreground flex">
      <CustomCursor />

      <PerfilLayoutClient user={tiendaUser} role={role} participacion={participacion}>
        {children}
      </PerfilLayoutClient>
    </div>
  );
}
