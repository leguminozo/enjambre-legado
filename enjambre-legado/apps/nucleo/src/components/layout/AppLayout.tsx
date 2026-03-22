import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Map, Hexagon, ShoppingBag, BarChart3, Truck, Megaphone, User, Bell, Search, Menu, X, TreePine, LogOut } from 'lucide-react';
import { roleLabels } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

interface AppLayoutProps { children: React.ReactNode; currentRole: string; onRoleChange: (role: string) => void; headerTitle: string; }

const navItems: Record<string, { label: string; icon: React.ReactNode; path: string }[]> = {
    shared: [{ label: 'Mapa del Legado', icon: <Map size={18} />, path: '/mapa' }],
    apicultor: [{ label: 'Mis Colmenas', icon: <Hexagon size={18} />, path: '/apicultor' }, { label: 'Regeneración', icon: <TreePine size={18} />, path: '/apicultor/regeneracion' }],
    vendedor: [{ label: 'Catálogo Vivo', icon: <ShoppingBag size={18} />, path: '/vendedor' }],
    gerente: [{ label: 'Panel Ejecutivo', icon: <BarChart3 size={18} />, path: '/gerente' }],
    logistica: [{ label: 'Operaciones', icon: <Truck size={18} />, path: '/logistica' }],
    marketing: [{ label: 'Comunidad', icon: <Megaphone size={18} />, path: '/marketing' }],
    cliente: [{ label: 'Mi Legado', icon: <User size={18} />, path: '/cliente' }],
};

const rolePaths: Record<string, string> = { apicultor: '/apicultor', vendedor: '/vendedor', gerente: '/gerente', logistica: '/logistica', marketing: '/marketing', cliente: '/cliente' };

const notifications = [
    { id: 1, text: 'Colmena Quilineja Vieja sin reina detectada', type: 'danger', time: 'Hace 2h' },
    { id: 2, text: 'Varroa nivel 3/10 en Avellano Sur', type: 'warning', time: 'Hace 5h' },
    { id: 3, text: 'Feria Ancud confirmada para el 15 de marzo', type: 'success', time: 'Ayer' },
    { id: 4, text: 'Nuevo pedido de Gimnasio Peak: Sachets x100', type: 'gold', time: 'Ayer' },
    { id: 5, text: 'Flujo de néctar de tepú en aumento', type: 'success', time: 'Hace 2d' },
];

export default function AppLayout({ children, currentRole, onRoleChange, headerTitle }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [readNotifs, setReadNotifs] = useState<number[]>([]);
    const [userName, setUserName] = useState<string>('Usuario');
    const searchRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Try to get from metadata first
                if (session.user.user_metadata?.full_name) {
                    setUserName(session.user.user_metadata.full_name);
                } else {
                    // Fallback to profile
                    const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
                    if (data?.full_name) setUserName(data.full_name);
                }
            }
        }
        fetchUser();
    }, []);

    const currentNavItems = [...navItems.shared, ...(navItems[currentRole] || [])];

    useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

    const handleRoleChange = (newRole: string) => {
        onRoleChange(newRole);
        navigate(rolePaths[newRole] || '/');
        setSidebarOpen(false);
    };

    const allNavItems = Object.values(navItems).flat();
    const filteredSearch = searchQuery.trim() ? allNavItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())) : [];
    const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

    const markAllRead = () => setReadNotifs(notifications.map(n => n.id));

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="app-layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand"><div className="sidebar-brand-title">Enjambre Legado</div><div className="sidebar-brand-subtitle">Apicultura Regenerativa · Chiloé</div></div>
                <div className="sidebar-role-selector"><div className="role-selector-label">Rol activo</div>
                    <select className="role-selector-select" value={currentRole} onChange={e => handleRoleChange(e.target.value)}>
                        {Object.entries(roleLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                </div>
                <nav className="sidebar-nav"><div className="nav-section-label">Navegación</div>
                    {currentNavItems.map(item => (
                        <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive || location.pathname === item.path ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                            <span className="nav-item-icon">{item.icon}</span>{item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{userName.charAt(0).toUpperCase()}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{userName}</div>
                            <div className="sidebar-user-role">{roleLabels[currentRole]}</div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: 6, color: 'var(--text-muted)' }} title="Cerrar sesión">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,42,31,0.6)', zIndex: 99, backdropFilter: 'blur(8px)', transition: 'all 0.3s ease' }} onClick={() => setSidebarOpen(false)} />}

            <main className="main-content">
                <header className="main-header">
                    <div className="header-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={22} /> : <Menu size={22} />}</button>
                        <span className="header-title">{headerTitle}</span>
                    </div>
                    <div className="header-right" style={{ position: 'relative' }}>
                        <button className="header-btn" onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); }}><Search size={18} /></button>
                        <button className="header-btn" onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); }}>
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="header-btn-badge" />}
                        </button>

                        {/* Search dropdown */}
                        {searchOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 340, background: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(10,61,47,0.12)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(10,61,47,0.08)' }}>
                                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                                        <input ref={searchRef} type="text" placeholder="Buscar en Enjambre Legado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontFamily: 'var(--font-datos)', fontSize: '0.85rem', color: 'var(--text-primary)' }} />
                                        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'var(--surface-glass)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>}
                                    </div>
                                </div>
                                <div style={{ maxHeight: 240, overflowY: 'auto', padding: 'var(--space-sm)' }}>
                                    {searchQuery.trim() ? (filteredSearch.length > 0 ? filteredSearch.map(item => (
                                        <div key={item.path} onClick={() => { navigate(item.path); setSearchOpen(false); setSearchQuery(''); }} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontSize: '0.88rem', color: 'var(--bosque-ulmo)', transition: 'background 150ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-glass)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{item.icon}<span style={{ fontWeight: 500 }}>{item.label}</span></div>
                                    )) : <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin resultados para "{searchQuery}"</div>) : (
                                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Escribe para buscar secciones, herramientas...</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notifications dropdown */}
                        {notifOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 360, background: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(10,61,47,0.12)', zIndex: 60, animation: 'fadeInUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', overflow: 'hidden' }}>
                                <div style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--bosque-ulmo)', fontFamily: 'var(--font-existencial)' }}>Notificaciones</span>
                                    <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '0.72rem', color: 'var(--oro-miel-dark)' }}>Marcar leídas</button>
                                </div>
                                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>El bosque descansa, no hay alertas hoy.</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])} style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid rgba(10,61,47,0.04)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', background: readNotifs.includes(n.id) ? 'transparent' : 'rgba(212,160,23,0.04)', transition: 'background 200ms ease' }} onMouseEnter={e => { if (readNotifs.includes(n.id)) e.currentTarget.style.background = 'var(--surface-glass)' }} onMouseLeave={e => { if (readNotifs.includes(n.id)) e.currentTarget.style.background = 'transparent' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.type === 'danger' ? 'var(--salud-riesgo)' : n.type === 'warning' ? 'var(--salud-atencion)' : n.type === 'success' ? 'var(--salud-optima)' : 'var(--oro-miel)', boxShadow: readNotifs.includes(n.id) ? 'none' : `0 0 8px ${n.type === 'danger' ? 'var(--salud-riesgo)' : 'var(--oro-miel)'}` }} />
                                                <div><div style={{ fontSize: '0.88rem', color: readNotifs.includes(n.id) ? 'var(--text-secondary)' : 'var(--bosque-ulmo)', fontWeight: readNotifs.includes(n.id) ? 400 : 500, lineHeight: 1.5 }}>{n.text}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div></div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                <div className="page-content" onClick={() => { setSearchOpen(false); setNotifOpen(false); }}>{children}</div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                {currentNavItems.map(item => (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => `bottom-nav-item ${isActive || location.pathname === item.path ? 'active' : ''}`}>
                        <span className="bottom-nav-icon">{item.icon}</span>
                        <span>{item.label.split(' ')[0]}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
