'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { MobileBottomNav } from '@/components/shop/mobile-bottom-nav';
import { PerfilMobileHeader } from '@/components/shop/perfil-mobile-header';
import { BeeCanvas } from '@/components/shop/bee-canvas';
import { useLegacyDevice } from '@enjambre/ui';
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
  const { legacy, motionReduced } = useLegacyDevice();
  const pathname = usePathname();

  const isUtilityScreen = ['/perfil/ajustes', '/perfil/direcciones', '/perfil/logros'].some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );

  React.useEffect(() => {
    document.body.classList.add('perfil-shell-active');
    return () => document.body.classList.remove('perfil-shell-active');
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Canvas 30fps full-screen: caro en iPhone 7 (2GB RAM) — off en tier legacy / reduced-motion / pantallas utilitarias */}
      {!legacy && !motionReduced && !isUtilityScreen ? <BeeCanvas className="z-0" /> : null}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-background opacity-90 pointer-events-none z-0" />

      <GuardianSidebar
        user={user}
        participacion={participacion}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <PerfilMobileHeader onOpenMenu={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 perfil-shell-content">
          <div className="max-w-6xl mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 w-full animate-in">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
