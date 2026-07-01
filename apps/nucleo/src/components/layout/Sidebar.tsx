'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';
import { LogOut } from 'lucide-react';
import {
  getSidebarGroupsForRole,
  getAccountItemsForRole,
  findActiveItem,
  type SidebarBadge,
} from '@/config/sidebar-config';
import { LUCIDE_MAP, toNavItemDataFromItem } from '@/components/layout/sidebar-shared';
import type { RoleKey } from '@enjambre/auth/role-redirect';
import { SidebarSection } from '@enjambre/ui';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@enjambre/ui';

interface SidebarProps {
  onToggle: () => void;
  isOpen: boolean;
  variant?: 'full' | 'drawer';
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

export function Sidebar({ onToggle, isOpen, variant = 'full' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { prefetchMany } = useRoutePrefetch();
  const [userName, setUserName] = useState('Usuario');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { badges } = useSidebarBadges();
  const userRole = (useAuthStore((s) => s.user?.role ?? 'admin')) as RoleKey;
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const accountItems = useMemo(() => getAccountItemsForRole(userRole), [userRole]);

  const urlTienda = process.env.NEXT_PUBLIC_URL_TIENDA?.trim() || '';
  const urlCampo = process.env.NEXT_PUBLIC_URL_CAMPO?.trim() || '';

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

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const allItems = useMemo(
    () => [...sidebarGroups.flatMap(g => g.items), ...accountItems],
    [sidebarGroups, accountItems],
  );

  // Prefetch rutas del rol en idle — navegación casi instantánea al primer click
  useEffect(() => {
    const hrefs = allItems.map((item) => item.href);
    const run = () => prefetchMany(hrefs);
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 1200);
    return () => window.clearTimeout(t);
  }, [allItems, prefetchMany]);
  const filteredSearch = searchQuery.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

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
      <Link href="/" className="sidebar-brand" style={{ display: 'block', textDecoration: 'none' }} onClick={() => onToggle()}>
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
        {(urlTienda || urlCampo) && (
          <div className="px-6 pb-4 text-[0.7rem] text-muted-foreground border-b border-border">
            <div className="font-semibold tracking-wider mb-2 text-[0.65rem] text-foreground">ECOSISTEMA</div>
            <div className="flex flex-col gap-4">
              {urlTienda && (
                <a
                  href={urlTienda}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-medium"
                  onClick={() => onToggle()}
                  aria-label="Tienda web (abre en una nueva pestaña)"
                >
                  Tienda web
                </a>
              )}
              {urlCampo && (
                <a
                  href={urlCampo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-medium"
                  onClick={() => onToggle()}
                  aria-label="Terminal Campo (POS) (abre en una nueva pestaña)"
                >
                  Terminal Campo (POS)
                </a>
              )}
            </div>
          </div>
        )}
        <div className="sidebar-user">
          <Link
            href="/perfil"
            className="sidebar-user-avatar"
            onClick={() => onToggle()}
            aria-label="Ver mi perfil"
            style={{ cursor: 'pointer', border: 'none', padding: 0 }}
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{userRole}</div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle size={20} className="text-muted-foreground hover:text-accent" />
            <button
              onClick={handleLogout}
              className="btn btn-ghost p-1.5 text-muted-foreground"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}