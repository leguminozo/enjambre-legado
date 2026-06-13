import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { PerfilLayoutClient } from './perfil-layout-client';
import { GrainOverlay } from '@/components/ui/grain-overlay';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { getOyzRole } from '@/lib/shop/role';

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

  // Severed DB fetch here - O(0) lookup via Edge JWT claims
  const role = await getOyzRole();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <GrainOverlay />
      <CustomCursor />

      {/* Profile data fetching is now deferred to specific parallel page queries */}
      <PerfilLayoutClient user={null} role={role}>
        {children}
      </PerfilLayoutClient>
    </div>
  );
}
