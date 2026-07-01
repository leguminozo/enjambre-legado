'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Hexagon, Calculator, Settings, LayoutGrid } from 'lucide-react';
import { BOTTOM_NAV_KEYS, SIDEBAR_GROUPS, ACCOUNT_ITEMS } from '@/config/sidebar-config';

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  ejecutivo: BarChart3,
  colmenas: Hexagon,
  contabilidad: Calculator,
  sistema: Settings,
};

const LABELS: Record<string, string> = {
  ejecutivo: 'Inicio',
  colmenas: 'Colmenas',
  contabilidad: 'Contable',
  sistema: 'Sistema',
};

type LiquidBottomNavProps = {
  onOpenMenu: () => void;
  menuOpen?: boolean;
};

function resolveNavItem(key: string, pathname: string) {
  const allItems = [...SIDEBAR_GROUPS.flatMap((g) => g.items), ...ACCOUNT_ITEMS];
  const item = allItems.find((i) => i.key === key);
  if (!item) return null;
  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  return { href: item.href, label: LABELS[key] ?? item.label, isActive };
}

export function LiquidBottomNav({ onOpenMenu, menuOpen }: LiquidBottomNavProps) {
  const pathname = usePathname();

  const tabs = BOTTOM_NAV_KEYS.map((key) => {
    const nav = resolveNavItem(key, pathname);
    if (!nav) return null;
    const Icon = ICONS[key];
    return { key, ...nav, Icon };
  }).filter(Boolean) as Array<{
    key: string;
    href: string;
    label: string;
    isActive: boolean;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  }>;

  const activeIndex = tabs.findIndex((t) => t.isActive);

  return (
    <nav className="liquid-bottom-nav" aria-label="Navegación principal móvil">
      <div className="liquid-bottom-nav-glass">
        {activeIndex >= 0 && (
          <motion.div
            className="liquid-bottom-nav-indicator"
            layoutId="liquid-nav-indicator"
            initial={false}
            animate={{
              left: `calc(${((activeIndex + 0.5) / (tabs.length + 1)) * 100}% - 28px)`,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}

        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            prefetch
            className={`liquid-bottom-nav-item ${tab.isActive ? 'is-active' : ''}`}
            aria-current={tab.isActive ? 'page' : undefined}
            aria-label={tab.label}
          >
            <tab.Icon size={22} strokeWidth={tab.isActive ? 2.5 : 2} />
            <span className="liquid-bottom-nav-label">{tab.label}</span>
            {tab.isActive && <span className="liquid-bottom-nav-dot" aria-hidden />}
          </Link>
        ))}

        <button
          type="button"
          className={`liquid-bottom-nav-item liquid-bottom-nav-menu ${menuOpen ? 'is-active' : ''}`}
          onClick={onOpenMenu}
          aria-label="Abrir mapa del enjambre"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-sheet"
        >
          <LayoutGrid size={22} strokeWidth={menuOpen ? 2.5 : 2} />
          <span className="liquid-bottom-nav-label">Mapa</span>
        </button>
      </div>
    </nav>
  );
}