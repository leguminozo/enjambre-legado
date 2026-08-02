'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { LogOut, PanelLeftOpen, LayoutGrid } from 'lucide-react';
import {
  getAccountItemsForRole,
  getSidebarGroupsForRole,
  findActiveItem,
  RAIL_PRIMARY_KEYS,
} from '@/config/sidebar-config';
import { getRoleRedirectPath, type RoleKey } from '@enjambre/auth/role-redirect';
import { useAuthStore } from '@enjambre/auth';
import type { SidebarBadgeValues } from '@/hooks/useSidebarBadges';
import { LUCIDE_MAP } from '@/components/layout/sidebar-shared';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@enjambre/ui';

interface SidebarRailProps {
  onExpand?: () => void;
  /** Abre el mapa completo de módulos (MobileNavSheet) — tablet/desktop colapsado */
  onOpenMenu?: () => void;
  badges: SidebarBadgeValues;
}

/** Rail compacto tablet — iconos + tooltips, inspiración WebSidebar project 14 */
export function SidebarRail({ onExpand, onOpenMenu, badges }: SidebarRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = (useAuthStore((s) => s.user?.role ?? 'admin')) as RoleKey;
  const storeSignOut = useAuthStore((s) => s.signOut);
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const accountItems = useMemo(() => getAccountItemsForRole(userRole), [userRole]);
  const activeItem = findActiveItem(pathname);

  const primaryItems = useMemo(() => {
    const flat = sidebarGroups.flatMap((g) => g.items);
    const primary = flat.filter((i) =>
      (RAIL_PRIMARY_KEYS as readonly string[]).includes(i.key),
    );
    // Rol sin módulos primarios (p. ej. territorial): el rail muestra su grupo completo
    return primary.length > 0 ? primary : flat.slice(0, 6);
  }, [sidebarGroups]);

  const handleLogout = async () => {
    // signOut del store registra el evento de seguridad session_revoked
    await storeSignOut();
    router.push('/login');
  };

  return (
    <aside className="sidebar-rail" aria-label="Navegación compacta">
      <Link
        href={getRoleRedirectPath(userRole, 'nucleo')}
        className="sidebar-rail-brand"
        aria-label="Enjambre Legado"
      >
        <span className="sidebar-rail-mark">EL</span>
      </Link>

      <nav className="sidebar-rail-nav" aria-label="Módulos principales">
        {primaryItems.map((item) => {
          const Icon = LUCIDE_MAP[item.icon];
          const isActive = activeItem?.key === item.key;
          const badge = badges[item.key as keyof typeof badges];
          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch
              className={`sidebar-rail-item ${isActive ? 'is-active' : ''}`}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon ? <Icon size={22} /> : null}
              {badge && <span className="sidebar-rail-badge" aria-hidden />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-rail-footer">
        {accountItems.map((item) => {
          const Icon = LUCIDE_MAP[item.icon];
          const isActive = activeItem?.key === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch
              className={`sidebar-rail-item ${isActive ? 'is-active' : ''}`}
              title={item.label}
              aria-label={item.label}
            >
              {Icon ? <Icon size={20} /> : null}
            </Link>
          );
        })}
        <ThemeToggle size={18} className="sidebar-rail-theme" />
        {onExpand && (
          <button
            type="button"
            className="sidebar-rail-item"
            onClick={onExpand}
            title="Expandir panel"
            aria-label="Expandir panel"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        {onOpenMenu && (
          <button
            type="button"
            className="sidebar-rail-item"
            onClick={onOpenMenu}
            title="Todos los módulos"
            aria-label="Todos los módulos"
            aria-haspopup="dialog"
          >
            <LayoutGrid size={20} />
          </button>
        )}
        <button
          type="button"
          className="sidebar-rail-item"
          onClick={() => void handleLogout()}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}