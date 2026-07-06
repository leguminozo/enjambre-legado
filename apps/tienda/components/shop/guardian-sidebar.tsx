'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, X, User, Sun, Moon, Monitor, Grid3X3, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { useTheme } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import type { ParticipacionActiva } from '@/lib/shop/participacion';
import { buildSidebarSections } from '@/lib/shop/sidebar-nav';
import { isActiveNavHref } from '@/lib/shop/store-routes';

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
  const tPerfil = useTranslations('perfil');
  const tHeader = useTranslations('header');
  const tBridge = useTranslations('perfil.bridge');

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
        className={`tienda-guardian-sidebar fixed lg:static inset-y-0 left-0 z-[70] w-[min(20rem,88vw)] lg:w-80 border-r border-border transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Menú de navegación lateral"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 lg:p-8 border-b border-border flex items-center justify-between shrink-0">
            <Link href="/" className="group flex flex-col gap-0.5" onClick={onClose}>
              <span className="font-display text-base lg:text-lg tracking-[0.28em] uppercase text-foreground group-hover:text-accent transition-colors leading-none">
                {tHeader('brandLine1')}
              </span>
              <span className="font-display text-[0.65rem] lg:text-xs italic text-accent tracking-[0.12em] -mt-0.5">
                {tHeader('brandLine2')}
              </span>
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <X size={22} />
            </button>
          </div>

          <div className="px-4 lg:px-6 py-4 border-b border-border space-y-1 lg:hidden">
            <Link
              href="/catalogo"
              prefetch
              onClick={onClose}
              className="guardian-nav-link group"
            >
              <Grid3X3 size={20} strokeWidth={1.5} className="shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="font-display text-lg font-light leading-snug tracking-tight">
                {tBridge('store')}
              </span>
            </Link>
            <Link
              href="/carrito"
              prefetch
              onClick={onClose}
              className="guardian-nav-link group"
            >
              <ShoppingBag size={20} strokeWidth={1.5} className="shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="font-display text-lg font-light leading-snug tracking-tight">
                {tBridge('bag')}
              </span>
            </Link>
          </div>

          <nav
            className="flex-1 px-4 lg:px-6 py-6 lg:py-8 space-y-8 overflow-y-auto custom-scrollbar"
            aria-label="Navegación principal"
          >
            {sections.map((section) => (
              <div key={section.key}>
                <p className="editorial-kicker mb-4 px-1">{tPerfil(`nav.sections.${section.titleKey}`)}</p>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const active = isActiveNavHref(pathname, link.href);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`guardian-nav-link group ${active ? 'is-active' : ''}`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={1.5}
                          className={`shrink-0 transition-colors ${
                            active ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
                          }`}
                        />
                        <span
                          className={`font-display text-lg lg:text-xl font-light leading-snug tracking-tight ${
                            active ? 'text-accent' : ''
                          }`}
                        >
                          {tPerfil(`nav.links.${link.labelKey}`)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 lg:p-6 border-t border-border bg-secondary/20 shrink-0 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-background/50 rounded-2xl border border-border">
              <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                <User size={18} strokeWidth={1.5} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm lg:text-base font-light text-foreground truncate">
                  {user?.full_name || 'Guardián'}
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-accent font-medium mt-0.5">
                  {participacion.esCreador ? tPerfil('roleEmbajador') : tPerfil('roleProtector')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 min-h-[48px] rounded-xl border transition-all ${
                    theme === t.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background/60 hover:border-accent/40 text-muted-foreground'
                  }`}
                  aria-pressed={theme === t.value}
                >
                  {t.icon}
                  <span className="text-[0.6rem] uppercase tracking-[0.2em]">{t.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-[0.55rem] uppercase tracking-[0.28em] text-muted-foreground/80">
              Vanguardia Activa · v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}