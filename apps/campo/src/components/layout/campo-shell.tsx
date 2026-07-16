'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CampoSidebar } from './campo-sidebar';
import { CampoBottomNav } from './campo-bottom-nav';

export function CampoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // POS tiene layout propio a pantalla completa; el resto usa shell editorial.
  const isPosWorkspace = pathname.startsWith('/pos');
  const isPublicLanding = pathname === '/' || pathname === '/login' || pathname === '/setup-error';

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {!isPosWorkspace && !isPublicLanding && <CampoSidebar />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <main
          className={`flex-1 overflow-y-auto custom-scrollbar ${
            isPublicLanding ? '' : 'pb-16 lg:pb-0'
          }`}
        >
          {isPosWorkspace || isPublicLanding ? (
            children
          ) : (
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8 animate-in">
              {children}
            </div>
          )}
        </main>

        {!isPublicLanding && <CampoBottomNav />}
      </div>
    </div>
  );
}
