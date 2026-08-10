'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, PanelLeftOpen, LayoutGrid, User } from 'lucide-react';
import {
  getSidebarGroupsForRole,
  findActiveItem,
  resolveShellRoleKey,
  type SidebarGroup,
  type SidebarItem,
} from '@/config/sidebar-config';
import { getRoleRedirectPath } from '@enjambre/auth/role-redirect';
import { useAuthStore } from '@enjambre/auth';
import type { SidebarBadgeValues } from '@/hooks/useSidebarBadges';
import { LUCIDE_MAP } from '@/components/layout/sidebar-shared';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

interface SidebarRailProps {
  onExpand?: () => void;
  onOpenMenu?: () => void;
  badges: SidebarBadgeValues;
}

/**
 * Rail compacto: un icono por grupo de herramientas.
 * Clic en grupo multi-ítem → flyout con subiconos; un solo ítem → navega.
 * Perfil abre ConfigModal (config + logout).
 */
export function SidebarRail({ onExpand, onOpenMenu, badges }: SidebarRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const storeSignOut = useAuthStore((s) => s.signOut);
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const activeItem = findActiveItem(pathname);

  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenGroupKey(null);
  }, [pathname]);

  useEffect(() => {
    if (!openGroupKey) return;
    const onDoc = (e: MouseEvent) => {
      if (!railRef.current?.contains(e.target as Node)) {
        setOpenGroupKey(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroupKey(null);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [openGroupKey]);

  const handleLogout = async () => {
    await storeSignOut();
    router.push('/login');
  };

  const handleGroupClick = (group: SidebarGroup) => {
    if (group.items.length === 1) {
      setOpenGroupKey(null);
      router.push(group.items[0]!.href);
      return;
    }
    setOpenGroupKey((k) => (k === group.key ? null : group.key));
  };

  const groupIsActive = (group: SidebarGroup) =>
    group.items.some((i) => activeItem?.key === i.key);

  const groupIcon = (group: SidebarGroup) => {
    // Prefer first item icon as group face
    const key = group.items[0]?.icon;
    return key ? LUCIDE_MAP[key] : null;
  };

  return (
    <aside ref={railRef} className="sidebar-rail" aria-label="Navegación compacta">
      <Link
        href={getRoleRedirectPath(userRole, 'nucleo')}
        className="sidebar-rail-brand"
        aria-label="Enjambre Legado"
      >
        <span className="sidebar-rail-mark">EL</span>
      </Link>

      <nav className="sidebar-rail-nav" aria-label="Grupos de módulos">
        {sidebarGroups.map((group) => {
          const Icon = groupIcon(group);
          const isActive = groupIsActive(group);
          const isOpen = openGroupKey === group.key;
          const multi = group.items.length > 1;
          const badge = group.items.some(
            (i) => badges[i.key as keyof typeof badges],
          );

          return (
            <div key={group.key} className="sidebar-rail-group">
              <button
                type="button"
                className={`sidebar-rail-item ${isActive ? 'is-active' : ''} ${isOpen ? 'is-flyout-open' : ''}`}
                title={group.label}
                aria-label={
                  multi
                    ? `${group.label}: mostrar herramientas`
                    : group.items[0]?.label ?? group.label
                }
                aria-expanded={multi ? isOpen : undefined}
                aria-haspopup={multi ? 'menu' : undefined}
                onClick={() => handleGroupClick(group)}
              >
                {Icon ? <Icon size={22} /> : <span className="text-[10px] font-bold">{group.label.slice(0, 2)}</span>}
                {badge && <span className="sidebar-rail-badge" aria-hidden />}
                {multi && (
                  <span className="sidebar-rail-group-count" aria-hidden>
                    {group.items.length}
                  </span>
                )}
              </button>

              {multi && isOpen && (
                <div
                  className="sidebar-rail-flyout"
                  role="menu"
                  aria-label={group.label}
                >
                  <p className="sidebar-rail-flyout-label">{group.label}</p>
                  <ul className="sidebar-rail-flyout-list">
                    {group.items.map((item) => (
                      <FlyoutItem
                        key={item.key}
                        item={item}
                        active={activeItem?.key === item.key}
                        badge={Boolean(badges[item.key as keyof typeof badges])}
                        onNavigate={() => setOpenGroupKey(null)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-rail-footer">
        <button
          type="button"
          className="sidebar-rail-item"
          onClick={() => setConfigOpen(true)}
          title="Configuración y cuenta"
          aria-label="Abrir configuración y cuenta"
          aria-haspopup="dialog"
        >
          <User size={20} />
        </button>
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

      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </aside>
  );
}

function FlyoutItem({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: SidebarItem;
  active: boolean;
  badge: boolean;
  onNavigate: () => void;
}) {
  const Icon = LUCIDE_MAP[item.icon];
  return (
    <li role="none">
      <Link
        href={item.href}
        prefetch
        role="menuitem"
        className={`sidebar-rail-flyout-item ${active ? 'is-active' : ''}`}
        onClick={onNavigate}
      >
        {Icon ? (
          <span className="shrink-0 inline-flex">
            <Icon size={18} />
          </span>
        ) : null}
        <span className="truncate">{item.label}</span>
        {badge && <span className="sidebar-rail-flyout-dot" aria-hidden />}
      </Link>
    </li>
  );
}
