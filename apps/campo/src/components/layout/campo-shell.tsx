'use client';

import React from 'react';
import { CampoSidebar } from './campo-sidebar';
import { CampoBottomNav } from './campo-bottom-nav';

export function CampoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar para Desktop/Tablet */}
      <CampoSidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8 animate-in">
            {children}
          </div>
        </main>

        {/* Barra de navegación móvil */}
        <CampoBottomNav />
      </div>
    </div>
  );
}
