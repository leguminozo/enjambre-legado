'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  Compass,
  Calendar,
  ShoppingBag,
  Settings,
  LogOut,
  X,
  Menu,
  User,
  Repeat,
  Users,
  Gem,
  Bell,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { SidebarSection, SidebarNavItem, SidebarBadgeIndicator, type SidebarNavItemData, type SidebarBadgeValue } from '@enjambre/ui';
import { useTheme } from '@enjambre/ui';

const navSections = [
  {
    title: 'Identidad Guardiana',
    links: [
      { href: '/perfil', label: 'El Legado', icon: Shield },
      { href: '/perfil/pasaporte', label: 'Pasaporte Colmena', icon: Compass },
    ],
  },
  {
    title: 'Comercio Ritual',
    links: [
      { href: '/perfil/ritual', label: 'Ritual Mensual', icon: Repeat },
      { href: '/perfil/reservas', label: 'Reserva Cosecha', icon: Calendar },
      { href: '/perfil/pedidos', label: 'Historial Ritual', icon: ShoppingBag },
    ],
  },
  {
    title: 'Red Biocultural',
    links: [
      { href: '/perfil/circular', label: 'Circular Colmena', icon: Users },
      { href: '/perfil/canje', label: 'Canje Impacto', icon: Gem },
      { href: '/perfil/alertas', label: 'Alertas Floración', icon: Bell },
    ],
  },
  {
    title: 'Ajustes',
    links: [
      { href: '/perfil/ajustes', label: 'Ajustes Guardián', icon: Settings },
    ],
  },
];

interface TiendaSidebarProps {
  user: TiendaUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TiendaSidebar({ user, isOpen, onClose }: TiendaSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const userRole = useAuthStore((s) => s.user?.role ?? 'cliente');

  const handleLogout = async () => {
    const authStore = useAuthStore.getState();
    await authStore.signOut();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const allItems = useMemo(() => navSections.flatMap(s => s.links), []);
  const activeItem = allItems.find(item => item.href === pathname);

  const themes: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  const navItemData = useMemo((): SidebarNavItemData[] => {
    return navSections.flatMap(section =>
      section.links.map(link => ({
        key: link.href,
        label: link.label,
        icon: <link.icon size={18} />,
        href: link.href,
        badge: null,
      }))
    );
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`
          fixed lg:static inset-y-0 left-0 z-[70] w-72
          bg-card border-r border-border
          transform transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Menú de navegación lateral"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between shrink-0">
            <Link href="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-display font-bold text-sm">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-display text-xs tracking-tight leading-none">Enjambre</span>
                <span className="text-accent text-[0.45rem] uppercase tracking-[0.3em] font-bold mt-1">Legado</span>
              </div>
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto" aria-label="Navegación principal">
            <SidebarSection
              label="IDENTIDAD GUARDIANA"
              items={navItemData.filter(item => ['/perfil', '/perfil/pasaporte'].includes(item.href))}
              activeKey={activeItem?.href}
              linkComponent={Link}
              onItemClick={() => onClose()}
            />
            <SidebarSection
              label="COMERCIO RITUAL"
              items={navItemData.filter(item => ['/perfil/ritual', '/perfil/reservas', '/perfil/pedidos'].includes(item.href))}
              activeKey={activeItem?.href}
              linkComponent={Link}
              onItemClick={() => onClose()}
            />
            <SidebarSection
              label="RED BIOCULTURAL"
              items={navItemData.filter(item => ['/perfil/circular', '/perfil/canje', '/perfil/alertas'].includes(item.href))}
              activeKey={activeItem?.href}
              linkComponent={Link}
              onItemClick={() => onClose()}
            />
            <SidebarSection
              label="AJUSTES"
              items={navItemData.filter(item => item.href === '/perfil/ajustes')}
              activeKey={activeItem?.href}
              linkComponent={Link}
              onItemClick={() => onClose()}
            />
          </nav>

          <div className="p-3 border-t border-border bg-secondary/30 shrink-0 space-y-4">
            <div className="flex items-center justify-between p-3 bg-background/40 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center shrink-0">
                <User size={14} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-bold text-foreground truncate tracking-wide">
                  {user?.full_name || 'Guardián'}
                </p>
                <p className="text-[0.5rem] uppercase tracking-widest text-accent font-semibold">
                  Protector del Bosque
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Desvincular Legado"
                aria-label="Cerrar sesión"
              >
                <LogOut size={14} />
              </button>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-3 text-accent mb-3">
                <Moon size={18} />
                <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Apariencia</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                      theme === t.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-secondary hover:border-accent/50'
                    }`}
                  >
                    {t.icon}
                    <span className="text-[0.55rem] uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center pt-2 border-t border-border">
              <p className="text-[0.45rem] uppercase tracking-[0.3em] text-muted-foreground">Vanguardia Activa · v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}