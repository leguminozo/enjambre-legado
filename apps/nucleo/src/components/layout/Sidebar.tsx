'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Map, Hexagon, TreePine, ShoppingBag, Truck, Megaphone,
  Menu, X, LogOut, Calculator, Sparkles, BarChart3, FileText,
  UserCog, Settings, Building2, CreditCard, GitMerge, Printer,
  Cpu, Shield, Wallet, Users, Ticket, Percent, Sliders, Trophy,
} from 'lucide-react';
import { SIDEBAR_GROUPS, ACCOUNT_ITEMS, findActiveItem, type SidebarItem, type SidebarBadge } from '@/config/sidebar-config';
import { SidebarSection, SidebarBadgeIndicator, type SidebarNavItemData } from '@enjambre/ui';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { ROLE } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const LUCIDE_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  'map': Map,
  'hexagon': Hexagon,
  'tree-pine': TreePine,
  'shopping-bag': ShoppingBag,
  'truck': Truck,
  'megaphone': Megaphone,
  'sparkles': Sparkles,
  'calculator': Calculator,
  'file-text': FileText,
  'building-2': Building2,
  'credit-card': CreditCard,
  'git-merge': GitMerge,
  'printer': Printer,
  'cpu': Cpu,
  'bar-chart-3': BarChart3,
  'shield': Shield,
  'wallet': Wallet,
  'users': Users,
  'ticket': Ticket,
  'percent': Percent,
  'sliders': Sliders,
  'trophy': Trophy,
  'user-cog': UserCog,
  'settings': Settings,
};

function toNavItemData(
  item: SidebarItem,
  badgeOverrides: Record<string, SidebarBadge>
): SidebarNavItemData {
  const IconComp = LUCIDE_MAP[item.icon]
  return {
    key: item.key,
    label: item.label,
    icon: IconComp ? <IconComp size={18} /> : <span />,
    href: item.href,
    badge: badgeOverrides[item.key] ?? item.badge ?? null,
  };
}

interface SidebarProps {
  onToggle: () => void;
  isOpen: boolean;
}

export function Sidebar({ onToggle, isOpen }: SidebarProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const router = useRouter();
  const [userName, setUserName] = useState('Usuario');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { badges } = useSidebarBadges();

  const urlTienda = process.env.NEXT_PUBLIC_URL_TIENDA?.trim() || '';
  const urlCampo = process.env.NEXT_PUBLIC_URL_CAMPO?.trim() || '';

  useEffect(() => {
    async function fetchUser() {
      if (!supabase) return;
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
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const allItems = useMemo(() => [...SIDEBAR_GROUPS.flatMap(g => g.items), ...ACCOUNT_ITEMS], []);
  const filteredSearch = searchQuery.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  const activeItem = findActiveItem(pathname);

  const badgeOverrides = useMemo(() => {
    const map: Record<string, SidebarBadge> = {};
    const entries = Object.entries(badges) as [string, SidebarBadge][];
    for (const [key, value] of entries) {
      if (value) map[key] = value;
    }
    return map;
  }, [badges]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">Enjambre Legado</div>
        <div className="sidebar-brand-subtitle">Apicultura Regenerativa · Chiloé</div>
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_GROUPS.map(group => (
          <SidebarSection
            key={group.key}
            label={group.label}
            items={group.items.map(item => toNavItemData(item, badgeOverrides))}
            activeKey={activeItem?.key}
            onItemClick={(clicked) => {
              router.push(clicked.href);
              onToggle();
            }}
          />
        ))}

        <SidebarSection
          label="CUENTA"
          items={ACCOUNT_ITEMS.map(item => toNavItemData(item, badgeOverrides))}
          activeKey={activeItem?.key}
          onItemClick={(clicked) => {
            router.push(clicked.href);
            onToggle();
          }}
        />
      </nav>

      <div className="sidebar-footer">
        {(urlTienda || urlCampo) && (
          <div style={{ padding: '0 var(--space-md) var(--space-md)', fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>
            <div style={{ fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6, color: 'hsl(var(--foreground))', fontSize: '0.65rem' }}>ECOSISTEMA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {urlTienda && <a href={urlTienda} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }} onClick={() => onToggle()}>Tienda web</a>}
              {urlCampo && <a href={urlCampo} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent))', fontWeight: 500 }} onClick={() => onToggle()}>Terminal Campo (POS)</a>}
            </div>
          </div>
        )}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ cursor: 'pointer' }} onClick={() => { router.push('/perfil'); onToggle(); }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{ROLE}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: 6, color: 'hsl(var(--muted-foreground))' }} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
