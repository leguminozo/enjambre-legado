'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@enjambre/auth';
import { LogOut, ShoppingBag, LayoutGrid } from 'lucide-react';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

export function PosHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  async function handleSignOut() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  const posSubNav = [
    { name: 'Catálogo', href: '/pos/catalogo', icon: LayoutGrid },
    { name: 'Carrito', href: '/pos/carrito', icon: ShoppingBag },
  ];

  // Entrelazado: desde POS al resto del grafo de herramientas del rep
  const toolLinks = CAMPO_NAV_ROUTES.filter((r) => r.href !== '/pos');

  return (
    <header className="border-b border-border bg-background md:bg-background/80 md:backdrop-blur-md px-4 md:px-8 py-5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8 min-w-0">
        <Link href="/pos" className="group flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-display text-primary-foreground font-bold">
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

      <div className="flex items-center gap-6">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4 pl-6 border-l border-border">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">Vendedor</span>
              <span className="text-xs text-foreground font-medium">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-6 py-2 bg-card text-foreground text-sm font-medium rounded-full border border-border hover:border-primary/30 transition-all"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
