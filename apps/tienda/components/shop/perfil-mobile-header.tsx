'use client';

import Link from 'next/link';
import { Grid3X3, Menu, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartLines } from '@/components/shop/cart-context';

type PerfilMobileHeaderProps = {
  onOpenMenu: () => void;
};

export function PerfilMobileHeader({ onOpenMenu }: PerfilMobileHeaderProps) {
  const tNav = useTranslations('nav');
  const tPerfil = useTranslations('perfil');
  const tHeader = useTranslations('header');
  const { itemCount } = useCartLines();

  return (
    <header className="tienda-shop-header lg:hidden flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-md">
      <Link href="/perfil" className="flex flex-col min-w-0 group">
        <span className="font-display text-[0.6rem] tracking-[0.28em] uppercase text-accent leading-none">
          {tNav('legacy')}
        </span>
        <span className="font-display text-sm tracking-tight text-foreground truncate group-hover:text-accent transition-colors">
          {tPerfil('header.title')}
        </span>
      </Link>

      <div className="flex items-center shrink-0">
        <Link
          href="/catalogo"
          prefetch
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          aria-label={tNav('store')}
        >
          <Grid3X3 size={22} strokeWidth={1.75} />
        </Link>

        <Link
          href="/carrito"
          prefetch
          data-testid="perfil-cart-link"
          className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          aria-label={tNav('cart')}
        >
          <ShoppingBag size={22} strokeWidth={1.75} />
          {itemCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[0.55rem] font-bold flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onOpenMenu}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          aria-label={tHeader('openMenu')}
        >
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}