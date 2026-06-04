import React from 'react';
import { CartProvider } from '@/components/pos/cart-context';
import { CashProvider } from '@/components/pos/cash-context';
import { PosHeader } from '@/components/pos/pos-header';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CashProvider>
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
          {/* Ambient glow */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <PosHeader />
            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
              {children}
            </main>

            <footer className="py-8 text-center text-muted-foreground text-xs tracking-widest uppercase">
              Enjambre Legado — Experiential POS v2.0
            </footer>
          </div>
        </div>
      </CashProvider>
    </CartProvider>
  );
}

