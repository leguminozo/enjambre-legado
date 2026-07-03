'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, X, User } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { useAuth } from '@/components/providers/auth-context';
import { LanguageSelector } from '@/components/shop/language-selector';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n-navigation';
import type { Locale } from '@/i18n-routing';
import { NotificationBell } from '@enjambre/ui';
import { useEffect, useState } from 'react';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';

const NAV_PUBLIC = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Creaciones' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/galeria', label: 'Galería' },
  { href: '/ciencia', label: 'Ciencia' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/qr-scan', label: 'Escáner QR' },
  { href: '/contacto', label: 'Contacto' },
] as const;

export function ShopHeader() {
  const { itemCount } = useCartLines();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const { notifications, markRead, markAllRead, isLoading, error } = useUserNotifications(user?.id, {
    enableRealtime: realtimeOn,
  });

  const normalizedPath = pathname || '/';

  const isActive = (href: string) => {
    if (href === '/') return normalizedPath === '/';
    return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
  };

  useOverlayLock(open || notifOpen);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`tienda-shop-header sticky z-[60] border-b border-border md:backdrop-blur-md ${open ? 'is-menu-open' : ''}`}
      style={{ top: 'var(--carousel-h, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        <button
          type="button"
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
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
          {NAV_PUBLIC.map(({ href, label }) => (
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

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {isAuthenticated && (
            <NotificationBell
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onOpenChange={(isOpen) => {
                setNotifOpen(isOpen);
                if (isOpen) setRealtimeOn(true);
              }}
              isLoading={isLoading}
              error={error}
            />
          )}

          <Link
            href={isAuthenticated ? '/perfil' : '/login'}
            className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2"
          >
            <User size={20} strokeWidth={1.5} />
            <span className="hidden lg:inline text-[0.6rem] uppercase tracking-[0.2em]">
              {isAuthenticated ? 'Mi Cuenta' : 'Acceso'}
            </span>
          </Link>

          <Link href="/carrito" data-testid="cart-link" className="relative group" aria-label="Carrito">
            <ShoppingBag size={20} strokeWidth={1.5} className="text-muted-foreground group-hover:text-accent transition-colors" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[0.6rem] font-bold flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="tienda-mobile-nav-backdrop md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div
            className="tienda-mobile-nav-panel md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <nav className="flex flex-col gap-7">
              {NAV_PUBLIC.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`font-display text-3xl font-light transition-colors ${
                    isActive(href) ? 'text-accent' : 'text-foreground hover:text-accent'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <Link
                href="/carrito"
                className="font-display text-2xl font-light text-foreground hover:text-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                Tu carrito{itemCount > 0 ? ` (${itemCount})` : ''}
              </Link>
              <Link
                href={isAuthenticated ? '/perfil' : '/login'}
                className="font-display text-2xl italic text-accent"
                onClick={() => setOpen(false)}
              >
                {isAuthenticated ? 'Panel de Control' : 'Iniciar Sesión'}
              </Link>
              <button
                type="button"
                className="mt-4 self-start rounded-full border border-border bg-surface-sunken px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent md:hidden"
                onClick={() => router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' })}
              >
                {locale === 'es' ? 'English' : 'Español'}
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}