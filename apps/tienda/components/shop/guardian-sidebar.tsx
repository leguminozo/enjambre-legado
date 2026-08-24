'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, X, User, Sun, Moon, Monitor, Grid3X3, ShoppingBag, MoreVertical, Settings, Sparkles, MapPin } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { NotificationBell, useTheme, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
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
  const { brand } = useStoreChrome();
  const sidebarLogo = brand.logo_url?.trim() || '/icons/icon-192.svg';

  const [realtimeOn, setRealtimeOn] = useState(false);
  const { notifications, markRead, markAllRead, isLoading, error } = useUserNotifications(user?.id, {
    enableRealtime: realtimeOn,
  });

  const sections = useMemo(() => buildSidebarSections(participacion), [participacion]);

  const themes: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={14} strokeWidth={1.5} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={14} strokeWidth={1.5} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={14} strokeWidth={1.5} />, label: 'Auto' },
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
        className={`tienda-guardian-sidebar fixed lg:static inset-y-0 left-0 z-[70] w-[min(18rem,88vw)] lg:w-64 xl:w-72 transform transition-transform duration-300 ease-in-out shrink-0 flex flex-col h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Menú de navegación lateral"
      >
        {/* Header / Brand — Logo + título (misma marca que el header de la tienda) */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between shrink-0 pt-[max(1rem,calc(var(--safe-top)+0.5rem))] lg:pt-4">
          <Link href="/" className="group flex items-center gap-3 min-w-0 justify-center" onClick={onClose}>
            <span className="w-9 h-9 shrink-0 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sidebarLogo} alt="" className="w-6 h-6 object-contain" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="font-display text-lg font-bold tracking-[0.02em] text-accent group-hover:text-accent-text transition-colors leading-tight">
                {tHeader('brandLine1')}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60 mt-0.5 truncate">
                {tHeader('brandLine2')}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Puentes Tienda / Carrito en Móvil (drawer) */}
        <div className="px-3 py-2 border-b border-border/30 space-y-0.5 lg:hidden">
          <Link
            href="/catalogo"
            prefetch
            onClick={onClose}
            className="guardian-nav-link group"
          >
            <Grid3X3 size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
            <span className="truncate flex-1 font-sans text-xs">
              {tBridge('store')}
            </span>
          </Link>
          <Link
            href="/carrito"
            prefetch
            onClick={onClose}
            className="guardian-nav-link group"
          >
            <ShoppingBag size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
            <span className="truncate flex-1 font-sans text-xs">
              {tBridge('bag')}
            </span>
          </Link>
        </div>

        {/* Lista de navegación principal con scroll interno */}
        <nav
          className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar"
          aria-label="Navegación principal"
        >
          {sections.map((section) => (
            <div key={section.key} role="group" aria-label={tPerfil(`nav.sections.${section.titleKey}`)}>
              <div className="text-[10px] uppercase font-mono font-semibold tracking-[0.18em] text-muted-foreground/50 px-2.5 mb-1 select-none">
                {tPerfil(`nav.sections.${section.titleKey}`)}
              </div>
              <div className="space-y-0.5">
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
                        size={17}
                        strokeWidth={1.5}
                        className={`shrink-0 transition-colors ${
                          active ? 'text-accent' : 'text-muted-foreground/70 group-hover:text-foreground'
                        }`}
                      />
                      <span className="truncate flex-1 font-sans text-xs sm:text-[13px] leading-snug">
                        {tPerfil(`nav.links.${link.labelKey}`)}
                      </span>
                      {active && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-accent ml-auto shrink-0 shadow-[0_0_6px_hsl(var(--accent)/0.7)]"
                          aria-hidden
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Perfil / Cuenta — Sizing y proporciones de Núcleo */}
        <div className="p-3 border-t border-border/40 bg-surface-sunken/20 shrink-0 space-y-2 pb-[max(0.75rem,var(--safe-bottom))] lg:pb-3">
          <div className="flex items-center gap-2.5 p-2 bg-background/60 rounded-xl border border-border/50">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 text-accent font-semibold text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || <User size={14} strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate leading-tight">
                {user?.full_name || 'Guardián'}
              </p>
              <p className="text-[10px] text-muted-foreground/70 truncate block mt-0.5">
                {participacion.esCreador
                  ? tPerfil('roleEmbajador')
                  : participacion.esAliadoB2B
                  ? tPerfil('nav.sections.aliado')
                  : tPerfil('roleProtector')}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <NotificationBell
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onOpenChange={(isNotifOpen) => setRealtimeOn(isNotifOpen)}
                isLoading={isLoading}
                error={error}
              />
              <DropdownMenu
                side="top"
                align="end"
                trigger={
                  <button
                    type="button"
                    className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-surface-sunken transition-colors"
                    title="Opciones de cuenta"
                    aria-label="Opciones de cuenta"
                  >
                    <MoreVertical size={16} strokeWidth={1.5} />
                  </button>
                }
              >
                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer"
                  onSelect={() => {
                    router.push('/perfil/ajustes');
                    onClose();
                  }}
                >
                  <Settings size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span>Configuración</span>
                    <span className="text-[10px] text-muted-foreground/70 leading-none mt-0.5">Ajustes Guardián</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer"
                  onSelect={() => {
                    router.push('/perfil/direcciones');
                    onClose();
                  }}
                >
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <span>Libreta de Direcciones</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer items-start py-3"
                  onSelect={() => {
                    router.push('/perfil/logros');
                    onClose();
                  }}
                >
                  <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">Mis Logros e Impacto</span>
                    <span className="text-[10px] text-muted-foreground/80 leading-snug whitespace-normal">Descubre cómo tus acciones regeneran la biodiversidad de Chiloé</span>
                    <span className="text-[10px] text-muted-foreground/50 leading-snug whitespace-normal mt-1 italic">Tus datos de impacto no están disponibles en este momento.</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    void handleLogout();
                  }}
                  className="gap-2.5 cursor-pointer"
                >
                  <LogOut size={16} className="shrink-0" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>

          {/* Theme Selector Segmentado */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface-sunken/40 rounded-lg border border-border/30 text-[10px]">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md transition-all text-[10px] ${
                  theme === t.value
                    ? 'bg-accent/15 text-accent border border-accent/30 font-medium'
                    : 'text-muted-foreground/70 hover:text-foreground'
                }`}
                aria-pressed={theme === t.value}
              >
                {t.icon}
                <span className="text-[9px] uppercase font-mono tracking-[0.1em]">{t.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-[9px] uppercase font-mono tracking-[0.2em] text-muted-foreground/40">
            Vanguardia Activa · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}