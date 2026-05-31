'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Map, Hexagon, TreePine, ShoppingBag, Truck, Megaphone, Bell, Search,
  Menu, X, LogOut, Calculator, Sparkles, BarChart3, FileText, UserCog,
  Settings, Building2, CreditCard, RefreshCw, BookOpen, BrainCircuit, Shield,
  Wallet, Users, Ticket, Percent, Sliders, Trophy
} from 'lucide-react';
import { roleLabels } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
currentRole: string;
onToggle: () => void;
isOpen: boolean;
}

type NavItem = { label: string; icon: React.ReactNode; path: string; roles?: string[] };

const navItems: { section: string; items: NavItem[] }[] = [
  { section: 'Navegación', items: [
    { label: 'Mapa del Legado', icon: <Map size={18} />, path: '/mapa' },
    { label: 'Colmenas & Apiarios', icon: <Hexagon size={18} />, path: '/colmenas' },
    { label: 'Regeneración', icon: <TreePine size={18} />, path: '/regeneracion' },
    { label: 'Catálogo & CRM', icon: <ShoppingBag size={18} />, path: '/catalogo' },
    { label: 'Operaciones & Stock', icon: <Truck size={18} />, path: '/operaciones' },
    { label: 'Comunidad & Marketing', icon: <Megaphone size={18} />, path: '/comunidad' },
    { label: 'Portal de Creador', icon: <Sparkles size={18} />, path: '/creador' },
  ]},
  { section: 'Contabilidad', items: [
    { label: 'Sistema Contable', icon: <Calculator size={18} />, path: '/contable' },
    { label: 'SII · DTE', icon: <FileText size={18} />, path: '/sii' },
    { label: 'Banco Chile', icon: <Building2 size={18} />, path: '/banco' },
    { label: 'Pagos SumUp · En migración', icon: <CreditCard size={18} />, path: '/pagos' },
    { label: 'Conciliación · En migración', icon: <RefreshCw size={18} />, path: '/conciliacion' },
    { label: 'Reportes', icon: <BookOpen size={18} />, path: '/reportes' },
    { label: 'Cálculos IA', icon: <BrainCircuit size={18} />, path: '/calculos-ia' },
  ]},
  { section: 'Gestión', items: [
    { label: 'Panel Ejecutivo', icon: <BarChart3 size={18} />, path: '/', roles: ['gerente', 'tienda_admin'] },
    { label: 'Vanguardia B2B', icon: <Shield size={18} />, path: '/vanguardia', roles: ['gerente', 'tienda_admin'] },
    { label: 'Creadores Admin', icon: <Sparkles size={18} />, path: '/creadores', roles: ['gerente', 'tienda_admin'] },
    { label: 'Cierres de Caja', icon: <Wallet size={18} />, path: '/caja', roles: ['gerente', 'tienda_admin'] },
    { label: 'Reps de Ventas', icon: <Users size={18} />, path: '/reps', roles: ['gerente', 'tienda_admin'] },
    { label: 'Comisiones', icon: <Percent size={18} />, path: '/comisiones', roles: ['gerente', 'tienda_admin'] },
    { label: 'Reglas de Comisión', icon: <Sliders size={18} />, path: '/reglas-comision', roles: ['gerente', 'tienda_admin'] },
    { label: 'Invitaciones', icon: <Ticket size={18} />, path: '/invitaciones', roles: ['gerente', 'tienda_admin'] },
  { label: 'Leaderboard', icon: <Trophy size={18} />, path: '/leaderboard', roles: ['gerente', 'tienda_admin'] },
  ]},
];

const accountItems = [
  { label: 'Mi Perfil', icon: <UserCog size={18} />, path: '/perfil' },
  { label: 'Configuración', icon: <Settings size={18} />, path: '/configuracion' },
];

export function Sidebar({ currentRole, onToggle, isOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Usuario');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const urlTienda = process.env.NEXT_PUBLIC_URL_TIENDA?.trim() || '';
  const urlCampo = process.env.NEXT_PUBLIC_URL_CAMPO?.trim() || '';

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name);
        } else {
          const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
          if (data?.full_name) setUserName(data.full_name);
        }
      }
    }
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const allFlatItems = navItems.flatMap(s => s.items);
  const filteredSearch = searchQuery.trim()
    ? allFlatItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const visibleSections = navItems
    .map(s => ({
      ...s,
      items: s.items.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(currentRole);
      }),
    }))
    .filter(s => s.items.length > 0);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">Enjambre Legado</div>
        <div className="sidebar-brand-subtitle">Apicultura Regenerativa · Chiloé</div>
      </div>

      <nav className="sidebar-nav">
        {visibleSections.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => onToggle()}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="nav-section-label" style={{ marginTop: 'var(--space-lg)' }}>Cuenta</div>
        {accountItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => onToggle()}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {(urlTienda || urlCampo) && (
          <div style={{ padding: '0 var(--space-md) var(--space-md)', fontSize: '0.7rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(10,61,47,0.08)' }}>
            <div style={{ fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6, color: 'var(--bosque-ulmo)', fontSize: '0.65rem' }}>ECOSISTEMA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {urlTienda && <a href={urlTienda} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--oro-miel-dark)', fontWeight: 500 }} onClick={() => onToggle()}>Tienda web</a>}
              {urlCampo && <a href={urlCampo} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--oro-miel-dark)', fontWeight: 500 }} onClick={() => onToggle()}>Terminal Campo (POS)</a>}
            </div>
          </div>
        )}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ cursor: 'pointer' }} onClick={() => { router.push('/perfil'); onToggle(); }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{roleLabels[currentRole] || currentRole}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: 6, color: 'var(--text-muted)' }} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
