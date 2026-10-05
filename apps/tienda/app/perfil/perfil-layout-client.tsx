'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, ShoppingBag } from 'lucide-react';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { MobileBottomNav } from '@/components/shop/mobile-bottom-nav';
import { PerfilMobileHeader } from '@/components/shop/perfil-mobile-header';
import { NotificationBell } from '@enjambre/ui';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { useCartLines } from '@/components/shop/cart-context';
import type { OyzRole } from '@/lib/shop/role';
import type { ParticipacionActiva } from '@/lib/shop/participacion';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';

interface PerfilLayoutClientProps {
  children: React.ReactNode;
  user: TiendaUserProfile | null;
  role: OyzRole;
  participacion: ParticipacionActiva;
}

export function PerfilLayoutClient({ children, user, role, participacion }: PerfilLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const pathname = usePathname();
  const { itemCount: cartItemCount } = useCartLines();

  const { notifications, markRead, markAllRead, isLoading, error } = useUserNotifications(user?.id, {
    enableRealtime: realtimeOn,
  });

  React.useEffect(() => {
    document.body.classList.add('perfil-shell-active');
    return () => document.body.classList.remove('perfil-shell-active');
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      {/* Fondo estático de lujo ambiental: CERO cómputo GPU/CPU, 60fps constantes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,165,116,0.05),transparent_70%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-background/80 pointer-events-none z-0" />

      <GuardianSidebar
        user={user}
        participacion={participacion}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header móvil con campanita y accesos rápidos */}
        <PerfilMobileHeader
          onOpenMenu={() => setSidebarOpen(true)}
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onOpenChange={(open) => setRealtimeOn(open)}
          isLoading={isLoading}
          error={error}
        />

        {/* Barra superior de escritorio: limpia, despejada y con espacio para la campanita */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 border-b border-border/40 bg-background/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Mi Legado
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border/60 bg-surface-raised/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Grid3X3 size={15} />
              <span>Tienda</span>
            </Link>

            <Link
              href="/carrito"
              className="relative inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Bolsa de compras"
            >
              <ShoppingBag size={18} />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <div className="h-4 w-[1px] bg-border/60 mx-1" />

            <NotificationBell
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onOpenChange={(open) => setRealtimeOn(open)}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 perfil-shell-content">
          <div className="max-w-6xl mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 w-full animate-in">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
