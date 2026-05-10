import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { PerfilLayoutClient } from './perfil-layout-client';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { CustomCursor } from '@/components/shop/custom-cursor';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <GrainOverlay />
      <CustomCursor />

      <PerfilLayoutClient user={profile}>
        {children}
      </PerfilLayoutClient>
    </div>
  );
}
