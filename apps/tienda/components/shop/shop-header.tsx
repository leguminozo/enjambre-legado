'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, X, User } from 'lucide-react';
import { useCart } from '@/components/shop/cart-context';
import { useAuth } from '@/components/providers/auth-context';
import { useState } from 'react';

const NAV = [
  { href: '/catalogo', label: 'Creaciones' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export function ShopHeader() {
  const cart = useCart();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-[60] bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <button
          className="md:hidden text-muted-foreground hover:text-accent transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 group">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-lg tracking-[0.3em] uppercase text-foreground group-hover:text-accent transition-colors">
              La Obrera
            </span>
            <span className="text-[0.6rem] tracking-[0.4em] uppercase text-accent -mt-1 font-light">
              y el Zángano
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-[0.65rem] uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                isActive(href) ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href={isAuthenticated ? (user?.role === 'tienda_admin' || user?.role === 'gerente' ? '/dashboard' : '/perfil') : '/login'}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2"
          >
            <User size={20} strokeWidth={1.5} />
            <span className="hidden lg:inline text-[0.6rem] uppercase tracking-[0.2em]">
              {isAuthenticated ? 'Mi Cuenta' : 'Acceso'}
            </span>
          </Link>

          <Link href="/checkout" className="relative group">
            <ShoppingBag size={20} strokeWidth={1.5} className="text-muted-foreground group-hover:text-accent transition-colors" />
            {cart.itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[0.6rem] font-bold flex items-center justify-center rounded-full">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className={`md:hidden fixed inset-0 top-24 bg-background z-50 transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="p-10 flex flex-col gap-8">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-display text-3xl font-light text-foreground hover:text-accent transition-colors"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="h-[1px] bg-border my-4" />
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="font-display text-2xl italic text-accent"
            onClick={() => setOpen(false)}
          >
            {isAuthenticated ? 'Panel de Control' : 'Iniciar Sesión'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
