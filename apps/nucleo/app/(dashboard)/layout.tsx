'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Menu, X, BarChart3, Hexagon, Calculator, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { findActiveItem, BOTTOM_NAV_KEYS, SIDEBAR_GROUPS, ACCOUNT_ITEMS } from '@/config/sidebar-config';

interface NotificationItem {
  id: number;
  text: string;
  type: 'danger' | 'warning' | 'success' | 'gold';
  time: string;
}

const notifications: NotificationItem[] = [];

const bottomNavIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  ejecutivo: BarChart3,
  colmenas: Hexagon,
  contabilidad: Calculator,
  sistema: Settings,
};

const bottomNavLabels: Record<string, string> = {
  ejecutivo: 'Inicio',
  colmenas: 'Colmenas',
  contabilidad: 'Contable',
  sistema: 'Config',
};

const notifColorMap: Record<string, string> = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  gold: 'bg-accent',
};

function getBottomNavItem(key: string, pathname: string) {
  const allItems = [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS];
  const item = allItems.find(i => i.key === key);
  if (!item) return null;
  const IconComp = bottomNavIcons[key];
  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  return {
    href: item.href,
    label: bottomNavLabels[key] ?? item.label,
    icon: IconComp ? <IconComp size={18} /> : null,
    isActive,
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readNotifs, setReadNotifs] = useState<number[]>([]);
  const pathname = usePathname();

  const activeItem = findActiveItem(pathname);
  const headerTitle = activeItem?.label ?? 'Enjambre Legado';
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[99] transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="main-header">
          <div className="header-left flex items-center gap-4">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-navigation"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="header-title">{headerTitle}</span>
          </div>
          <div className="header-right relative flex items-center gap-4">
            <button
              className="header-btn"
              onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); }}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
            >
              <Search size={18} />
            </button>
            <button
              className="header-btn"
              onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); }}
              aria-label={`Notificaciones, ${unreadCount} no leídas`}
              aria-expanded={notifOpen}
              aria-controls="header-notifications-panel"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="header-btn-badge" aria-hidden="true" />}
            </button>

            {searchOpen && (
              <div
                id="header-search-panel"
                role="region"
                aria-label="Buscador"
                className="absolute top-[calc(100%+12px)] right-0 w-[340px] bg-card/95 backdrop-blur-3xl border border-border rounded-lg shadow-xl z-60 overflow-hidden animate-in"
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-sm border border-border">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar en Enjambre Legado..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
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

            {notifOpen && (
              <div
                id="header-notifications-panel"
                role="region"
                aria-label="Notificaciones"
                className="absolute top-[calc(100%+12px)] right-0 w-[360px] bg-card/95 backdrop-blur-3xl border border-border rounded-lg shadow-xl z-60 overflow-hidden animate-in"
              >
                <div className="p-6 flex justify-between items-center border-b border-border">
                  <span className="font-semibold text-foreground font-existencial">Notificaciones</span>
                  <button className="btn btn-ghost btn-sm text-accent text-[0.72rem]" onClick={() => setReadNotifs(notifications.map(n => n.id))}>Marcar leídas</button>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-8 text-center text-muted-foreground text-[0.88rem] font-datos">
                      Sin notificaciones nuevas
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                        className={`px-6 py-4 border-b border-border/50 flex gap-4 cursor-pointer transition-colors duration-200 ${readNotifs.includes(n.id) ? 'bg-transparent' : 'bg-accent/[0.04]'}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${notifColorMap[n.type] ?? 'bg-accent'}`} />
                        <div>
                          <div className={`text-[0.88rem] leading-relaxed ${readNotifs.includes(n.id) ? 'text-muted-foreground font-normal' : 'text-foreground font-medium'}`}>{n.text}</div>
                          <div className="text-[0.75rem] text-muted-foreground mt-1">{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="page-content" onClick={() => { setSearchOpen(false); setNotifOpen(false); }}>
          {children}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegación inferior móvil">
        {BOTTOM_NAV_KEYS.map(key => {
          const navItem = getBottomNavItem(key, pathname)
          if (!navItem) return null
          return (
            <Link
              key={key}
              href={navItem.href}
              className={`bottom-nav-item ${navItem.isActive ? 'active' : ''}`}
              aria-current={navItem.isActive ? 'page' : undefined}
            >
              {navItem.icon}
              <span>{navItem.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
