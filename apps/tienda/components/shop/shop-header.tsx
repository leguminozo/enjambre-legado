'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, X, User, ChevronDown } from 'lucide-react';
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
import { isActiveNavHref, safeStoreReturnPath } from '@/lib/shop/store-routes';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';
import { useHeaderMenu } from '@/components/shop/header-menu-context';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveNavLabel, resolveNavDescription, type HeaderNavItem, type HeaderSubItem } from '@/lib/shop/header-menu';
import { resolveHeaderBrand } from '@enjambre/shop-chrome';
import { TextCarousel } from '@/components/shop/text-carousel';

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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifBellKey, setNotifBellKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => {
    setOpen(false);
    setExpandedSection(null);
  };
  const [realtimeOn, setRealtimeOn] = useState(false);
  const isPwa = usePwaStandalone();
  const { notifications, markRead, markAllRead, isLoading, error } = useUserNotifications(user?.id, {
    enableRealtime: realtimeOn,
  });

  const normalizedPath = pathname || '/';

  const loginTarget = useMemo(() => {
    const safeReturn = safeStoreReturnPath(normalizedPath);
    if (safeReturn && safeReturn !== '/' && safeReturn !== '/perfil') {
      return `/login?returnTo=${encodeURIComponent(safeReturn)}`;
    }
    return '/login';
  }, [normalizedPath]);

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

  const brandLine1 = brand.brand_name?.trim() || settings.brand_line1?.trim() || tHeader('brandLine1');
  const brandLine2 = brand.brand_tagline?.trim() || settings.brand_line2?.trim() || tHeader('brandLine2');

  const brandNameSizeMobile = brand.brand_name_size_mobile_px ?? 15;
  const brandNameSizeDesktop = brand.brand_name_size_desktop_px ?? 18;
  const brandTaglineSizeMobile = brand.brand_tagline_size_mobile_px ?? 9;
  const brandTaglineSizeDesktop = brand.brand_tagline_size_desktop_px ?? 10;
  const showTaglineMobile = brand.brand_tagline_show_mobile !== false;
  const showTaglineDesktop = brand.brand_tagline_show_desktop !== false;

  const brandBlock = headerBrand.showText ? (
    <div className="flex min-w-0 max-w-full flex-col items-center md:items-start">
      <span
        className="font-display max-w-full text-center text-[var(--header-brand-name-mobile)] md:text-[var(--header-brand-name-desktop)] uppercase leading-tight text-foreground transition-colors group-hover:text-accent md:text-left"
        style={
          {
            '--header-brand-name-mobile': `${brandNameSizeMobile}px`,
            '--header-brand-name-desktop': `${brandNameSizeDesktop}px`,
            letterSpacing:
              'min(var(--tienda-brand-tracking, 0.3em), var(--tienda-brand-tracking-max, 1em))',
          } as React.CSSProperties
        }
      >
        {brandLine1}
      </span>
      {(showTaglineMobile || showTaglineDesktop) && brandLine2 ? (
        <span
          className={`mt-0.5 max-w-full text-center text-[var(--header-brand-tagline-mobile)] md:text-[var(--header-brand-tagline-desktop)] font-light uppercase leading-tight text-accent-text md:text-left ${
            !showTaglineMobile ? 'hidden md:inline-block' : !showTaglineDesktop ? 'inline-block md:hidden' : 'inline-block'
          }`}
          style={
            {
              '--header-brand-tagline-mobile': `${brandTaglineSizeMobile}px`,
              '--header-brand-tagline-desktop': `${brandTaglineSizeDesktop}px`,
              letterSpacing:
                'min(calc(var(--tienda-brand-tracking, 0.3em) + 0.1em), calc(var(--tienda-brand-tracking-max, 1em) + 0.08em))',
            } as React.CSSProperties
          }
        >
          {brandLine2}
        </span>
      ) : null}
    </div>
  ) : null;

  const logoImg = headerBrand.logoSrc ? (
    <img
      src={headerBrand.logoSrc}
      alt={brandLine1 || 'Logo'}
      style={
        {
          '--header-logo-h-mobile': `${headerBrand.heightMobilePx}px`,
          '--header-logo-h-desktop': `${headerBrand.heightDesktopPx}px`,
          maxWidth: headerBrand.maxWidthPx > 0 ? `${headerBrand.maxWidthPx}px` : undefined,
          width: 'auto',
        } as React.CSSProperties
      }
      className="h-[var(--header-logo-h-mobile)] md:h-[var(--header-logo-h-desktop)] object-contain shrink-0 max-w-full"
    />
  ) : null;

  const logoContent =
    logoImg || brandBlock ? (
      <>
        {logoImg}
        {brandBlock}
      </>
    ) : (
      <span
        className="font-display text-[var(--header-brand-name-mobile)] md:text-[var(--header-brand-name-desktop)] uppercase text-foreground truncate"
        style={
          {
            '--header-brand-name-mobile': `${brandNameSizeMobile}px`,
            '--header-brand-name-desktop': `${brandNameSizeDesktop}px`,
          } as React.CSSProperties
        }
      >
        {brandLine1}
      </span>
    );

  const logoLink = (
    <Link
      href="/"
      className={`group flex min-h-11 min-w-0 items-center gap-2 md:gap-4 shrink-0 ${
        settings.layout === 'centered'
          ? // Sin overflow-hidden: en iPhone 8 el tracking recortaba "ZÁNGANO".
            'absolute left-1/2 -translate-x-1/2 max-w-[calc(100%-7.25rem)]'
          : settings.layout === 'classic'
            ? 'absolute left-1/2 -translate-x-1/2 max-w-[calc(100%-7.25rem)] md:static md:translate-x-0 md:max-w-none'
            : 'flex-1 md:flex-none'
      }`}
      aria-label={brandLine1 || 'Inicio'}
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
          : 'hidden xl:flex flex-1 justify-center px-2 xl:px-4'
      }`}
      style={{
        gap: 'clamp(0.75rem, calc(var(--tienda-nav-gap, 1.5rem) * 0.45 + 0.4vw), var(--tienda-nav-gap, 1.5rem))',
      }}
      aria-label={tNav('main')}
    >
      {desktopItems.map((item) => (
        <NavDesktopLink key={item.href + item.label} item={item} pathname={normalizedPath} locale={locale} />
      ))}
    </nav>
  ) : null;

  const actions = (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0 justify-end">
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
          href={isAuthenticated ? '/perfil' : loginTarget}
          className="min-h-[44px] min-w-[44px] px-1.5 text-muted-foreground hover:text-accent transition-colors inline-flex items-center justify-center"
          aria-label={isAuthenticated ? tNav('myAccount') : tNav('access')}
          title={isAuthenticated ? tNav('myAccount') : tNav('access')}
        >
          <User size={20} strokeWidth={1.5} aria-hidden />
        </Link>
      )}

      {settings.show_cart && (
        <Link
          href="/carrito"
          data-testid="cart-link"
          className="relative group min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          aria-label={tNav('cart')}
          title={tNav('cart')}
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
    <>
      <TextCarousel />
      <header
        className={`tienda-shop-header z-[60] border-b border-border ${headerPosition} ${blurClass} ${
          open ? 'is-menu-open' : ''
        } ${settings.layout === 'centered' ? 'tienda-shop-header--centered' : ''}`}
        style={{
          top: settings.sticky ? 'var(--carousel-h, 0px)' : undefined,
        }}
      >
      <div
        className={`max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 flex items-center justify-between gap-3 ${
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
                  {mobileItems.map((item) => {
                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const isExpanded = expandedSection === item.href;
                    return (
                      <div key={item.href + item.label} className="w-full shrink-0">
                        <div className="flex items-center justify-between">
                          <Link
                            href={item.href}
                            className={`flex flex-1 min-h-11 items-center font-light transition-colors ${
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
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => setExpandedSection(isExpanded ? null : item.href)}
                              aria-label={`Expandir ${resolveNavLabel(item, locale)}`}
                              className="p-2 text-muted-foreground hover:text-accent transition-colors"
                            >
                              <ChevronDown
                                size={22}
                                className={`transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-accent' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        {hasChildren && isExpanded && item.children && (
                          <div className="pl-3 mt-2 space-y-2 border-l border-border/60 animate-in fade-in duration-200">
                            {item.children.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeMenu}
                                className="block py-1.5 text-muted-foreground hover:text-accent transition-colors"
                              >
                                <div className="text-sm font-medium text-foreground">
                                  {resolveNavLabel(sub, locale)}
                                </div>
                                {sub.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {resolveNavDescription(sub, locale)}
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                      href={isAuthenticated ? '/perfil' : loginTarget}
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
    </>
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const isParentActive =
    isActiveNavHref(pathname, item.href) ||
    Boolean(item.children?.some((child) => isActiveNavHref(pathname, child.href)));

  const handleMouseEnter = () => {
    if (!hasChildren) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hasChildren) return;
    closeTimerRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const fontClass = settings.nav_font === 'display' ? 'font-display' : 'font-sans';
  const textClass = isParentActive ? 'text-accent-text' : 'text-muted-foreground';

  return (
    <div
      className="relative flex items-center shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        className={`inline-flex items-center gap-1 min-h-[44px] whitespace-nowrap transition-colors hover:text-accent py-1 px-1 ${fontClass} ${textClass}`}
        style={{
          fontSize: 'var(--tienda-nav-size, 0.65rem)',
          letterSpacing: 'var(--tienda-nav-tracking, 0.18em)',
          textTransform: settings.nav_text_transform,
          fontFamily: 'var(--tienda-nav-font, var(--font-sans, Inter, system-ui, sans-serif))',
        }}
        aria-expanded={hasChildren ? dropdownOpen : undefined}
        aria-haspopup={hasChildren ? 'true' : undefined}
      >
        <span>{resolveNavLabel(item, locale)}</span>
        {hasChildren && (
          <ChevronDown
            size={11}
            className={`transition-transform duration-200 opacity-60 ${
              dropdownOpen ? 'rotate-180 text-accent' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </Link>

      {hasChildren && dropdownOpen && item.children && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
        >
          <div className="min-w-[280px] max-w-[340px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-2.5 shadow-2xl space-y-1">
            {item.children.map((sub) => {
              const isChildActive = isActiveNavHref(pathname, sub.href);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  role="menuitem"
                  className={`block p-2.5 rounded-xl transition-colors group/sub ${
                    isChildActive
                      ? 'bg-surface-raised text-accent-text'
                      : 'hover:bg-surface-raised/80 text-foreground'
                  }`}
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold group-hover/sub:text-accent transition-colors">
                      {resolveNavLabel(sub, locale)}
                    </span>
                    {sub.badge && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent-text border border-accent/20">
                        {sub.badge}
                      </span>
                    )}
                  </div>
                  {sub.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {resolveNavDescription(sub, locale)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
