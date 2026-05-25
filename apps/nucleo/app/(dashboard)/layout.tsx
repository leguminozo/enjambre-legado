'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, X, BarChart3, Map, Hexagon, Calculator, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase-client';

const titleMap: Record<string, string> = {
  '/': 'Panel Ejecutivo',
  '/mapa': 'Mapa del Legado',
  '/colmenas': 'Colmenas & Apiarios',
  '/regeneracion': 'Regeneración',
  '/catalogo': 'Catálogo & CRM',
  '/operaciones': 'Operaciones & Stock',
  '/comunidad': 'Comunidad & Marketing',
  '/creador': 'Portal de Creador',
  '/contable': 'Sistema Contable',
  '/sii': 'SII · Factura de Compra',
  '/banco': 'Banco Chile',
  '/pagos': 'Pagos SumUp',
  '/conciliacion': 'Conciliación',
  '/reportes': 'Reportes Financieros',
  '/calculos-ia': 'Cálculos IA',
  '/vanguardia': 'Vanguardia B2B',
  '/creadores': 'Creadores Admin',
  '/perfil': 'Mi Perfil',
  '/configuracion': 'Configuración',
};

const notifications = [
  { id: 1, text: 'Colmena Quilineja Vieja sin reina detectada', type: 'danger', time: 'Hace 2h' },
  { id: 2, text: 'Varroa nivel 3/10 en Avellano Sur', type: 'warning', time: 'Hace 5h' },
  { id: 3, text: 'Feria Ancud confirmada para el 15 de marzo', type: 'success', time: 'Ayer' },
  { id: 4, text: 'Nuevo pedido de Gimnasio Peak: Sachets x100', type: 'gold', time: 'Ayer' },
  { id: 5, text: 'Flujo de néctar de tepú en aumento', type: 'success', time: 'Hace 2d' },
];

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
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role) setCurrentRole(profile.role);
      }
    }
    loadRole();
  }, []);

  const headerTitle = titleMap[pathname] || 'Enjambre Legado';
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,42,31,0.6)', zIndex: 99, backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }}
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
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(10,61,47,0.12)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(10,61,47,0.08)' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar en Enjambre Legado..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontFamily: 'var(--font-datos)', fontSize: '0.85rem', color: 'var(--text-primary)' }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ background: 'var(--surface-glass)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {notifOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 360, background: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(10,61,47,0.12)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--bosque-ulmo)', fontFamily: 'var(--font-existencial)' }}>Notificaciones</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setReadNotifs(notifications.map(n => n.id))} style={{ fontSize: '0.72rem', color: 'var(--oro-miel-dark)' }}>Marcar leídas</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])}
                      style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid rgba(10,61,47,0.04)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', background: readNotifs.includes(n.id) ? 'transparent' : 'rgba(212,160,23,0.04)', transition: 'background 200ms ease' }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.type === 'danger' ? 'var(--salud-riesgo)' : n.type === 'warning' ? 'var(--salud-atencion)' : n.type === 'success' ? 'var(--salud-optima)' : 'var(--oro-miel)' }} />
                      <div>
                        <div style={{ fontSize: '0.88rem', color: readNotifs.includes(n.id) ? 'var(--text-secondary)' : 'var(--bosque-ulmo)', fontWeight: readNotifs.includes(n.id) ? 400 : 500, lineHeight: 1.5 }}>{n.text}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
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
        <a href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Inicio</span>
        </a>
        <a href="/colmenas" className={`bottom-nav-item ${pathname.startsWith('/colmenas') ? 'active' : ''}`}>
          <Hexagon size={18} />
          <span>Colmenas</span>
        </a>
        <a href="/contable" className={`bottom-nav-item ${pathname.startsWith('/contable') ? 'active' : ''}`}>
          <Calculator size={18} />
          <span>Contable</span>
        </a>
        <a href="/configuracion" className={`bottom-nav-item ${pathname.startsWith('/configuracion') ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Config</span>
        </a>
      </nav>
    </div>
  );
}
