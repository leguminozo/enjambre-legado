'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';
import { LogOut, Settings, ChevronDown, PanelLeftClose } from 'lucide-react';
import {
  getSidebarGroupsForRole,
  getAccountItemsForRole,
  findActiveItem,
  PREFETCH_PRIORITY_KEYS,
  resolveShellRoleKey,
  type SidebarBadge,
} from '@/config/sidebar-config';
import { toNavItemDataFromItem } from '@/components/layout/sidebar-shared';
import { getRoleRedirectPath } from '@enjambre/auth/role-redirect';
import { SidebarSection, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, ThemeToggle } from '@enjambre/ui';
import type { SidebarBadgeValues } from '@/hooks/useSidebarBadges';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

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
  const router = useRouter();
  const { prefetchMany } = useRoutePrefetch();
  const [userName, setUserName] = useState('Usuario');
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const storeSignOut = useAuthStore((s) => s.signOut);
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const accountItems = useMemo(() => getAccountItemsForRole(userRole), [userRole]);

  useEffect(() => {
    async function fetchUser() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use profiles table only (user_metadata can be spoofed)
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data?.full_name) setUserName(data.full_name);
      }
    }
    fetchUser();
  }, []);

  const allItems = useMemo(
    () => [...sidebarGroups.flatMap(g => g.items), ...accountItems],
    [sidebarGroups, accountItems],
  );

  // Prefetch en idle solo de las herramientas prioritarias; el resto se baja al hover
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

  const handleLogout = async () => {
    // signOut del store registra el evento de seguridad session_revoked
    await storeSignOut();
    router.push('/login');
  };

  const [configOpen, setConfigOpen] = useState(false);

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
    >
      <Link href={getRoleRedirectPath(userRole, 'nucleo')} className="sidebar-brand" style={{ display: 'block', textDecoration: 'none' }} onClick={() => onToggle()}>
        <div className="sidebar-brand-title">Enjambre Legado</div>
        <div className="sidebar-brand-subtitle">Apicultura Regenerativa · Chiloé</div>
      </Link>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {sidebarGroups.map(group => (
          <SidebarSection
            key={group.key}
            label={group.label}
            items={group.items.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
            activeKey={activeItem?.key}
            linkComponent={PrefetchLink}
            onItemClick={() => onToggle()}
          />
        ))}

        <SidebarSection
          label="CUENTA"
          items={accountItems.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
          activeKey={activeItem?.key}
          linkComponent={PrefetchLink}
          onItemClick={() => onToggle()}
        />
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 min-w-0 flex-1 text-left"
                aria-label="Menú de usuario"
              >
                <span className="sidebar-user-avatar" style={{ border: 'none', padding: 0 }}>
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="sidebar-user-info min-w-0">
                  <span className="sidebar-user-name truncate block">{userName}</span>
                  <span className="sidebar-user-role">{userRole}</span>
                </span>
                <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              </button>
            }
            align="start"
            sideOffset={8}
          >
            <DropdownMenuItem onSelect={() => { setConfigOpen(true); onToggle(); }}>
              <Settings size={16} className="mr-2" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => void handleLogout()}>
              <LogOut size={16} className="mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenu>
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <ThemeToggle size={20} className="text-muted-foreground hover:text-accent" />
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-accent hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Contraer panel"
                aria-label="Contraer panel"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </aside>
  );
}