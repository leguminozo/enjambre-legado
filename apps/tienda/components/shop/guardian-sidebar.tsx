'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X, User, Sun, Moon, Monitor } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { useTheme } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { ParticipacionActiva } from '@/lib/shop/participacion';
import { buildSidebarSections } from '@/lib/shop/sidebar-nav';

interface GuardianSidebarProps {
  user: TiendaUserProfile | null;
  participacion: ParticipacionActiva;
  isOpen: boolean;
  onClose: () => void;
}

export function GuardianSidebar({ user, participacion, isOpen, onClose }: GuardianSidebarProps) {
  useOverlayLock(isOpen);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const sections = useMemo(() => buildSidebarSections(participacion), [participacion]);

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

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="tienda-overlay-backdrop z-[60] lg:hidden"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[70] w-72
          bg-card border-r border-border shadow-xl
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
            <button type="button" className="lg:hidden text-muted-foreground" onClick={onClose} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar" aria-label="Navegación principal">
            {sections.map((section) => (
              <div key={section.key}>
                <p className="px-3 text-[0.5rem] uppercase tracking-[0.3em] text-muted-foreground mb-1.5 font-bold">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const active = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group min-h-[44px]
                          ${active
                            ? 'bg-accent/10 text-accent border-l-2 border-accent'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent'}
                        `}
                      >
                        <Icon
                          size={15}
                          className={`${active ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'} transition-colors shrink-0`}
                        />
                        <span className="text-[0.65rem] uppercase tracking-[0.15em] font-medium">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-border bg-secondary/30 shrink-0 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border">
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
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 min-h-[44px] rounded-lg border transition-all ${
                    theme === t.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background/60 hover:border-accent/50 text-muted-foreground'
                  }`}
                  aria-pressed={theme === t.value}
                >
                  {t.icon}
                  <span className="text-[0.55rem] uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-[0.45rem] uppercase tracking-[0.3em] text-muted-foreground">
              Vanguardia Activa · v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}