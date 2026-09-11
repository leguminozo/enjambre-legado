import React from 'react';
import { FeriaContextBanner } from '@/components/pos/feria-context-banner';
import { SyncStatusBanner } from '@/components/pos/sync-status-banner';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[var(--vh-full)] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-[var(--vh-full)]">
        <FeriaContextBanner />
        <SyncStatusBanner />
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </div>

        <footer className="py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-muted-foreground text-xs tracking-widest uppercase">
          Enjambre Legado — Experiential POS v2.0
        </footer>
      </div>
    </div>
  );
}

