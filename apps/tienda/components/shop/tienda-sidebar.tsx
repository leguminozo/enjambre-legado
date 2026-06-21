'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  X,
  User,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { ParticipacionActiva } from '@/lib/shop/participacion';
import { buildSidebarSections } from '@/lib/shop/sidebar-nav';
import { SidebarSection, type SidebarNavItemData } from '@enjambre/ui';
import { useTheme } from '@enjambre/ui';

interface TiendaSidebarProps {
  user: TiendaUserProfile | null;
  participacion: ParticipacionActiva;
  isOpen: boolean;
  onClose: () => void;
}

export function TiendaSidebar({ user, participacion, isOpen, onClose }: TiendaSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  useAuthStore((s) => s.user?.role ?? 'cliente');

  const sections = useMemo(() => buildSidebarSections(participacion), [participacion]);

  const allLinks = useMemo(() => sections.flatMap((s) => s.links), [sections]);
  const activeItem = allLinks.find((item) => item.href === pathname);

  const themes: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  const handleLogout = async () => {
    const authStore = useAuthStore.getState();
    await authStore.signOut();
    router.push('/');
    router.refresh();
  };

  const toNavItems = (links: typeof allLinks): SidebarNavItemData[] =>
    links.map((link) => ({
      key: link.href,
      label: link.label,
      icon: <link.icon size={18} />,
      href: link.href,
      badge: null,
    }));

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
            <button type="button" className="lg:hidden text-muted-foreground" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto" aria-label="Navegación principal">
            {sections.map((section) => (
              <SidebarSection
                key={section.key}
                label={section.title.toUpperCase()}
                items={toNavItems(section.links)}
                activeKey={activeItem?.href}
                linkComponent={Link}
                onItemClick={() => onClose()}
              />
            ))}
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
                  {participacion.esCreador ? 'Embajador' : 'Protector del Bosque'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={14} />
              </button>
            </div>

            <div className="border-t border-border pt-3">
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
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
          </div>
        </div>
      </aside>
    </>
  );
}