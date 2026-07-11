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
  const brandLogo = brand.logo_url || '/icons/icon-192.svg';
  const brandLogoHeight = brand.logo_height_px || 40;
  const brandLogoMaxWidth = brand.logo_max_width_px || 180;
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

  const brandBlock = settings.show_brand_text ? (
    <div className="flex flex-col items-center md:items-start">
      <span
        className="font-display text-lg uppercase text-foreground group-hover:text-accent transition-colors"
        style={{ letterSpacing: 'var(--tienda-brand-tracking, 0.3em)' }}
      >
        {settings.brand_line1 || tHeader('brandLine1')}
      </span>
      <span
        className="text-[0.6rem] uppercase text-accent -mt-1 font-light"
        style={{ letterSpacing: 'calc(var(--tienda-brand-tracking, 0.3em) + 0.1em)' }}
      >
        {settings.brand_line2 || tHeader('brandLine2')}
      </span>
    </div>
  ) : null;

  const logoImgSrc =
    settings.show_logo && settings.logo_src ? settings.logo_src : brandLogo;
  const logoImgHeight =
    settings.show_logo && settings.logo_src
      ? settings.logo_height_px || brandLogoHeight
      : brandLogoHeight;
  const logoImg = (
    <img
      src={logoImgSrc}
      alt={settings.brand_line1 || tHeader('brandLine1') || 'Logo'}
      style={{
        height: `${logoImgHeight}px`,
        maxWidth: brandLogoMaxWidth > 0 ? `${brandLogoMaxWidth}px` : undefined,
        width: 'auto',
      }}
      className="object-contain shrink-0"
    />
  );

  // Menú con logo dedicado → solo imagen. Si no, marca (logo + texto opcional).
  const logoContent =
    settings.show_logo && settings.logo_src ? (
      logoImg
    ) : (
      <>
        {logoImg}
        {brandBlock}
      </>
    );

  const logoLink = (
    <Link
      href="/"
      className={`group flex items-center gap-3 md:gap-4 ${
        settings.layout === 'centered'
          ? 'absolute left-1/2 -translate-x-1/2'
          : settings.layout === 'classic'
            ? 'absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0'
            : ''
      }`}
    >
      {logoContent}
    </Link>
  );

  const forceBurger = settings.force_burger_desktop;
  const navDesktop = !forceBurger ? (
    <nav
      className={`items-center ${
        settings.layout === 'centered' ? 'hidden md:flex w-full justify-center order-last' : 'hidden md:flex'
      }`}
      style={{
        gap: 'var(--tienda-nav-gap, 2.5rem)',
      }}
      aria-label={tNav('main')}
    >
      {desktopItems.map((item) => (
        <NavDesktopLink key={item.href + item.label} item={item} pathname={normalizedPath} locale={locale} />
      ))}
    </nav>
  ) : null;

  const actions = (
    <div className="flex items-center gap-3 sm:gap-5">
      {settings.show_notifications && isAuthenticated && (
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

      {settings.show_account && (
        <Link
          href={isAuthenticated ? '/perfil' : '/login'}
          className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2"
        >
          <User size={20} strokeWidth={1.5} />
          <span className="hidden lg:inline text-[0.6rem] uppercase tracking-[0.2em]">
            {isAuthenticated ? tNav('myAccount') : tNav('access')}
          </span>
        </Link>
      )}

      {settings.show_cart && (
        <Link href="/carrito" data-testid="cart-link" className="relative group" aria-label={tNav('cart')}>
          <ShoppingBag
            size={20}
            strokeWidth={1.5}
            className="text-muted-foreground group-hover:text-accent transition-colors"
          />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[0.6rem] font-bold flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          )}
        </Link>
      )}

      {settings.show_lang_selector && (
        <div className="hidden sm:block">
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
      style={{ top: settings.sticky ? 'var(--carousel-h, 0px)' : undefined }}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between ${
          settings.layout === 'centered' ? 'flex-wrap md:flex-col md:gap-3 md:py-3' : ''
        }`}
        style={{
          minHeight: 'var(--tienda-header-h, 4rem)',
        }}
      >
        <button
          type="button"
          className={`tienda-shop-header-burger p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-accent transition-colors ${
            forceBurger ? '' : 'md:hidden'
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
            <div className="hidden md:flex items-center flex-1 justify-end gap-8">
              {navDesktop}
              {actions}
            </div>
            <div className="md:hidden">{actions}</div>
          </>
        ) : settings.layout === 'centered' && !forceBurger ? (
          <>
            <div className="w-10 md:hidden" aria-hidden />
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
          <div className={`tienda-mobile-nav-root ${forceBurger ? '' : 'md:hidden'}`}>
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
                    className={`font-light transition-colors ${
                      settings.mobile_font === 'display' ? 'font-display' : 'font-sans'
                    } ${
                      isActiveNavHref(normalizedPath, item.href)
                        ? 'text-accent'
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
                <div className="h-px bg-border my-2" />
                {settings.show_cart && (
                  <Link
                    href="/carrito"
                    className="font-display text-2xl font-light text-foreground hover:text-accent transition-colors"
                    onClick={closeMenu}
                  >
                    {tNav('yourCart')}
                    {itemCount > 0 ? ` (${itemCount})` : ''}
                  </Link>
                )}
                {settings.show_account && (
                  <Link
                    href={isAuthenticated ? '/perfil' : '/login'}
                    className="font-display text-2xl italic text-accent"
                    onClick={closeMenu}
                  >
                    {isAuthenticated ? tNav('controlPanel') : tNav('login')}
                  </Link>
                )}
                {settings.show_lang_selector && (
                  <button
                    type="button"
                    className="mt-4 self-start rounded-full border border-border bg-surface-sunken px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-accent"
                    onClick={switchLocale}
                  >
                    {locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
                  </button>
                )}
              </nav>
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
      className={`transition-colors hover:text-accent ${
        settings.nav_font === 'display' ? 'font-display' : 'font-sans'
      } ${isActiveNavHref(pathname, item.href) ? 'text-accent' : 'text-muted-foreground'}`}
      style={{
        fontSize: 'var(--tienda-nav-size, 0.65rem)',
        letterSpacing: 'var(--tienda-nav-tracking, 0.2em)',
        textTransform: settings.nav_text_transform,
      }}
    >
      {resolveNavLabel(item, locale)}
    </Link>
  );
}
