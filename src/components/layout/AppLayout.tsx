import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Map, Hexagon, ShoppingBag, BarChart3, Truck, Megaphone, User, Bell, Search, Menu, X, TreePine } from 'lucide-react';
import { roleLabels } from '../../data/mockData';

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
    const searchRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

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
                <div className="sidebar-footer"><div className="sidebar-user"><div className="sidebar-user-avatar">CL</div><div className="sidebar-user-info"><div className="sidebar-user-name">Cristina López</div><div className="sidebar-user-role">{roleLabels[currentRole]}</div></div></div></div>
            </aside>

            {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />}

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
                            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--surface-card)', border: '1px solid rgba(10,61,47,0.1)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 60, animation: 'fadeInUp 0.2s ease', overflow: 'hidden' }}>
                                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)' }}>
                                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                                        <input ref={searchRef} type="text" placeholder="Buscar en Enjambre Legado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontFamily: 'var(--font-datos)', fontSize: '0.85rem', color: 'var(--text-primary)' }} />
                                        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={14} /></button>}
                                    </div>
                                </div>
                                <div style={{ maxHeight: 240, overflowY: 'auto', padding: 'var(--space-sm)' }}>
                                    {searchQuery.trim() ? (filteredSearch.length > 0 ? filteredSearch.map(item => (
                                        <div key={item.path} onClick={() => { navigate(item.path); setSearchOpen(false); setSearchQuery(''); }} style={{ padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--bosque-ulmo)' }} className="nav-item">{item.icon}<span>{item.label}</span></div>
                                    )) : <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Sin resultados para "{searchQuery}"</div>) : (
                                        <div style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Escribe para buscar secciones, colmenas, productos...</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notifications dropdown */}
                        {notifOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360, background: 'var(--surface-card)', border: '1px solid rgba(10,61,47,0.1)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 60, animation: 'fadeInUp 0.2s ease', overflow: 'hidden' }}>
                                <div style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>Notificaciones</span>
                                    <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '0.72rem' }}>Marcar todas leídas</button>
                                </div>
                                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                    {notifications.map(n => (
                                        <div key={n.id} onClick={() => setReadNotifs(prev => prev.includes(n.id) ? prev : [...prev, n.id])} style={{ padding: 'var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.04)', display: 'flex', gap: 'var(--space-md)', cursor: 'pointer', background: readNotifs.includes(n.id) ? 'transparent' : 'rgba(212,160,23,0.04)', transition: 'background 150ms' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.type === 'danger' ? 'var(--salud-riesgo)' : n.type === 'warning' ? 'var(--salud-atencion)' : n.type === 'success' ? 'var(--salud-optima)' : 'var(--oro-miel)' }} />
                                            <div><div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                <div className="page-content" onClick={() => { setSearchOpen(false); setNotifOpen(false); }}>{children}</div>
            </main>
        </div>
    );
}
