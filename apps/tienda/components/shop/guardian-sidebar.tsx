'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, X, User, Grid3X3, ShoppingBag, MoreVertical, Settings, Award, MapPin } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { useHeaderMenu } from '@/components/shop/header-menu-context';
import { resolveHeaderBrand } from '@enjambre/shop-chrome';
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
  const tPerfil = useTranslations('perfil');
  const tHeader = useTranslations('header');
  const tBridge = useTranslations('perfil.bridge');
  const { brand } = useStoreChrome();
  const { settings } = useHeaderMenu();
  const headerBrand = useMemo(() => resolveHeaderBrand(brand, settings), [brand, settings]);

  const sections = useMemo(() => buildSidebarSections(participacion), [participacion]);

  const isAccountRoute = ['/perfil/ajustes', '/perfil/direcciones', '/perfil/logros'].some(
    (route) => pathname?.startsWith(route),
  );

  const handleLogout = async () => {
    const authStore = useAuthStore.getState();
    await authStore.signOut();
    window.location.href = '/';
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
        {/* Header / Brand — Logo directo con soporte dedicado para perfil */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between shrink-0 pt-[max(1rem,calc(var(--safe-top)+0.5rem))] lg:pt-4">
          <Link href="/" className="group flex items-center gap-3 min-w-0" onClick={onClose}>
            {(() => {
              const logoSrc = brand.logo_perfil_url || headerBrand.logoSrc;
              const logoHeight = brand.logo_perfil_url
                ? (brand.logo_perfil_height_px ?? 36)
                : Math.min(headerBrand.heightMobilePx, 40);
              return logoSrc ? (
                <img
                  src={logoSrc}
                  alt={brand.brand_name || settings.brand_line1 || tHeader('brandLine1') || 'Logo'}
                  style={{
                    height: `${logoHeight}px`,
                    maxWidth: headerBrand.maxWidthPx > 0 ? `${Math.min(headerBrand.maxWidthPx, 180)}px` : '180px',
                    width: 'auto',
                  }}
                  className="object-contain shrink-0 max-w-full"
                />
              ) : null;
            })()}
            {headerBrand.showText || (!brand.logo_perfil_url && !headerBrand.logoSrc) ? (
              <span className="flex flex-col min-w-0">
                <span
                  className="font-display font-bold text-accent group-hover:text-accent-text transition-colors leading-tight"
                  style={{
                    fontSize: `${Math.max(brand.brand_name_size_mobile_px ?? 15, 15)}px`,
                    letterSpacing: 'min(var(--tienda-brand-tracking, 0.04em), 0.1em)',
                  }}
                >
                  {brand.brand_name || settings.brand_line1 || tHeader('brandLine1')}
                </span>
                {(settings.brand_line2 || brand.brand_tagline_show_mobile !== false) && (
                  <span
                    className="font-mono uppercase text-muted-foreground/80 mt-0.5 truncate"
                    style={{
                      fontSize: `${Math.max(brand.brand_tagline_size_mobile_px ?? 9, 10)}px`,
                      letterSpacing: 'min(calc(var(--tienda-brand-tracking, 0.18em) + 0.02em), 0.25em)',
                    }}
                  >
                    {brand.brand_tagline || settings.brand_line2 || tHeader('brandLine2')}
                  </span>
                )}
              </span>
            ) : null}
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
        <div className="px-3 py-2.5 border-b border-border/30 space-y-1 lg:hidden">
          <Link
            href="/catalogo"
            prefetch
            onClick={onClose}
            className="guardian-nav-link group"
          >
            <Grid3X3 size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
            <span className="truncate flex-1 font-sans text-sm font-medium">
              {tBridge('store')}
            </span>
          </Link>
          <Link
            href="/carrito"
            prefetch
            onClick={onClose}
            className="guardian-nav-link group"
          >
            <ShoppingBag size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground/80 group-hover:text-foreground transition-colors" />
            <span className="truncate flex-1 font-sans text-sm font-medium">
              {tBridge('bag')}
            </span>
          </Link>
        </div>

        {/* Lista de navegación principal con scroll interno */}
        <nav
          className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto custom-scrollbar"
          aria-label="Navegación principal"
        >
          {sections.map((section) => (
            <div key={section.key} role="group" aria-label={tPerfil(`nav.sections.${section.titleKey}`)}>
              <div className="text-[11px] sm:text-xs uppercase font-mono font-semibold tracking-[0.16em] text-muted-foreground px-2.5 mb-1.5 select-none">
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
                        size={18}
                        strokeWidth={1.75}
                        className={`shrink-0 transition-colors ${
                          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      />
                      <span className="truncate flex-1 font-sans text-sm font-medium leading-snug">
                        {tPerfil(`nav.links.${link.labelKey}`)}
                      </span>
                      {active && (
                        <span
                          className="w-2 h-2 rounded-full bg-accent ml-auto shrink-0 shadow-[0_0_8px_hsl(var(--accent)/0.7)]"
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
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
              isAccountRoute
                ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/20'
                : 'bg-background/60 border-border/50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 text-accent font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || <User size={16} strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {user?.full_name || 'Miembro del Legado'}
              </p>
              <p className="text-xs text-muted-foreground truncate block mt-0.5">
                {participacion.esCreador
                  ? tPerfil('roleEmbajador')
                  : participacion.esAliadoB2B
                  ? tPerfil('nav.sections.aliado')
                  : tPerfil('roleProtector')}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <DropdownMenu
                side="top"
                align="end"
                trigger={
                  <button
                    type="button"
                    className={`p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                      isAccountRoute
                        ? 'text-accent hover:bg-accent/15'
                        : 'text-muted-foreground/70 hover:text-foreground hover:bg-surface-sunken'
                    }`}
                    title="Opciones de cuenta"
                    aria-label="Opciones de cuenta"
                  >
                    <MoreVertical size={16} strokeWidth={1.5} />
                  </button>
                }
              >
                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer text-sm"
                  onSelect={() => {
                    router.push('/perfil/ajustes');
                    onClose();
                  }}
                >
                  <Settings size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span>Configuración</span>
                    <span className="text-xs text-muted-foreground/80 leading-none mt-0.5">Ajustes de Cuenta</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer text-sm"
                  onSelect={() => {
                    router.push('/perfil/direcciones');
                    onClose();
                  }}
                >
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <span>Libreta de Direcciones</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="gap-2.5 cursor-pointer text-sm"
                  onSelect={() => {
                    router.push('/perfil/logros');
                    onClose();
                  }}
                >
                  <Award size={16} className="text-muted-foreground shrink-0" />
                  <span>Mis Logros</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    void handleLogout();
                  }}
                  className="gap-2.5 cursor-pointer text-sm"
                >
                  <LogOut size={16} className="shrink-0" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-center text-[10px] sm:text-[11px] uppercase font-mono tracking-[0.2em] text-muted-foreground/80 pt-1">
            Vanguardia Activa · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}