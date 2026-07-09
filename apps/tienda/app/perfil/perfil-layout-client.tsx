'use client';

import React, { useState } from 'react';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { MobileBottomNav } from '@/components/shop/mobile-bottom-nav';
import { PerfilMobileHeader } from '@/components/shop/perfil-mobile-header';
import { StorePerfilBridge } from '@/components/shop/store-perfil-bridge';
import { BeeCanvas } from '@/components/shop/bee-canvas';
import type { OyzRole } from '@/lib/shop/role';
import type { ParticipacionActiva } from '@/lib/shop/participacion';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';

interface PerfilLayoutClientProps {
  children: React.ReactNode;
  user: TiendaUserProfile | null;
  role: OyzRole;
  participacion: ParticipacionActiva;
}

export function PerfilLayoutClient({ children, user, role, participacion }: PerfilLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    document.body.classList.add('perfil-shell-active');
    return () => document.body.classList.remove('perfil-shell-active');
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <BeeCanvas />
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-background opacity-90 pointer-events-none z-0" />

      <GuardianSidebar
        user={user}
        participacion={participacion}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <PerfilMobileHeader onOpenMenu={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative perfil-shell-content">
          <div className="max-w-5xl mx-auto py-6 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-12 w-full animate-in">
            <StorePerfilBridge className="lg:hidden mb-6 sm:mb-8" />
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
