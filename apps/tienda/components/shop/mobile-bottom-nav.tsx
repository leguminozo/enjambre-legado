'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, QrCode, User, Grid3X3 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-context';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';

const TABS = [
  { href: '/', label: 'Inicio', icon: Home, match: (p: string) => p === '/' },
  { href: '/catalogo', label: 'Tienda', icon: Grid3X3, match: (p: string) => p.startsWith('/catalogo') || p.startsWith('/producto') },
  { href: '/qr-scan', label: 'Escanear', icon: QrCode, match: (p: string) => p.startsWith('/qr-scan') },
  { href: '/perfil', label: 'Legado', icon: User, match: (p: string) => p.startsWith('/perfil') },
  { href: '/carrito', label: 'Bolsa', icon: ShoppingBag, match: (p: string) => p.startsWith('/carrito') || p.startsWith('/checkout') },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isPwa = usePwaStandalone();
  const normalized = pathname.replace(/^\/(es|en)/, '') || '/';

  if (!isPwa) return null;

  return (
    <nav className="tienda-bottom-nav md:hidden" aria-label="Navegacion principal">
      {TABS.map((tab) => {
        const href = tab.href === '/perfil' && !isAuthenticated ? '/login' : tab.href;
        const isActive = tab.match(normalized);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={href}
            prefetch
            className={`tienda-bottom-nav-item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}