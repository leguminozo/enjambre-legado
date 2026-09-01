'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import { LogOut, ShoppingBag, LayoutGrid } from 'lucide-react';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

export function PosHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  async function handleSignOut() {
    await signOut();
    window.location.href = '/login';
  }

  const posSubNav = [
    { name: 'Catálogo', href: '/pos/catalogo', icon: LayoutGrid },
    { name: 'Carrito', href: '/pos/carrito', icon: ShoppingBag },
  ];

  // Entrelazado: desde POS al resto del grafo de herramientas del rep
  const toolLinks = CAMPO_NAV_ROUTES.filter((r) => r.href !== '/pos');

  return (
    <header className="border-b border-border bg-background md:bg-background/80 md:backdrop-blur-md px-4 md:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between sticky top-0 z-50 gap-3">
      <div className="flex items-center gap-4 md:gap-8 min-w-0">
        <Link href="/pos" className="group flex items-center gap-3 shrink-0 min-h-11">
          <div className="w-11 h-11 min-w-11 bg-primary rounded-full flex items-center justify-center font-display text-primary-foreground font-bold">
            O
          </div>
          <span className="font-display text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            Campo
          </span>
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
                {item.name}
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
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-border">
            <div className="hidden sm:flex flex-col items-end min-w-0">
              <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Vendedor</span>
              <span className="text-xs text-foreground font-medium truncate max-w-[12rem]">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
    </header>
  );
}
