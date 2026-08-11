'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Rows3, Maximize2, Minimize2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { LiquidBottomNav } from '@/components/layout/LiquidBottomNav';
import { MobileNavSheet } from '@/components/layout/MobileNavSheet';
import { ShellBarSensor } from '@/components/layout/ShellBarSensor';
import { WorkspaceLayoutProvider, useWorkspaceLayout } from '@/providers/workspace-layout-provider';
import {
  getAccountItemsForRole,
  getSidebarGroupsForRole,
  findActiveItem,
  resolveShellRoleKey,
  routeUsesViewShell,
} from '@/config/sidebar-config';
import { NotificationBell } from '@enjambre/ui';
import { createClient, isSupabaseConfigured, useAuthStore, useInAppNotifications } from '@enjambre/auth';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { BitacoraSyncBanner } from '@/components/apicultor/BitacoraSyncBanner';
import { BitacoraSyncProvider } from '@/providers/bitacora-sync-provider';

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceLayoutProvider>
      <BitacoraSyncProvider>
        <ShellContent>{children}</ShellContent>
      </BitacoraSyncProvider>
    </WorkspaceLayoutProvider>
  );
}

/** Shell del dashboard: consume el estado del área de trabajo y emite data-attributes
 *  (data-sidebar-collapsed, data-density, data-focus) que el CSS del entorno consume. */
function ShellContent({ children }: { children: React.ReactNode }) {
  const {
    shellMode,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    density,
    toggleDensity,
    focusMode,
    toggleFocusMode,
    drawerOpen,
    openDrawer,
    closeDrawer,
    registerContentRef,
  } = useWorkspaceLayout();

  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = usePathname();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const [realtimeOn, setRealtimeOn] = useState(false);
  // Cliente memoizado: createClient() en render crea identidad nueva por frame,
  // lo que re-disparaba el efecto realtime de useInAppNotifications.
  const supabaseClient = useMemo(
    () => (isSupabaseConfigured() ? createClient() : null),
    [],
  );
  const { notifications, markRead, markAllRead, isLoading: notifLoading, error: notifError } = useInAppNotifications({
    userId,
    supabaseClient,
    app: 'nucleo',
    enableRealtime: realtimeOn,
  });
  // Un solo fetch + un solo canal realtime para toda la shell; los hijos reciben badges por props.
  const { badges } = useSidebarBadges();

  const activeItem = findActiveItem(pathname);
  const showLayoutModuleHeader = !routeUsesViewShell(pathname);
  const headerTitle = activeItem?.label ?? 'Enjambre Legado';
  const headerMission = activeItem?.mission;

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Least privilege: nunca elevar a admin si el store aún no hidrató el rol
  const userRole = resolveShellRoleKey(useAuthStore((s) => s.user?.role));
  const territorialRol = useAuthStore((s) => s.user?.territorial_rol ?? null);
  const shellOpts = useMemo(() => ({ territorialRol }), [territorialRol]);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    // Búsqueda con los ítems del rol: un territorial no debe ver módulos admin
    return [
      ...getSidebarGroupsForRole(userRole, shellOpts).flatMap((g) => g.items),
      ...getAccountItemsForRole(userRole, shellOpts),
    ].filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery, userRole, shellOpts]);

  const goToFirstResult = useCallback(() => {
    if (searchResults.length === 0) return;
    router.push(searchResults[0].href);
    closeSearch();
  }, [searchResults, router, closeSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'Enter' && searchQuery.trim()) goToFirstResult();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, searchQuery, searchResults, goToFirstResult, closeSearch]);

  return (
    <div
      className={`app-layout app-layout--${shellMode}`}
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
      data-density={density}
      data-focus={focusMode ? 'true' : 'false'}
    >
      {shellMode === 'desktop' && !sidebarCollapsed && (
        <Sidebar onToggle={() => {}} isOpen variant="full" onCollapse={toggleSidebarCollapsed} badges={badges} />
      )}

      {shellMode === 'desktop' && sidebarCollapsed && (
        <SidebarRail onExpand={toggleSidebarCollapsed} onOpenMenu={() => setNavSheetOpen(true)} badges={badges} />
      )}

      {shellMode === 'tablet' && (
        <>
          <SidebarRail onExpand={openDrawer} onOpenMenu={() => setNavSheetOpen(true)} badges={badges} />
          <div
            className="sidebar-drawer-backdrop"
            data-open={drawerOpen ? 'true' : 'false'}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <Sidebar variant="drawer" isOpen={drawerOpen} onToggle={closeDrawer} badges={badges} />
        </>
      )}

      <main className="main-content">
        <header className="main-header">
          <div className="header-left flex items-center gap-3 min-w-0">
            {showLayoutModuleHeader ? (
              <div className="header-titles min-w-0">
                <span className="header-title">{headerTitle}</span>
                {headerMission && shellMode !== 'mobile' && (
                  <span className="header-mission">{headerMission}</span>
                )}
              </div>
            ) : (
              <div className="header-titles min-w-0" aria-hidden>
                <span className="header-title sr-only">{headerTitle}</span>
              </div>
            )}
          </div>
          <div className="header-right relative flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="header-btn"
              onClick={toggleDensity}
              aria-label={density === 'compact' ? 'Cambiar a vista espaciosa' : 'Cambiar a vista compacta'}
              aria-pressed={density === 'compact'}
              title={density === 'compact' ? 'Vista compacta (más datos)' : 'Vista espaciosa'}
            >
              <Rows3 size={18} />
            </button>

            {shellMode !== 'mobile' && (
              <button
                type="button"
                className="header-btn"
                onClick={toggleFocusMode}
                aria-label={focusMode ? 'Salir de modo foco' : 'Modo foco: usar todo el ancho disponible'}
                aria-pressed={focusMode}
                title={focusMode ? 'Salir de modo foco' : 'Modo foco'}
              >
                {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}

            <button
              className="header-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
            >
              <Search size={18} />
            </button>

            <NotificationBell
              notifications={notifications}
              isLoading={notifLoading}
              error={notifError}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onOpenChange={(isOpen) => {
                if (isOpen) setRealtimeOn(true);
              }}
            />

            {searchOpen && (
              <div
                id="header-search-panel"
                role="region"
                aria-label="Buscador"
                className="absolute top-[calc(100%+12px)] right-0 w-[min(340px,calc(100vw-2rem))] bg-card border border-border rounded-lg shadow-xl z-[60] overflow-hidden animate-in"
              >
                <div className="p-3 sm:p-4 border-b border-border">
                  <div className="flex items-center gap-2 min-h-11 px-3 bg-background rounded-sm border border-border">
                    <Search size={16} className="text-muted-foreground shrink-0" aria-hidden />
                    <input
                      type="search"
                      placeholder="Buscar en Enjambre Legado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Buscar en Enjambre Legado"
                      autoFocus
                      className="border-none bg-transparent outline-none flex-1 min-h-11 font-datos text-[0.85rem] text-foreground"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpiar búsqueda"
                        className="bg-muted/50 border-none cursor-pointer text-muted-foreground min-h-11 min-w-11 rounded-full flex items-center justify-center shrink-0"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={closeSearch}
                        aria-label="Cerrar buscador"
                        className="bg-transparent border-none cursor-pointer text-muted-foreground min-h-11 min-w-11 rounded-full flex items-center justify-center shrink-0 hover:text-foreground"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {searchResults.length > 0 ? (
                  <ul role="listbox" aria-label="Resultados" className="max-h-[min(58vh,420px)] overflow-y-auto p-2">
                    {searchResults.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={closeSearch}
                          role="option"
                          aria-selected={item.key === searchResults[0].key}
                          className="flex flex-col justify-center gap-0.5 min-h-11 px-3 py-2 rounded-md text-foreground hover:bg-accent/10 hover:text-accent border border-transparent hover:border-accent/15 transition-colors"
                        >
                          <span className="text-[0.85rem] font-medium">{item.label}</span>
                          <span className="text-[0.72rem] text-muted-foreground truncate">{item.mission}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.trim() ? (
                  <p className="px-4 py-5 text-[0.85rem] text-muted-foreground">
                    Sin resultados para «{searchQuery.trim()}»
                  </p>
                ) : (
                  <p className="px-4 py-5 text-[0.8rem] text-muted-foreground">
                    Escribe para buscar entre los módulos del enjambre…
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Patio/admin: cola local de bitácora (PR6) */}
        <BitacoraSyncBanner />

        <div
          ref={registerContentRef}
          className="page-content page-content--shell view-deep"
          onClick={() => setSearchOpen(false)}
        >
          {children}
        </div>
      </main>

      {/* Siempre en DOM: CSS oculta en tablet/desktop; evita flash sin nav en móvil (SSR). */}
      <LiquidBottomNav
        onOpenMenu={() => setNavSheetOpen(true)}
        menuOpen={navSheetOpen}
      />
      <MobileNavSheet open={navSheetOpen} onClose={() => setNavSheetOpen(false)} badges={badges} />
      <ShellBarSensor />
    </div>
  );
}
