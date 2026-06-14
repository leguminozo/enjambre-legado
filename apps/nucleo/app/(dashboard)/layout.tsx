'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Menu, X, BarChart3, Hexagon, Calculator, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { findActiveItem, BOTTOM_NAV_KEYS, SIDEBAR_GROUPS, ACCOUNT_ITEMS } from '@/config/sidebar-config';
import { NotificationBell, type Notification } from '@enjambre/ui';

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
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const [realNotifications, setRealNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const activeItem = findActiveItem(pathname);
  const headerTitle = activeItem?.label ?? 'Enjambre Legado';

  // Real data for shared NotificationBell (interconnected with central system)
  useEffect(() => {
    const load = async () => {
      setNotifLoading(true);
      try {
        const res = await fetch('/notifications'); // via BFF
        if (res.ok) {
          const json = await res.json();
          const mapped: Notification[] = (json.data || []).map((a: any) => ({
            id: a.id,
            title: a.title || a.subject || 'Alerta',
            message: a.message || a.body || '',
            time: a.created_at ? new Date(a.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : undefined,
            type: 'gold',
            href: '/notificaciones', // or relevant
          }));
          setRealNotifications(mapped);
        }
      } catch {}
      setNotifLoading(false);
    };
    load();
  }, []);

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
              onClick={() => { setSearchOpen(!searchOpen); }}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              aria-controls="header-search-panel"
            >
              <Search size={18} />
            </button>

            <NotificationBell
              notifications={realNotifications}
              isLoading={notifLoading}
              onMarkRead={(id) => {
                // For nucleo, optimistic + could call /notifications/read
                setRealNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
              }}
              onMarkAllRead={() => {
                setRealNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
            />

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
          </div>
        </header>

        <div className="page-content" onClick={() => { setSearchOpen(false); }}>
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
