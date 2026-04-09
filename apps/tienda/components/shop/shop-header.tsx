'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';

const LINKS = [
  { href: '/catalogo', label: 'Creaciones' },
  { href: '/impacto', label: 'Legado del bosque' },
] as const;

export function ShopHeader() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-bosque-900/10 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex flex-col leading-tight"
          onClick={() => setOpen(false)}
        >
          <span className="font-display text-lg font-semibold tracking-tight text-bosque-800 sm:text-xl">
            La Obrera y el Zángano
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-miel-700 sm:text-xs">
            Miel del bosque · Chiloé
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-bosque-800/85 transition-colors hover:text-miel-700"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium text-bosque-700/70 transition-colors hover:text-bosque-900"
          >
            Acceso
          </Link>
          <Link
            href="/checkout"
            className="relative inline-flex items-center gap-2 rounded-full border border-bosque-900/15 bg-white px-4 py-2 text-sm font-semibold text-bosque-900 shadow-sm transition hover:border-miel-600/40 hover:bg-miel-50/50"
          >
            <ShoppingBag className="h-4 w-4 text-miel-700" aria-hidden />
            Carrito
            {cart.itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-miel-600 px-1 text-[10px] font-bold text-white">
                {cart.itemCount > 9 ? '9+' : cart.itemCount}
              </span>
            ) : null}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/checkout"
            className="relative rounded-full border border-bosque-900/15 bg-white p-2.5 text-bosque-900"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-miel-600 px-1 text-[9px] font-bold text-white">
                {cart.itemCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="rounded-full border border-bosque-900/15 p-2.5 text-bosque-900"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-bosque-900/10 bg-cream-50 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="py-2 text-base font-medium text-bosque-900"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/login"
              className="py-2 text-base font-medium text-bosque-700/80"
              onClick={() => setOpen(false)}
            >
              Acceso comercio
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
