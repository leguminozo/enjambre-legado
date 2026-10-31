'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Network, Hexagon, Calculator, Settings, Map, LayoutGrid, NotebookPen, CalendarDays, Users,
  TriangleAlert, Truck, FileText,
} from 'lucide-react';
import {
  getBottomNavKeysForRole,
  getSidebarGroupsForRole,
  getAccountItemsForRole,
  resolveShellRoleKey,
  isNavItemActive,
  findActiveItem,
  type SidebarItem,
} from '@/config/sidebar-config';
import { useAuthStore } from '@enjambre/auth';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

/** Keys de bottom nav por rol — incluir iconos de patio (apicultor) y territorio. */
const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  inicio: Network,
  colmenas: Hexagon,
  'cuaderno-campo': NotebookPen,
  'ciclo-bosque': CalendarDays,
  contabilidad: Calculator,
  configuracion: Settings,
  territorio: Map,
  'registro-comunal': Users,
  'mis-planes': NotebookPen,
  'alertas-red': TriangleAlert,
  trashumancia: Truck,
  'mapa-red': Map,
  'declaracion-sag': FileText,
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
  return {
    href: item.href,
    label: item.label,
    isActive: isNavItemActive(pathname, key),
    isModal: false as const,
  };
}

export function LiquidBottomNav({ onOpenMenu, menuOpen }: LiquidBottomNavProps) {
  const pathname = usePathname();
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const authUser = useAuthStore((s) => s.user);
  const territorialRol = authUser?.territorial_rol ?? null;
  const customModules = authUser?.custom_modules ?? null;
  const shellOpts = useMemo(() => ({ territorialRol, customModules, pathname, includeHiddenContexts: true }), [territorialRol, customModules, pathname]);
  const [configOpen, setConfigOpen] = useState(false);
  const allItems = useMemo(
    () => [
      ...getSidebarGroupsForRole(userRole, shellOpts).flatMap((g) => g.items),
      ...getAccountItemsForRole(userRole, shellOpts),
    ],
    [userRole, shellOpts],
  );

  const tabs = getBottomNavKeysForRole(userRole, shellOpts)
    .map((key) => {
      const nav = resolveNavItem(key, pathname, allItems);
      if (!nav) return null;
      const Icon = ICONS[key] ?? LayoutGrid;
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
  const activeItemKey = findActiveItem(pathname)?.key;
  const overflowActive =
    Boolean(menuOpen) ||
    (Boolean(activeItemKey) &&
      !tabs.some((t) => !t.isModal && t.key === activeItemKey));

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
            className={`liquid-bottom-nav-item liquid-bottom-nav-menu ${overflowActive ? 'is-active' : ''}`}
            onClick={onOpenMenu}
            aria-label="Abrir todos los módulos"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-sheet"
          >
            <LayoutGrid size={22} strokeWidth={overflowActive ? 2.5 : 2} />
            <span className="liquid-bottom-nav-label">Módulos</span>
            {overflowActive && !menuOpen && <span className="liquid-bottom-nav-dot" aria-hidden />}
          </button>
        </div>
      </nav>
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}