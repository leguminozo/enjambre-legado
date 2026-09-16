'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import { ShoppingBag, LayoutGrid, TrendingUp, User, X, Hexagon, RotateCcw } from 'lucide-react';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { CampoProfileMenu } from '@/components/layout/campo-profile-menu';
import { RetornoEnvasesModal } from '@/components/pos/retorno-envases-modal';

export function PosHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { lines } = useCart();
  const { selectedClient, setSelectedClient } = useCashSession();
  const [retornoModalOpen, setRetornoModalOpen] = useState(false);

  const roleLabel = user?.role === 'admin' ? 'Administración' : 'Representante';
  const cartItemsCount = lines.reduce((s, l) => s + l.cantidad, 0);

  const posSubNav = [
    { name: 'Catálogo', href: '/pos/catalogo', icon: LayoutGrid },
    { name: 'Carrito', href: '/pos/carrito', icon: ShoppingBag, badge: cartItemsCount },
    { name: 'Historial', href: '/pos/historial', icon: TrendingUp },
  ];

  // Entrelazado: desde POS al resto del grafo de herramientas del rep
  const toolLinks = CAMPO_NAV_ROUTES.filter((r) => r.href !== '/pos');

  return (
    <header className="border-b border-border bg-background md:bg-background/80 md:backdrop-blur-md px-4 md:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between sticky top-0 z-50 gap-3">
      <div className="flex items-center gap-4 md:gap-8 min-w-0">
        <Link href="/pos" className="group flex items-center gap-3 shrink-0 min-h-11">
          <div className="w-10 h-10 min-w-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent/25 transition-colors">
            <Hexagon size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-display tracking-[0.2em] text-xs uppercase text-foreground leading-tight">Enjambre</span>
            <span className="font-display tracking-[0.1em] text-accent text-xs italic leading-tight">Campo</span>
          </div>
        </Link>

        <nav className="hidden md:flex gap-6 items-center">
          {posSubNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium tracking-widest uppercase transition-all min-h-11 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <span className="w-px h-5 bg-border" aria-hidden />
          {toolLinks.map((route) => {
            const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`text-xs font-medium tracking-wide uppercase transition-all min-h-11 flex items-center ${
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        <nav className="flex md:hidden gap-3" aria-label="Navegación POS móvil">
          {posSubNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase transition-all min-h-11 min-w-11 ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Botón Economía Circular: Retorno de Vidrio */}
        <button
          type="button"
          onClick={() => setRetornoModalOpen(true)}
          className="flex items-center gap-1.5 border border-border/80 bg-surface-sunken hover:bg-surface text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-9"
          title="Recepción de frascos de vidrio retornables"
        >
          <RotateCcw size={14} className="text-accent" />
          <span className="hidden sm:inline">Retorno Vidrio</span>
        </button>

        {selectedClient && (
          <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-full text-xs text-primary font-medium">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[8rem]">{selectedClient.full_name || selectedClient.email}</span>
            <button
              type="button"
              onClick={() => setSelectedClient(null)}
              className="hover:text-destructive p-0.5"
              title="Desvincular cliente"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-border">
            <div className="hidden sm:flex flex-col items-end min-w-0">
              <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{roleLabel}</span>
              <span className="text-xs text-foreground font-medium truncate max-w-[12rem]">{user.email}</span>
            </div>
            <CampoProfileMenu compact side="bottom" align="end" />
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center px-5 py-2 bg-card text-foreground text-sm font-medium rounded-full border border-border hover:border-primary/30 transition-all"
          >
            Entrar
          </Link>
        )}
      </div>

      {/* Modal de recepción de frascos retornables */}
      <RetornoEnvasesModal
        open={retornoModalOpen}
        onClose={() => setRetornoModalOpen(false)}
      />
    </header>
  );
}

