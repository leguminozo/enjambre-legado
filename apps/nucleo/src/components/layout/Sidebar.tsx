'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';
import { PanelLeftClose, X } from 'lucide-react';
import {
  getSidebarGroupsForRole,
  findActiveItem,
  PREFETCH_PRIORITY_KEYS,
  resolveShellRoleKey,
  type SidebarBadge,
} from '@/config/sidebar-config';
import { toNavItemDataFromItem } from '@/components/layout/sidebar-shared';
import { getRoleRedirectPath } from '@enjambre/auth/role-redirect';
import { SidebarSection } from '@enjambre/ui';
import type { SidebarBadgeValues } from '@/hooks/useSidebarBadges';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { ProfileMenu } from '@/components/layout/ProfileMenu';

interface SidebarProps {
  onToggle: () => void;
  isOpen: boolean;
  variant?: 'full' | 'drawer';
  onCollapse?: () => void;
  badges: SidebarBadgeValues;
}

function PrefetchLink({
  href,
  onMouseEnter,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  const { prefetch } = useRoutePrefetch();
  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={(e) => {
        const path = typeof href === 'string' ? href : (href.pathname ?? '');
        if (path) prefetch(path);
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ onToggle, isOpen, variant = 'full', onCollapse, badges }: SidebarProps) {
  const pathname = usePathname();
  const { prefetchMany } = useRoutePrefetch();
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const authUser = useAuthStore((s) => s.user);
  const territorialRol = authUser?.territorial_rol ?? null;
  const shellOpts = useMemo(
    () => ({ territorialRol, pathname }),
    [territorialRol, pathname],
  );
  const sidebarGroups = useMemo(
    () => getSidebarGroupsForRole(userRole, shellOpts),
    [userRole, shellOpts],
  );

  useEffect(() => {
    async function fetchUser() {
      if (authUser?.full_name) {
        setUserName(authUser.full_name);
        setUserEmail(authUser.email ?? '');
        return;
      }
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? '');
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) setUserName(data.full_name);
      }
    }
    void fetchUser();
  }, [authUser?.full_name, authUser?.email]);

  const allItems = useMemo(
    () => sidebarGroups.flatMap((g) => g.items),
    [sidebarGroups],
  );

  useEffect(() => {
    const priority = new Set<string>(PREFETCH_PRIORITY_KEYS as readonly string[]);
    const hrefs = allItems.filter((item) => priority.has(item.key)).map((item) => item.href);
    if (hrefs.length === 0) return;
    const run = () => prefetchMany(hrefs);
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 1200);
    return () => window.clearTimeout(t);
  }, [allItems, prefetchMany]);

  const activeItem = findActiveItem(pathname);

  const badgeOverrides = useMemo(() => {
    const map: Record<string, SidebarBadge> = {};
    const entries = Object.entries(badges) as [string, SidebarBadge][];
    for (const [key, value] of entries) {
      if (value) map[key] = value;
    }
    return map;
  }, [badges]);

  return (
    <aside
      id="sidebar-navigation"
      className={`sidebar sidebar--${variant} ${isOpen ? 'open' : ''}`}
      aria-label="Menú de navegación lateral"
      aria-hidden={variant === 'drawer' && !isOpen ? true : undefined}
      inert={variant === 'drawer' && !isOpen ? true : undefined}
    >
      <Link
        href="/inicio"
        className="sidebar-brand"
        style={{ display: 'block', textDecoration: 'none' }}
        onClick={() => onToggle()}
      >
        <div className="sidebar-brand-title">Enjambre Legado</div>
        <div className="sidebar-brand-subtitle">
          {userRole === 'territorial' || userRole === 'apicultor' || territorialRol
            ? 'Registro Territorial Apícola'
            : 'Apicultura Regenerativa · Chiloé'}
        </div>
      </Link>

      {variant === 'drawer' && (
        <button
          type="button"
          className="sidebar-drawer-close"
          onClick={() => onToggle()}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      )}

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {sidebarGroups.map((group) => (
          <SidebarSection
            key={group.key}
            sectionKey={group.key}
            label={group.label}
            collapsible={group.collapsible !== false}
            items={group.items.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
            activeKey={activeItem?.key}
            linkComponent={PrefetchLink}
            onItemClick={() => onToggle()}
          />
        ))}
      </nav>

      {/* Perfil: menú compacto (Trama-style) → config grande solo si se elige */}
      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <ProfileMenu
            side="top"
            align="start"
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            onNavigate={variant === 'drawer' ? () => onToggle() : undefined}
            className="w-[min(16.5rem,calc(100vw-2rem))] p-1.5"
            trigger={
              <button
                type="button"
                className="sidebar-user-btn"
                aria-haspopup="menu"
                aria-label="Menú de cuenta"
              >
                <span className="sidebar-user-avatar" aria-hidden>
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="sidebar-user-info min-w-0">
                  <span className="sidebar-user-name truncate block">{userName}</span>
                  <span className="sidebar-user-role truncate block">
                    Cuenta y ajustes
                  </span>
                </span>
              </button>
            }
          />
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="sidebar-collapse-btn"
              title="Menú compacto (solo iconos)"
              aria-label="Contraer panel a iconos"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
