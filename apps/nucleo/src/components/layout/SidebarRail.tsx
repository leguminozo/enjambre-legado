'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, PanelLeftOpen, LayoutGrid, User } from 'lucide-react';
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
import { ProfileMenu } from '@/components/layout/ProfileMenu';

interface SidebarRailProps {
  onExpand?: () => void;
  onOpenMenu?: () => void;
  /** Conservado por el layout; no se muestran contadores en el rail compacto */
  badges?: SidebarBadgeValues;
}

/**
 * Rail compacto (sidebar colapsada).
 * Clic en categoría con varias herramientas → acordeón hacia abajo con subiconos.
 * Un solo ítem → navega directo. Sin badges numéricos.
 */
export function SidebarRail({ onExpand, onOpenMenu }: SidebarRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const authUser = useAuthStore((s) => s.user);
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const activeItem = findActiveItem(pathname);

  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
  const railRef = useRef<HTMLElement>(null);

  // Abrir por defecto el grupo de la ruta activa (si tiene subherramientas)
  useEffect(() => {
    if (!activeItem) return;
    const group = sidebarGroups.find((g) => g.items.some((i) => i.key === activeItem.key));
    if (group && group.items.length > 1) {
      setOpenGroupKey(group.key);
    }
  }, [activeItem?.key, sidebarGroups]);

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

  const handleGroupClick = (group: SidebarGroup) => {
    if (group.items.length === 1) {
      setOpenGroupKey(null);
      router.push(group.items[0]!.href);
      return;
    }
    // Toggle acordeón: no navega a “la principal”, solo abre subherramientas
    setOpenGroupKey((k) => (k === group.key ? null : group.key));
  };

  const groupIsActive = (group: SidebarGroup) =>
    group.items.some((i) => activeItem?.key === i.key);

  const groupIcon = (group: SidebarGroup) => {
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

          return (
            <div
              key={group.key}
              className={`sidebar-rail-group ${isOpen ? 'is-open' : ''} ${isActive ? 'is-active-group' : ''}`}
            >
              <button
                type="button"
                className={`sidebar-rail-item ${isActive ? 'is-active' : ''} ${isOpen ? 'is-expanded' : ''}`}
                title={
                  multi
                    ? `${group.label}: ver herramientas`
                    : (group.items[0]?.label ?? group.label)
                }
                aria-label={
                  multi
                    ? `${group.label}: mostrar u ocultar herramientas`
                    : (group.items[0]?.label ?? group.label)
                }
                aria-expanded={multi ? isOpen : undefined}
                aria-controls={multi ? `rail-sub-${group.key}` : undefined}
                onClick={() => handleGroupClick(group)}
              >
                {Icon ? (
                  <Icon size={22} />
                ) : (
                  <span className="text-[10px] font-bold">{group.label.slice(0, 2)}</span>
                )}
                {multi && (
                  <ChevronDown
                    size={12}
                    className={`sidebar-rail-chevron ${isOpen ? 'is-open' : ''}`}
                    aria-hidden
                  />
                )}
              </button>

              {multi && (
                <div
                  id={`rail-sub-${group.key}`}
                  className={`sidebar-rail-sub ${isOpen ? 'is-open' : ''}`}
                  role="group"
                  aria-label={group.label}
                  aria-hidden={!isOpen}
                >
                  {group.items.map((item) => (
                    <SubToolLink
                      key={item.key}
                      item={item}
                      active={activeItem?.key === item.key}
                      tabIndex={isOpen ? 0 : -1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-rail-footer">
        <ProfileMenu
          side="right"
          align="end"
          userName={authUser?.full_name || authUser?.email?.split('@')[0] || 'Usuario'}
          userEmail={authUser?.email}
          userRole={userRole}
          className="w-52 p-1.5"
          trigger={
            <button
              type="button"
              className="sidebar-rail-item"
              title="Cuenta"
              aria-label="Menú de cuenta"
              aria-haspopup="menu"
            >
              <User size={20} />
            </button>
          }
        />
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
      </div>
    </aside>
  );
}

function SubToolLink({
  item,
  active,
  tabIndex,
}: {
  item: SidebarItem;
  active: boolean;
  tabIndex?: number;
}) {
  const Icon = LUCIDE_MAP[item.icon];
  return (
    <Link
      href={item.href}
      prefetch
      title={item.label}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      tabIndex={tabIndex}
      className={`sidebar-rail-sub-item ${active ? 'is-active' : ''}`}
    >
      {Icon ? <Icon size={18} /> : <span className="text-[9px] font-bold">{item.label.slice(0, 2)}</span>}
    </Link>
  );
}
