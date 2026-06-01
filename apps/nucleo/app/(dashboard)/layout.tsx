'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, X, BarChart3, Hexagon, Calculator, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { supabase } from '@/lib/supabase';
import { findActiveItem, BOTTOM_NAV_KEYS, SIDEBAR_GROUPS, ACCOUNT_ITEMS } from '@/config/sidebar-config';

const notifications = [
  { id: 1, text: 'Colmena Quilineja Vieja sin reina detectada', type: 'danger', time: 'Hace 2h' },
  { id: 2, text: 'Varroa nivel 3/10 en Avellano Sur', type: 'warning', time: 'Hace 5h' },
  { id: 3, text: 'Feria Ancud confirmada para el 15 de marzo', type: 'success', time: 'Ayer' },
  { id: 4, text: 'Nuevo pedido de Gimnasio Peak: Sachets x100', type: 'gold', time: 'Ayer' },
  { id: 5, text: 'Flujo de néctar de tepú en aumento', type: 'success', time: 'Hace 2d' },
];

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readNotifs, setReadNotifs] = useState<number[]>([]);
  const [currentRole, setCurrentRole] = useState('gerente');
  const pathname = usePathname();

  useEffect(() => {
    async function loadRole() {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role) setCurrentRole(profile.role);
      }
    }
    loadRole();
  }, []);

  const activeItem = findActiveItem(pathname);
  const headerTitle = activeItem?.label ?? 'Enjambre Legado';
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  return (
    <div className="app-layout">
      <Sidebar
        currentRole={currentRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'hsl(var(--foreground) / 0.6)', zIndex: 99, backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="header-title">{headerTitle}</span>
          </div>
          <div className="header-right" style={{ position: 'relative' }}>
            <button className="header-btn" onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); }}>
              <Search size={18} />
            </button>
            <button className="header-btn" onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); }}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="header-btn-badge" />}
            </button>

            {searchOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(24px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'hsl(var(--background))', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border))' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar en Enjambre Legado..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontFamily: 'var(--font-datos)', fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ background: 'hsl(var(--muted) / 0.5)', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {notifOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 360, background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(24px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-existencial)' }}>Notificaciones</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setReadNotifs(notifications.map(n => n.id))} style={{ fontSize: '0.72rem', color: 'hsl(var(--accent))' }}>Marcar leídas</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                      style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid hsl(var(--border) / 0.5)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', background: readNotifs.includes(n.id) ? 'transparent' : 'hsl(var(--accent) / 0.04)', transition: 'background 200ms ease' }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.type === 'danger' ? 'var(--salud-riesgo)' : n.type === 'warning' ? 'var(--salud-atencion)' : n.type === 'success' ? 'var(--salud-optima)' : 'var(--oro-miel)' }} />
                      <div>
                        <div style={{ fontSize: '0.88rem', color: readNotifs.includes(n.id) ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))', fontWeight: readNotifs.includes(n.id) ? 400 : 500, lineHeight: 1.5 }}>{n.text}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="page-content" onClick={() => { setSearchOpen(false); setNotifOpen(false); }}>
          {children}
        </div>
      </main>

      <nav className="bottom-nav">
        {BOTTOM_NAV_KEYS.map(key => {
          const navItem = getBottomNavItem(key, pathname)
          if (!navItem) return null
          return (
            <a
              key={key}
              href={navItem.href}
              className={`bottom-nav-item ${navItem.isActive ? 'active' : ''}`}
            >
              {navItem.icon}
              <span>{navItem.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  );
}
