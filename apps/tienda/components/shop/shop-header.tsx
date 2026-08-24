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
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUserNotifications } from '@/lib/hooks/use-user-notifications';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import { isActiveNavHref } from '@/lib/shop/store-routes';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';
import { useHeaderMenu } from '@/components/shop/header-menu-context';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveNavLabel, type HeaderNavItem } from '@/lib/shop/header-menu';
import { resolveHeaderBrand } from '@enjambre/shop-chrome';

export function ShopHeader() {
  const { itemCount } = useCartLines();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const switchLocale = useSwitchLocale();
  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tHeader = useTranslations('header');
  const { settings, items } = useHeaderMenu();
  const { brand } = useStoreChrome();
  const headerBrand = resolveHeaderBrand(brand, settings);
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

  const desktopItems = useMemo(
    () => items.filter((i) => i.show_desktop !== false),
    [items],
  );
  const mobileItems = useMemo(
    () => items.filter((i) => i.show_mobile !== false),
    [items],
  );

  useOverlayLock(open || notifOpen);
  useModalFocusTrap({ open, onClose: closeMenu, containerRef: panelRef });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (notifOpen) setOpen(false);
  }, [notifOpen]);

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

  const brandBlock = headerBrand.showText ? (
    <div className="flex min-w-0 max-w-full flex-col items-center md:items-start">
      <span
        className="font-display max-w-full text-center text-[clamp(0.78rem,3.6vw,1.125rem)] uppercase leading-tight text-foreground transition-colors group-hover:text-accent md:text-left"
        style={{
          letterSpacing:
            'min(var(--tienda-brand-tracking, 0.3em), var(--tienda-brand-tracking-max, 1em))',
        }}
      >
        {settings.brand_line1 || tHeader('brandLine1')}
      </span>
      <span
        className="mt-0.5 max-w-full text-center text-[clamp(0.52rem,2.4vw,0.6rem)] font-light uppercase leading-tight text-accent-text md:text-left"
        style={{
          letterSpacing:
            'min(calc(var(--tienda-brand-tracking, 0.3em) + 0.1em), calc(var(--tienda-brand-tracking-max, 1em) + 0.08em))',
        }}
      >
        {settings.brand_line2 || tHeader('brandLine2')}
      </span>
    </div>
  ) : null;

  const logoImg = headerBrand.logoSrc ? (
    <img
      src={headerBrand.logoSrc}
      alt={settings.brand_line1 || tHeader('brandLine1') || 'Logo'}
      style={{
        height: `${headerBrand.heightPx}px`,
        maxWidth: headerBrand.maxWidthPx > 0 ? `${headerBrand.maxWidthPx}px` : undefined,
        width: 'auto',
      }}
      className="object-contain shrink-0 max-w-full"
    />
  ) : null;

  const logoContent =
    logoImg || brandBlock ? (
      <>
        {logoImg}
        {brandBlock}
      </>
    ) : (
      <span className="font-display text-lg uppercase text-foreground truncate">
        {settings.brand_line1 || tHeader('brandLine1')}
      </span>
    );

  const logoLink = (
    <Link
      href="/"
      className={`group flex min-h-11 min-w-0 items-center gap-2 md:gap-4 ${
        settings.layout === 'centered'
          ? // Sin overflow-hidden: en iPhone 8 el tracking recortaba "ZÁNGANO".
            'absolute left-1/2 -translate-x-1/2 max-w-[calc(100%-7.25rem)]'
          : settings.layout === 'classic'
            ? 'absolute left-1/2 -translate-x-1/2 max-w-[calc(100%-7.25rem)] md:static md:translate-x-0 md:max-w-none'
            : 'flex-1 md:flex-none'
      }`}
      aria-label={settings.brand_line1 || tHeader('brandLine1') || 'Inicio'}
    >
      {logoContent}
    </Link>
  );

  const forceBurger = settings.force_burger_desktop;
  // Desktop horizontal nav from xl — con DevTools o 6 ítems a 1024px se pisan
  // (INICIO/CREACIONES/GALERÍA se leían como "VIR"/"DEL" encima).
  const navDesktop = !forceBurger ? (
    <nav
      className={`items-center min-w-0 ${
        settings.layout === 'centered'
          ? 'hidden xl:flex w-full justify-center order-last'
          : 'hidden xl:flex'
      }`}
      style={{
        gap: 'var(--tienda-nav-gap, 1.25rem)',
      }}
      aria-label={tNav('main')}
    >
      {desktopItems.map((item) => (
        <NavDesktopLink key={item.href + item.label} item={item} pathname={normalizedPath} locale={locale} />
      ))}
    </nav>
  ) : null;

  const actions = (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
      {settings.show_notifications && isAuthenticated && (
        <div className="hidden lg:block">
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
        </div>
      )}

      {settings.show_account && (
        <Link
          href={isAuthenticated ? '/perfil' : '/login'}
          className="min-h-[44px] min-w-[44px] px-1.5 text-muted-foreground hover:text-accent transition-colors inline-flex items-center justify-center gap-2"
          aria-label={isAuthenticated ? tNav('myAccount') : tNav('access')}
        >
          <User size={20} strokeWidth={1.5} aria-hidden />
          <span className="hidden xl:inline text-[0.6rem] uppercase tracking-[0.2em]">
            {isAuthenticated ? tNav('myAccount') : tNav('access')}
          </span>
        </Link>
      )}

      {settings.show_cart && (
        <Link
          href="/carrito"
          data-testid="cart-link"
          className="relative group min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          aria-label={tNav('cart')}
        >
          <ShoppingBag
            size={20}
            strokeWidth={1.5}
            className="text-muted-foreground group-hover:text-accent transition-colors"
          />
          {itemCount > 0 && (
            <span className="absolute top-1 right-0.5 min-w-[1rem] h-4 px-0.5 bg-primary text-primary-foreground text-[0.6rem] font-bold flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          )}
        </Link>
      )}

      {settings.show_lang_selector && (
        <div className="pl-0.5 sm:pl-1 hidden lg:block">
          <LanguageSelector />
        </div>
      )}
    </div>
  );

  const headerPosition = settings.sticky ? 'sticky' : 'relative';
  const blurClass = settings.backdrop_blur ? 'md:backdrop-blur-md' : '';

  const panelClass =
    settings.mobile_menu === 'drawer-left'
      ? 'tienda-mobile-nav-panel tienda-mobile-nav-panel--drawer-left'
      : settings.mobile_menu === 'drawer-right'
        ? 'tienda-mobile-nav-panel tienda-mobile-nav-panel--drawer-right'
        : 'tienda-mobile-nav-panel';

  return (
    <header
      className={`tienda-shop-header z-[60] border-b border-border ${headerPosition} ${blurClass} ${
        open ? 'is-menu-open' : ''
      } ${settings.layout === 'centered' ? 'tienda-shop-header--centered' : ''}`}
      style={{
        top: settings.sticky ? 'var(--carousel-h, 0px)' : undefined,
      }}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 ${
          settings.layout === 'centered' ? 'flex-wrap lg:flex-col lg:gap-3 lg:py-3' : ''
        }`}
        style={{
          minHeight: 'var(--tienda-header-h, 4rem)',
        }}
      >
        <button
          type="button"
          className={`tienda-shop-header-burger p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors ${
            forceBurger ? '' : 'xl:hidden'
          }`}
          onClick={toggleMenu}
          aria-controls="tienda-mobile-nav-panel"
          aria-label={open ? tHeader('closeMenu') : tHeader('openMenu')}
          aria-expanded={open}
          aria-hidden={isPwa && !forceBurger}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {settings.layout === 'split' && !forceBurger ? (
          <>
            {logoLink}
            <div className="hidden xl:flex items-center flex-1 justify-end gap-4 xl:gap-6 min-w-0">
              {navDesktop}
              {actions}
            </div>
            <div className="xl:hidden shrink-0">{actions}</div>
          </>
        ) : settings.layout === 'centered' && !forceBurger ? (
          <>
            {logoLink}
            {actions}
            {navDesktop}
          </>
        ) : (
          <>
            {logoLink}
            {navDesktop}
            {actions}
          </>
        )}
      </div>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className={`tienda-mobile-nav-root ${forceBurger ? '' : 'xl:hidden'}`}>
            <button
              type="button"
              className="tienda-mobile-nav-backdrop"
              aria-label={tHeader('closeMenu')}
              onClick={closeMenu}
            />
            <div
              id="tienda-mobile-nav-panel"
              ref={panelRef}
              className={panelClass}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tienda-mobile-nav-title"
              tabIndex={-1}
            >
              <h2 id="tienda-mobile-nav-title" className="sr-only">
                {tHeader('navTitle')}
              </h2>
              <div className="tienda-mobile-nav-scroll">
                <nav
                  className="flex flex-col"
                  style={{
                    gap: 'var(--tienda-mobile-nav-gap, 1.75rem)',
                  }}
                  aria-label={tNav('main')}
                >
                  {mobileItems.map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className={`flex w-full shrink-0 min-h-11 items-center font-light transition-colors ${
                        settings.mobile_font === 'display' ? 'font-display' : 'font-sans'
                      } ${
                        isActiveNavHref(normalizedPath, item.href)
                          ? 'text-accent-text'
                          : 'text-foreground hover:text-accent'
                      }`}
                      style={{
                        fontSize: 'var(--tienda-mobile-nav-size, 1.875rem)',
                        letterSpacing: 'var(--tienda-mobile-nav-tracking, 0em)',
                      }}
                      onClick={closeMenu}
                    >
                      {resolveNavLabel(item, locale)}
                    </Link>
                  ))}
                  <div className="h-px bg-border my-2 shrink-0" />
                  {settings.show_cart && (
                    <Link
                      href="/carrito"
                      className="flex w-full shrink-0 min-h-11 items-center font-display text-2xl font-light text-foreground hover:text-accent transition-colors"
                      onClick={closeMenu}
                    >
                      {tNav('yourCart')}
                      {itemCount > 0 ? ` (${itemCount})` : ''}
                    </Link>
                  )}
                  {settings.show_account && (
                    <Link
                      href={isAuthenticated ? '/perfil' : '/login'}
                      className="flex w-full shrink-0 min-h-11 items-center font-display text-2xl italic text-accent-text transition-colors"
                      onClick={closeMenu}
                    >
                      {isAuthenticated ? tNav('controlPanel') : tNav('login')}
                    </Link>
                  )}
                  {settings.show_lang_selector && (
                    <button
                      type="button"
                      className="mt-4 self-start shrink-0 min-h-11 rounded-full border border-border bg-surface-sunken px-5 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent"
                      onClick={switchLocale}
                    >
                      {locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}

function NavDesktopLink({
  item,
  pathname,
  locale,
}: {
  item: HeaderNavItem;
  pathname: string;
  locale: string;
}) {
  const { settings } = useHeaderMenu();
  return (
    <Link
      href={item.href}
      className={`inline-flex items-center min-h-[44px] whitespace-nowrap transition-colors hover:text-accent py-1 ${
        settings.nav_font === 'display' ? 'font-display' : 'font-sans'
      } ${isActiveNavHref(pathname, item.href) ? 'text-accent-text' : 'text-muted-foreground'}`}
      style={{
        fontSize: 'var(--tienda-nav-size, 0.65rem)',
        letterSpacing: 'var(--tienda-nav-tracking, 0.18em)',
        textTransform: settings.nav_text_transform,
        // La var la setea HeaderMenuProvider desde nav_font: fuente única de
        // verdad para que la config CMS del menú se aplique aquí también.
        fontFamily: 'var(--tienda-nav-font, var(--font-sans, Inter, system-ui, sans-serif))',
      }}
    >
      {resolveNavLabel(item, locale)}
    </Link>
  );
}
