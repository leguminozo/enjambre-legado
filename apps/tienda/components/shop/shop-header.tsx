'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, X, User } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { useAuth } from '@/components/providers/auth-context';
import { LanguageSelector } from '@/components/shop/language-selector';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n-navigation';
import type { Locale } from '@/i18n-routing';
import { useSwitchLocale } from '@/lib/shop/switch-locale';
import { NotificationBell, useModalFocusTrap } from '@enjambre/ui';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import { isActiveNavHref, PUBLIC_NAV } from '@/lib/shop/store-routes';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';

export function ShopHeader() {
  const { itemCount } = useCartLines();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const switchLocale = useSwitchLocale();
  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tHeader = useTranslations('header');
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifBellKey, setNotifBellKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setOpen(false);
  const [realtimeOn, setRealtimeOn] = useState(false);
  const isPwa = usePwaStandalone();
  const { notifications, markRead, markAllRead, isLoading, error } = useUserNotifications(user?.id, {
    enableRealtime: realtimeOn,
  });

  const normalizedPath = pathname || '/';

  useOverlayLock(open || notifOpen);
  useModalFocusTrap({ open, onClose: closeMenu, containerRef: panelRef });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (notifOpen) setOpen(false);
  }, [notifOpen]);

  // Fallback para browsers sin soporte :has() — marca el <body> para el CSS legacy
  useEffect(() => {
    if (isPwa) {
      document.body.classList.add('pwa-standalone');
    } else {
      document.body.classList.remove('pwa-standalone');
    }
    return () => {
      document.body.classList.remove('pwa-standalone');
    };
  }, [isPwa]);

  const toggleMenu = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setNotifOpen(false);
        setNotifBellKey((k) => k + 1);
      }
      return next;
    });
  };

  return (
    <header
      className={`tienda-shop-header sticky z-[60] border-b border-border md:backdrop-blur-md ${open ? 'is-menu-open' : ''}`}
      style={{ top: 'var(--carousel-h, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        <button
          type="button"
          className="tienda-shop-header-burger md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
          onClick={toggleMenu}
          aria-controls="tienda-mobile-nav-panel"
          aria-label={open ? tHeader('closeMenu') : tHeader('openMenu')}
          aria-expanded={open}
          aria-hidden={isPwa}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 group">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-display text-lg tracking-[0.3em] uppercase text-foreground group-hover:text-accent transition-colors">
              {tHeader('brandLine1')}
            </span>
            <span className="text-[0.6rem] tracking-[0.4em] uppercase text-accent -mt-1 font-light">
              {tHeader('brandLine2')}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10" aria-label={tNav('main')}>
          {PUBLIC_NAV.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className={`text-[0.65rem] uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                isActiveNavHref(normalizedPath, href) ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              {tNav(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {isAuthenticated && (
            <NotificationBell
              key={notifBellKey}
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onOpenChange={(isOpen) => {
                setNotifOpen(isOpen);
                if (isOpen) {
                  setOpen(false);
                  setRealtimeOn(true);
                }
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
              {isAuthenticated ? tNav('myAccount') : tNav('access')}
            </span>
          </Link>

          <Link href="/carrito" data-testid="cart-link" className="relative group" aria-label={tNav('cart')}>
            <ShoppingBag size={20} strokeWidth={1.5} className="text-muted-foreground group-hover:text-accent transition-colors" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[0.6rem] font-bold flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="tienda-mobile-nav-root md:hidden">
            <button
              type="button"
              className="tienda-mobile-nav-backdrop"
              aria-label={tHeader('closeMenu')}
              onClick={closeMenu}
            />
            <div
              id="tienda-mobile-nav-panel"
              ref={panelRef}
              className="tienda-mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tienda-mobile-nav-title"
              tabIndex={-1}
            >
              <h2 id="tienda-mobile-nav-title" className="sr-only">
                {tHeader('navTitle')}
              </h2>
              <nav className="flex flex-col gap-7" aria-label={tNav('main')}>
                {PUBLIC_NAV.map(({ href, labelKey }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`font-display text-3xl font-light transition-colors ${
                      isActiveNavHref(normalizedPath, href) ? 'text-accent' : 'text-foreground hover:text-accent'
                    }`}
                    onClick={closeMenu}
                  >
                    {tNav(labelKey)}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <Link
                  href="/carrito"
                  className="font-display text-2xl font-light text-foreground hover:text-accent transition-colors"
                  onClick={closeMenu}
                >
                  {tNav('yourCart')}
                  {itemCount > 0 ? ` (${itemCount})` : ''}
                </Link>
                <Link
                  href={isAuthenticated ? '/perfil' : '/login'}
                  className="font-display text-2xl italic text-accent"
                  onClick={closeMenu}
                >
                  {isAuthenticated ? tNav('controlPanel') : tNav('login')}
                </Link>
                <button
                  type="button"
                  className="mt-4 self-start rounded-full border border-border bg-surface-sunken px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent"
                  onClick={switchLocale}
                >
                  {locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
                </button>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}