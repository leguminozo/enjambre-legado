'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { LogOut } from 'lucide-react';
import {
  getAccountItemsForRole,
  getSidebarGroupsForRole,
  findActiveItem,
} from '@/config/sidebar-config';
import type { RoleKey } from '@enjambre/auth/role-redirect';
import { useAuthStore } from '@enjambre/auth';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { LUCIDE_MAP } from '@/components/layout/sidebar-shared';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@enjambre/ui';

/** Rail compacto tablet — iconos + tooltips, inspiración WebSidebar project 14 */
export function SidebarRail() {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = (useAuthStore((s) => s.user?.role ?? 'admin')) as RoleKey;
  const { badges } = useSidebarBadges();
  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const accountItems = useMemo(() => getAccountItemsForRole(userRole), [userRole]);
  const activeItem = findActiveItem(pathname);

  const primaryItems = useMemo(() => {
    const flat = sidebarGroups.flatMap((g) => g.items);
    const keys = new Set(['ejecutivo', 'colmenas', 'contabilidad', 'catalogo', 'operaciones', 'crm']);
    return flat.filter((i) => keys.has(i.key));
  }, [sidebarGroups]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="sidebar-rail" aria-label="Navegación compacta">
      <Link href="/ejecutivo" className="sidebar-rail-brand" aria-label="Enjambre Legado">
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