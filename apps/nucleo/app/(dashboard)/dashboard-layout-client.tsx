'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { LiquidBottomNav } from '@/components/layout/LiquidBottomNav';
import { MobileNavSheet } from '@/components/layout/MobileNavSheet';
import { findActiveItem } from '@/config/sidebar-config';
import { NotificationBell } from '@enjambre/ui';
import { createClient, isSupabaseConfigured, useAuthStore, useInAppNotifications } from '@enjambre/auth';
import { useShellLayout } from '@/hooks/use-shell-layout';

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const shellMode = useShellLayout();
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const userId = useAuthStore((s) => s.user?.id);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const supabaseClient = isSupabaseConfigured() ? createClient() : null;
  const { notifications, markRead, markAllRead, isLoading: notifLoading, error: notifError } = useInAppNotifications({
    userId,
    supabaseClient,
    app: 'nucleo',
    enableRealtime: realtimeOn,
  });

  const activeItem = findActiveItem(pathname);
  const headerTitle = activeItem?.label ?? 'Enjambre Legado';
  const headerMission = activeItem?.mission;

  return (
    <div className={`app-layout app-layout--${shellMode}`}>
      {shellMode === 'desktop' && (
        <Sidebar onToggle={() => {}} isOpen variant="full" />
      )}

      {shellMode === 'tablet' && <SidebarRail />}

      <main className="main-content">
        <header className="main-header">
          <div className="header-left flex items-center gap-3 min-w-0">
            <div className="header-titles min-w-0">
              <span className="header-title">{headerTitle}</span>
              {headerMission && shellMode !== 'mobile' && (
                <span className="header-mission">{headerMission}</span>
              )}
            </div>
          </div>
          <div className="header-right relative flex items-center gap-3 shrink-0">
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
                className="absolute top-[calc(100%+12px)] right-0 w-[min(340px,calc(100vw-2rem))] bg-card border border-border rounded-lg shadow-xl z-60 overflow-hidden animate-in"
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-sm border border-border">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar en Enjambre Legado..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Buscar en Enjambre Legado"
                      className="border-none bg-transparent outline-none flex-1 font-datos text-[0.85rem] text-foreground"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpiar búsqueda"
                        className="bg-muted/50 border-none cursor-pointer text-muted-foreground p-1 rounded-full flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div
          className="page-content page-content--shell view-deep"
          onClick={() => setSearchOpen(false)}
        >
          {children}
        </div>
      </main>

      {shellMode === 'mobile' && (
        <>
          <LiquidBottomNav
            onOpenMenu={() => setNavSheetOpen(true)}
            menuOpen={navSheetOpen}
          />
          <MobileNavSheet open={navSheetOpen} onClose={() => setNavSheetOpen(false)} />
        </>
      )}
    </div>
  );
}