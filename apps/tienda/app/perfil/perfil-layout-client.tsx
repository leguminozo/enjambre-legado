'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { PerfilMobileNav } from '@/components/shop/perfil-mobile-nav';
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

  return (
    <div className="flex w-full min-h-screen overflow-hidden relative">
      <BeeCanvas />
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-background opacity-90 pointer-events-none z-0" />

      <GuardianSidebar
        user={user}
        participacion={participacion}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="tienda-shop-header lg:hidden flex items-center justify-between p-6 border-b border-border sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-display font-bold text-lg">
              E
            </div>
            <span className="text-foreground font-display text-sm tracking-tight">Mi Legado</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative perfil-shell-content">
          <div className="max-w-5xl mx-auto py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-12 w-full animate-in">
            {children}
          </div>
        </main>
        <PerfilMobileNav onOpenMenu={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
