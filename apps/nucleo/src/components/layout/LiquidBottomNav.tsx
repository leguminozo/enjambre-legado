'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Network, Hexagon, Calculator, Settings, Map, LayoutGrid } from 'lucide-react';
import {
  getBottomNavKeysForRole,
  getSidebarGroupsForRole,
  getAccountItemsForRole,
  resolveShellRoleKey,
  type SidebarItem,
} from '@/config/sidebar-config';
import { useAuthStore } from '@enjambre/auth';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  inicio: Network,
  colmenas: Hexagon,
  contabilidad: Calculator,
  configuracion: Settings,
  territorio: Map,
};

type LiquidBottomNavProps = {
  onOpenMenu: () => void;
  menuOpen?: boolean;
};

function resolveNavItem(key: string, pathname: string, allItems: SidebarItem[]) {
  const item = allItems.find((i) => i.key === key);
  if (!item) return null;
  // Config se abre como modal: no marca la ruta /configuracion como activa en tabs
  if (key === 'configuracion') {
    return { href: item.href, label: item.label, isActive: false, isModal: true as const };
  }
  const isActive =
    key === 'territorio'
      ? pathname === '/territorio' ||
        pathname === '/registro-territorial' ||
        pathname.startsWith(item.href)
      : pathname.startsWith(item.href);
  return { href: item.href, label: item.label, isActive, isModal: false as const };
}

export function LiquidBottomNav({ onOpenMenu, menuOpen }: LiquidBottomNavProps) {
  const pathname = usePathname();
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const [configOpen, setConfigOpen] = useState(false);
  const allItems = [
    ...getSidebarGroupsForRole(userRole).flatMap((g) => g.items),
    ...getAccountItemsForRole(userRole),
  ];

  const tabs = getBottomNavKeysForRole(userRole)
    .map((key) => {
      const nav = resolveNavItem(key, pathname, allItems);
      if (!nav) return null;
      const Icon = ICONS[key];
      return { key, ...nav, Icon };
    })
    .filter(Boolean) as Array<{
    key: string;
    href: string;
    label: string;
    isActive: boolean;
    isModal: boolean;
    Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  }>;

  const activeIndex = tabs.findIndex((t) => t.isActive);

  return (
    <>
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

          {tabs.map((tab) =>
            tab.isModal ? (
              <button
                key={tab.key}
                type="button"
                className={`liquid-bottom-nav-item ${configOpen ? 'is-active' : ''}`}
                aria-label={tab.label}
                aria-haspopup="dialog"
                aria-expanded={configOpen}
                onClick={() => setConfigOpen(true)}
              >
                <tab.Icon size={22} strokeWidth={configOpen ? 2.5 : 2} />
                <span className="liquid-bottom-nav-label">{tab.label}</span>
                {configOpen && <span className="liquid-bottom-nav-dot" aria-hidden />}
              </button>
            ) : (
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
            ),
          )}

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
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}