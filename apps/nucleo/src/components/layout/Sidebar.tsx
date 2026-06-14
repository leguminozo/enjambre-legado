'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Map, Hexagon, TreePine, ShoppingBag, Truck, Megaphone,
  Menu, X, LogOut, Calculator, Sparkles, BarChart3, FileText,
  UserCog, Settings, Building2, CreditCard, GitMerge, Printer,
  Cpu, Shield, Wallet, Users, Ticket, Percent, Sliders, Trophy,
  FlaskConical, Factory, Contact,
} from 'lucide-react';
import { SIDEBAR_GROUPS, ACCOUNT_ITEMS, findActiveItem, type SidebarItem, type SidebarBadge } from '@/config/sidebar-config';
import { SidebarSection, SidebarBadgeIndicator, type SidebarNavItemData } from '@enjambre/ui';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@enjambre/ui';

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
  'flask-conical': FlaskConical,
  'factory': Factory,
  'user-cog': UserCog,
  'settings': Settings,
  'contact': Contact,
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
  const userRole = useAuthStore((s) => s.user?.role ?? 'admin');

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
    <aside id="sidebar-navigation" className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Menú de navegación lateral">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">Enjambre Legado</div>
        <div className="sidebar-brand-subtitle">Apicultura Regenerativa · Chiloé</div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {SIDEBAR_GROUPS.map(group => (
          <SidebarSection
            key={group.key}
            label={group.label}
            items={group.items.map(item => toNavItemData(item, badgeOverrides))}
            activeKey={activeItem?.key}
            linkComponent={Link}
            onItemClick={() => {
              onToggle();
            }}
          />
        ))}

        <SidebarSection
          label="CUENTA"
          items={ACCOUNT_ITEMS.map(item => toNavItemData(item, badgeOverrides))}
          activeKey={activeItem?.key}
          linkComponent={Link}
          onItemClick={() => {
            onToggle();
          }}
        />
      </nav>

      <div className="sidebar-footer">
        {(urlTienda || urlCampo) && (
          <div className="px-6 pb-4 text-[0.7rem] text-muted-foreground border-b border-border">
            <div className="font-semibold tracking-wider mb-2 text-[0.65rem] text-foreground">ECOSISTEMA</div>
            <div className="flex flex-col gap-4">
              {urlTienda && (
                <a
                  href={urlTienda}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-medium"
                  onClick={() => onToggle()}
                  aria-label="Tienda web (abre en una nueva pestaña)"
                >
                  Tienda web
                </a>
              )}
              {urlCampo && (
                <a
                  href={urlCampo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-medium"
                  onClick={() => onToggle()}
                  aria-label="Terminal Campo (POS) (abre en una nueva pestaña)"
                >
                  Terminal Campo (POS)
                </a>
              )}
            </div>
          </div>
        )}
        <div className="sidebar-user">
          <Link
            href="/perfil"
            className="sidebar-user-avatar"
            onClick={() => onToggle()}
            aria-label="Ver mi perfil"
            style={{ cursor: 'pointer', border: 'none', padding: 0 }}
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{userRole}</div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle size={20} className="text-muted-foreground hover:text-accent" />
            <button
              onClick={handleLogout}
              className="btn btn-ghost p-1.5 text-muted-foreground"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}