'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Search, Settings, X } from 'lucide-react';
import {
  getSidebarGroupsForRole,
  findActiveItem,
  resolveShellRoleKey,
  type SidebarItem,
} from '@/config/sidebar-config';
import { useAuthStore } from '@enjambre/auth';
import { SidebarSection } from '@enjambre/ui';
import type { SidebarBadgeValues } from '@/hooks/useSidebarBadges';
import { toNavItemDataFromItem } from '@/components/layout/sidebar-shared';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

type MobileNavSheetProps = {
  open: boolean;
  onClose: () => void;
  badges: SidebarBadgeValues;
};

function NavLink(props: React.ComponentProps<typeof Link>) {
  return <Link {...props} />;
}

export function MobileNavSheet({ open, onClose, badges }: MobileNavSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const territorialRol = useAuthStore((s) => s.user?.territorial_rol ?? null);
  const shellOpts = useMemo(() => ({ territorialRol, pathname }), [territorialRol, pathname]);
  const signOut = useAuthStore((s) => s.signOut);
  const [query, setQuery] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const sidebarGroups = useMemo(
    () => getSidebarGroupsForRole(userRole, shellOpts),
    [userRole, shellOpts],
  );
  const activeItem = findActiveItem(pathname);

  const allItems = useMemo(
    () => sidebarGroups.flatMap((g) => g.items),
    [sidebarGroups],
  );

  const q = query.trim().toLowerCase();
  const configSearchHit =
    Boolean(q) &&
    ['configuración', 'configuracion', 'cuenta', 'perfil', 'sesión', 'sesion', 'cerrar'].some(
      (term) => term.startsWith(q) || q.length >= 4 && term.includes(q),
    );
  const filtered = q
    ? allItems.filter((item) => item.label.toLowerCase().includes(q))
    : null;

  // Único camino de cierre: resetea la búsqueda y devuelve el control al abridor.
  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);
  // onClose llega inline desde el layout (identidad nueva por render): ref para
  // que el listener de Escape no se re-suscriba en cada render del padre.
  const onCloseRef = useRef(handleClose);
  useEffect(() => {
    onCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    if (open) {
      lastActiveRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.style.overflow = 'hidden';
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => {
        document.body.style.overflow = '';
        window.clearTimeout(t);
      };
    }
    document.body.style.overflow = '';
    lastActiveRef.current?.focus();
    lastActiveRef.current = null;
    return undefined;
  }, [open]);

  // Escape cierra el diálogo; el foco vuelve al elemento que lo abrió (al cerrar).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const badgeOverrides = useMemo(() => {
    const map: Record<string, NonNullable<SidebarItem['badge']>> = {};
    for (const [key, value] of Object.entries(badges)) {
      if (value) map[key] = value;
    }
    return map;
  }, [badges]);

  return (
    <>
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
              onClick={handleClose}
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
                  <p className="mobile-nav-sheet-eyebrow">
                    {userRole === 'territorial' || userRole === 'apicultor' || territorialRol
                      ? 'Registro Territorial Apícola'
                      : 'Enjambre Legado'}
                  </p>
                  <h2 className="mobile-nav-sheet-title">
                    {activeItem?.greeting ?? 'Explora el enjambre'}
                  </h2>
                  {activeItem?.mission && (
                    <p className="mobile-nav-sheet-mission">{activeItem.mission}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="mobile-nav-sheet-close"
                  onClick={handleClose}
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
                  filtered.length === 0 && !configSearchHit ? (
                    <p className="mobile-nav-sheet-empty">Sin resultados para «{query}»</p>
                  ) : (
                    <ul className="mobile-nav-sheet-results">
                      {filtered.map((item) => (
                        <li key={item.key}>
                          <Link
                            href={item.href}
                            prefetch
                            className={`mobile-nav-sheet-result ${pathname.startsWith(item.href) ? 'is-active' : ''}`}
                            onClick={handleClose}
                          >
                            <span>{item.label}</span>
                            <span className="mobile-nav-sheet-result-hint">{item.mission}</span>
                          </Link>
                        </li>
                      ))}
                      {configSearchHit && (
                        <li>
                          <button
                            type="button"
                            className="mobile-nav-sheet-result w-full text-left"
                            onClick={() => {
                              handleClose();
                              window.setTimeout(() => setConfigOpen(true), 180);
                            }}
                          >
                            <span>Configuración</span>
                            <span className="mobile-nav-sheet-result-hint">
                              Perfil, preferencias, seguridad y cerrar sesión
                            </span>
                          </button>
                        </li>
                      )}
                    </ul>
                  )
                ) : (
                  <>
                    {sidebarGroups.map((group) => (
                      <SidebarSection
                        key={group.key}
                        sectionKey={group.key}
                        label={group.label}
                        collapsible={group.collapsible ?? true}
                        items={group.items.map((item) => toNavItemDataFromItem(item, badgeOverrides))}
                        activeKey={activeItem?.key}
                        linkComponent={NavLink}
                        onItemClick={handleClose}
                      />
                    ))}
                    <div className="mobile-nav-sheet-account" role="group" aria-label="Cuenta">
                      <p className="mobile-nav-sheet-account-label">Cuenta</p>
                      <button
                        type="button"
                        className="mobile-nav-sheet-account-btn"
                        onClick={() => {
                          handleClose();
                          // Abrir tras cerrar el sheet para evitar pelea de focus traps
                          window.setTimeout(() => setConfigOpen(true), 180);
                        }}
                      >
                        <Settings size={18} aria-hidden />
                        <span>Configuración</span>
                      </button>
                      <button
                        type="button"
                        className="mobile-nav-sheet-account-btn is-danger"
                        onClick={() => {
                          void (async () => {
                            handleClose();
                            await signOut();
                            router.push('/login');
                          })();
                        }}
                      >
                        <LogOut size={18} aria-hidden />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}