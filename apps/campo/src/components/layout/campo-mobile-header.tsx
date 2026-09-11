'use client';

import React from 'react';
import Link from 'next/link';
import { Hexagon, ShoppingBag } from 'lucide-react';
import { useOptionalCart } from '@/components/pos/cart-context';
import { CampoProfileMenu } from './campo-profile-menu';

export function CampoMobileHeader() {
  const cart = useOptionalCart();
  const cartItemsCount = cart ? cart.lines.reduce((s, l) => s + l.cantidad, 0) : 0;

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-4 pt-[max(0.6rem,env(safe-area-inset-top))] pb-3">
      <Link href="/pos" className="flex items-center gap-2.5 min-h-11">
        <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
          <Hexagon size={18} />
        </div>
        <div className="flex flex-col">
          <span className="font-display tracking-[0.15em] text-xs uppercase text-foreground leading-none">
            Enjambre
          </span>
          <span className="font-display tracking-[0.1em] text-accent text-[11px] italic leading-none mt-0.5">
            Campo
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {cartItemsCount > 0 && (
          <Link
            href="/pos/carrito"
            className="relative flex items-center justify-center min-h-11 min-w-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors"
            aria-label={`Ver carrito (${cartItemsCount} productos)`}
          >
            <ShoppingBag size={20} />
            <span className="absolute top-1.5 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[1.1rem] text-center leading-tight">
              {cartItemsCount}
            </span>
          </Link>
        )}
        <CampoProfileMenu compact side="bottom" align="end" />
      </div>
    </header>
  );
}
