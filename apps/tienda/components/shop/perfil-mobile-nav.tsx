'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Repeat, ShoppingBag, Bell, Menu } from 'lucide-react';

type PerfilMobileNavProps = {
  onOpenMenu: () => void;
};

const TABS = [
  { href: '/perfil', label: 'Legado', icon: Shield },
  { href: '/perfil/ritual', label: 'Ritual', icon: Repeat },
  { href: '/perfil/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/perfil/alertas', label: 'Alertas', icon: Bell },
] as const;

export function PerfilMobileNav({ onOpenMenu }: PerfilMobileNavProps) {
  const pathname = usePathname();
  const normalized = pathname.replace(/^\/(es|en)/, '') || '/';

  return (
    <nav className="tienda-bottom-nav lg:hidden" aria-label="Navegación guardián">
      {TABS.map((tab) => {
        const isActive = normalized === tab.href || (tab.href !== '/perfil' && normalized.startsWith(tab.href));
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={`tienda-bottom-nav-item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        className="tienda-bottom-nav-item"
        aria-label="Abrir menú completo"
      >
        <Menu size={22} />
        <span>Más</span>
      </button>
    </nav>
  );
}