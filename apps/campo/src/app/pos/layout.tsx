import React from 'react';
import { CartProvider } from '@/components/pos/cart-context';
import { PosHeader } from '@/components/pos/pos-header';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-[#D4A017] selection:text-black">
        {/* Ambient glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#D4A017]/5 blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#D4A017]/5 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <PosHeader />
          <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
            {children}
          </main>
          
          <footer className="py-8 text-center text-stone-600 text-xs tracking-widest uppercase">
            Enjambre Legado — Experiential POS v2.0
          </footer>
        </div>
      </div>
    </CartProvider>
  );
}

