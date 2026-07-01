'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import {
  getAccountItemsForRole,
  getSidebarGroupsForRole,
  findActiveItem,
  type SidebarItem,
} from '@/config/sidebar-config';
import type { RoleKey } from '@enjambre/auth/role-redirect';
import { useAuthStore } from '@enjambre/auth';
import { SidebarSection } from '@enjambre/ui';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { toNavItemDataFromItem } from '@/components/layout/sidebar-shared';

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
  const pathname = usePathname();
  const userRole = (useAuthStore((s) => s.user?.role ?? 'admin')) as RoleKey;
  const { badges } = useSidebarBadges();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sidebarGroups = useMemo(() => getSidebarGroupsForRole(userRole), [userRole]);
  const accountItems = useMemo(() => getAccountItemsForRole(userRole), [userRole]);
  const activeItem = findActiveItem(pathname);

  const allItems = useMemo(
    () => [...sidebarGroups.flatMap((g) => g.items), ...accountItems],
    [sidebarGroups, accountItems],
  );

  const filtered = query.trim()
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : null;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => {
        document.body.style.overflow = '';
        window.clearTimeout(t);
      };
    }
    document.body.style.overflow = '';
    setQuery('');
    return undefined;
  }, [open]);

  const badgeOverrides = useMemo(() => {
    const map: Record<string, NonNullable<SidebarItem['badge']>> = {};
    for (const [key, value] of Object.entries(badges)) {
      if (value) map[key] = value;
    }
    return map;
  }, [badges]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="mobile-nav-sheet-backdrop"
            aria-label="Cerrar navegación"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            id="mobile-nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Mapa del enjambre"
            className="mobile-nav-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <div className="mobile-nav-sheet-handle" aria-hidden />

            <header className="mobile-nav-sheet-header">
              <div>
                <p className="mobile-nav-sheet-eyebrow">Enjambre Legado</p>
                <h2 className="mobile-nav-sheet-title">
                  {activeItem?.greeting ?? 'Mapa del bosque'}
                </h2>
                {activeItem?.mission && (
                  <p className="mobile-nav-sheet-mission">{activeItem.mission}</p>
                )}
              </div>
              <button
                type="button"
                className="mobile-nav-sheet-close"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </header>

            <div className="mobile-nav-sheet-search">
              <Search size={16} className="text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar módulo..."
                aria-label="Buscar módulo"
                className="mobile-nav-sheet-search-input"
              />
            </div>

            <nav className="mobile-nav-sheet-nav" aria-label="Todos los módulos">
              {filtered ? (
                filtered.length === 0 ? (
                  <p className="mobile-nav-sheet-empty">Sin resultados para «{query}»</p>
                ) : (
                  <ul className="mobile-nav-sheet-results">
                    {filtered.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          prefetch
                          className={`mobile-nav-sheet-result ${pathname.startsWith(item.href) ? 'is-active' : ''}`}
                          onClick={onClose}
                        >
                          <span>{item.label}</span>
                          <span className="mobile-nav-sheet-result-hint">{item.mission}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <>
                  {sidebarGroups.map((group) => (
                    <SidebarSection
                      key={group.key}
                      label={group.label}
                      items={group.items.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
                      activeKey={activeItem?.key}
                      linkComponent={Link}
                      onItemClick={onClose}
                    />
                  ))}
                  <SidebarSection
                    label="CUENTA"
                    items={accountItems.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
                    activeKey={activeItem?.key}
                    linkComponent={Link}
                    onItemClick={onClose}
                  />
                </>
              )}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}