'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Creaciones' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/galeria', label: 'Galería' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export function ShopHeader() {
  const cart = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black">
      <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-4 sm:px-6 sm:pt-10">
        <Link
          href="/"
          className="mx-auto flex w-max flex-col items-center gap-3"
          onClick={() => setOpen(false)}
        >
          {/* Marcador de logo: sustituir por <Image src="/logo.png" /> cuando subas asset */}
          <div
            className="relative flex h-16 w-48 items-center justify-center rounded-sm border-2 border-[#c9a227]/90 bg-[#e8c547] px-2 shadow-[0_0_0_1px_rgba(0,0,0,0.4)] sm:h-[4.5rem] sm:w-56"
            aria-hidden
          >
            <span className="text-center font-display text-[0.65rem] font-bold uppercase leading-tight tracking-tight text-black sm:text-xs">
              La Obrera
              <br />
              y el Zángano
            </span>
          </div>
          <span className="sr-only">La Obrera y el Zángano — inicio</span>
        </Link>

        <Link
          href="/checkout"
          className="absolute right-4 top-8 rounded-md p-2 text-white/90 transition hover:bg-white/10 sm:right-6 sm:top-10"
          aria-label={`Carrito${cart.itemCount ? `, ${cart.itemCount} ítems` : ''}`}
        >
          <ShoppingBag className="h-6 w-6" strokeWidth={1.25} />
          {cart.itemCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9a227] px-1 text-[10px] font-bold text-black">
              {cart.itemCount > 9 ? '9+' : cart.itemCount}
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="hidden justify-center border-t border-white/5 px-4 py-3 sm:flex">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {NAV.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm font-medium tracking-wide text-white/90 transition hover:text-white ${
                  isActive(href) ? 'border-b border-white pb-0.5' : 'border-b border-transparent pb-0.5'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/login"
              className="text-sm font-medium text-white/50 transition hover:text-white/80"
            >
              Acceso
            </Link>
          </li>
        </ul>
      </nav>

      <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 sm:hidden">
        <span className="text-xs text-white/50">Menú</span>
        <button
          type="button"
          className="rounded-md p-2 text-white"
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-zinc-950 px-4 py-4 sm:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block py-2 text-base ${isActive(href) ? 'text-[#e8c547]' : 'text-white/90'}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block py-2 text-base text-white/50"
                onClick={() => setOpen(false)}
              >
                Acceso comercio
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
