'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { formatCLP } from '@/lib/shop/format';

export function MobileCartBar() {
  const pathname = usePathname();
  const { itemCount, lines } = useCartLines();
  const normalized = pathname.replace(/^\/(es|en)/, '') || '/';

  const hideOn =
    normalized.startsWith('/carrito') ||
    normalized.startsWith('/checkout') ||
    normalized.startsWith('/login') ||
    normalized.startsWith('/register') ||
    normalized.startsWith('/perfil');

  if (hideOn || itemCount === 0) return null;

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <div className="tienda-cart-bar md:hidden">
      <div className="tienda-cart-bar-inner">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag size={18} className="text-accent shrink-0" />
          <span className="text-sm text-foreground truncate">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="text-sm font-semibold text-accent">{formatCLP(subtotal)}</span>
        </div>
        <Link
          href="/carrito"
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground"
        >
          Ver carrito
        </Link>
      </div>
    </div>
  );
}