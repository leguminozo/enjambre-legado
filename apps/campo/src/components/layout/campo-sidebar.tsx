'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hexagon,
  LayoutGrid,
  ShoppingBag,
  TrendingUp,
  Store,
  Tent,
  WalletCards,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useOptionalCart } from '@/components/pos/cart-context';
import { useOptionalCashSession } from '@/components/pos/cash-context';
import { CampoProfileMenu } from './campo-profile-menu';

export function CampoSidebar() {
  const pathname = usePathname();
  const cart = useOptionalCart();
  const cash = useOptionalCashSession();

  const cartItemsCount = cart ? cart.lines.reduce((s, l) => s + l.cantidad, 0) : 0;
  const isSessionOpen = Boolean(cash?.session);
  const selectedClient = cash?.selectedClient;

  const posNavRoutes = [
    {
      href: '/pos/catalogo',
      label: 'Catálogo',
      description: 'Venta rápida 3 toques',
      icon: LayoutGrid,
    },
    {
      href: '/pos/carrito',
      label: 'Carrito',
      description: 'Cobro multi-producto',
      icon: ShoppingBag,
      badge: cartItemsCount,
    },
    {
      href: '/pos/historial',
      label: 'Historial',
      description: 'Ventas y rendición',
      icon: TrendingUp,
    },
    {
      href: '/pos',
      label: 'Terminal POS',
      description: 'Apertura y estado',
      icon: Store,
    },
  ];

  const terrainNavRoutes = [
    {
      href: '/mi-feria',
      label: 'Mi Feria',
      description: 'Gestión de puesto y stock',
      icon: Tent,
    },
    {
      href: '/caja',
      label: 'Control de Caja',
      description: 'Arqueos y cierres',
      icon: WalletCards,
    },
    {
      href: '/comisiones',
      label: 'Comisiones',
      description: 'Tus ganancias y metas',
      icon: TrendingUp,
    },
    {
      href: '/leaderboard',
      label: 'Ranking',
      description: 'Leaderboard del enjambre',
      icon: Trophy,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-sunken border-r border-border h-full sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/40">
        <Link href="/pos" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
            <Hexagon size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-display tracking-[0.2em] text-sm uppercase text-foreground">Enjambre</span>
            <span className="font-display tracking-[0.1em] text-accent text-xs italic">Campo</span>
          </div>
        </Link>

        {cash && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-background/60 border border-border text-[11px]">
            <div className={`w-2 h-2 rounded-full ${isSessionOpen ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            <span className="text-muted-foreground font-medium">
              {isSessionOpen ? 'Caja abierta' : 'Caja cerrada'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Navegación lateral Campo">
        {/* POS Group */}
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2 font-bold">
            Punto de Venta
          </p>
          <div className="space-y-1">
            {posNavRoutes.map((route) => {
              const isActive = pathname === route.href || (route.href !== '/pos' && pathname.startsWith(`${route.href}/`));
              const Icon = route.icon;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-start gap-3 min-h-11 px-3 py-2 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`mt-0.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm leading-tight">{route.label}</span>
                      {Boolean(route.badge && route.badge > 0) && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[1.2rem] text-center leading-tight">
                          {route.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{route.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Terreno Group */}
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2 font-bold">
            Herramientas de Terreno
          </p>
          <div className="space-y-1">
            {terrainNavRoutes.map((route) => {
              const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
              const Icon = route.icon;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-start gap-3 min-h-11 px-3 py-2 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-accent/15 text-accent font-medium'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`mt-0.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm leading-tight">{route.label}</span>
                    <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{route.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Selected Client Chip */}
        {selectedClient && (
          <div className="mx-1 p-2.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Cliente vinculado</p>
                <p className="text-xs text-foreground font-medium truncate">{selectedClient.full_name || selectedClient.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => cash?.setSelectedClient(null)}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
              title="Desvincular cliente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border/40">
        <CampoProfileMenu side="top" align="start" />
      </div>
    </aside>
  );
}
