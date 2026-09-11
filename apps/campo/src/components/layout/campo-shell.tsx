'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CampoSidebar } from './campo-sidebar';
import { CampoBottomNav } from './campo-bottom-nav';
import { CampoMobileHeader } from './campo-mobile-header';
import { CartProvider } from '@/components/pos/cart-context';
import { CashProvider } from '@/components/pos/cash-context';
import { FeriaProvider } from '@/components/pos/feria-context';
import { SumUpProvider } from '@/components/pos/sumup-context';

export function CampoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicLanding =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/setup-error' ||
    pathname === '/reset-password';

  const shellContent = (
    <div className="flex h-[var(--vh-full)] w-full overflow-hidden bg-background text-foreground">
      {!isPublicLanding && <CampoSidebar />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        {!isPublicLanding && <CampoMobileHeader />}
        <main
          className={`flex-1 overflow-y-auto custom-scrollbar ${
            isPublicLanding
              ? ''
              : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0'
          }`}
        >
          {children}
        </main>

        {!isPublicLanding && <CampoBottomNav />}
      </div>
    </div>
  );

  if (isPublicLanding) {
    return shellContent;
  }

  return (
    <CartProvider>
      <CashProvider>
        <FeriaProvider>
          <SumUpProvider>
            {shellContent}
          </SumUpProvider>
        </FeriaProvider>
      </CashProvider>
    </CartProvider>
  );
}
