'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, ShoppingBag, QrCode, User, Grid3X3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/components/providers/auth-context';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';
import { normalizeStorePath } from '@/lib/shop/store-routes';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import {
  resolveLocalized,
  type PwaNavIcon,
  type PwaNavItem,
} from '@/lib/shop/store-chrome';

const BOTTOM_NAV_ICONS: Record<PwaNavIcon, LucideIcon> = {
  home: Home,
  store: Grid3X3,
  scan: QrCode,
  legacy: User,
  bag: ShoppingBag,
};

const DRAG_THRESHOLD_PX = 12;

function matchTab(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function triggerNavHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8);
  }
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const isPwa = usePwaStandalone();
  const { pwaNav, pwaNavItems } = useStoreChrome();
  const tabs = pwaNavItems;
  const tabCount = Math.max(tabs.length, 1);
  const normalized = normalizeStorePath(pathname || '/');
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragState = useRef<{ active: boolean; startX: number; pointerId: number | null }>({
    active: false,
    startX: 0,
    pointerId: null,
  });

  const activeIndex = useMemo(
    () => tabs.findIndex((tab) => matchTab(normalized, tab.href)),
    [normalized, tabs],
  );

  const indicatorIndex = dragIndex ?? (activeIndex === -1 ? null : activeIndex);

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const sectionWidth = rect.width / tabCount;
      const relativeX = clientX - rect.left;
      const rawIndex = Math.floor(relativeX / sectionWidth);
      return Math.max(0, Math.min(tabCount - 1, rawIndex));
    },
    [tabCount],
  );

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragState.current = {
      active: false,
      startX: event.clientX,
      pointerId: event.pointerId,
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragState.current.pointerId !== event.pointerId) return;
      const delta = Math.abs(event.clientX - dragState.current.startX);
      if (!dragState.current.active && delta < DRAG_THRESHOLD_PX) return;
      if (!dragState.current.active) {
        dragState.current.active = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setDragIndex(indexFromClientX(event.clientX));
    },
    [indexFromClientX],
  );

  const resolveHref = useCallback(
    (tab: PwaNavItem) =>
      tab.href === '/perfil' && !isAuthenticated ? '/login' : tab.href,
    [isAuthenticated],
  );

  const finishDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragState.current.pointerId !== event.pointerId) return;
      const wasDragging = dragState.current.active;
      const targetIndex = dragIndex;
      dragState.current = { active: false, startX: 0, pointerId: null };
      setDragIndex(null);
      if (wasDragging) {
        event.preventDefault();
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (targetIndex !== null && targetIndex !== activeIndex) {
          const tab = tabs[targetIndex];
          if (!tab) return;
          triggerNavHaptic();
          router.push(resolveHref(tab));
        }
      }
    },
    [activeIndex, dragIndex, resolveHref, router, tabs],
  );

  const handlePointerCancel = useCallback(() => {
    dragState.current = { active: false, startX: 0, pointerId: null };
    setDragIndex(null);
  }, []);

  const hideOnCheckout =
    normalized.startsWith('/checkout') || normalized.startsWith('/perfil/reposicion/resultado');

  useEffect(() => {
    if (!isPwa || !pwaNav.enabled) return;
    for (const tab of tabs) {
      router.prefetch(resolveHref(tab));
    }
  }, [isPwa, pwaNav.enabled, resolveHref, router, tabs]);

  if (!isPwa || !pwaNav.enabled || hideOnCheckout || tabs.length === 0) return null;

  return (
    <nav
      className="tienda-bottom-nav lg:hidden"
      aria-label="Navegación principal"
      style={
        {
          '--liquid-nav-index': indicatorIndex ?? 0,
          '--liquid-nav-count': tabCount,
        } as React.CSSProperties
      }
      data-has-active={indicatorIndex !== null ? 'true' : 'false'}
      data-is-dragging={dragIndex !== null ? 'true' : 'false'}
    >
      <div
        ref={trackRef}
        className="tienda-bottom-nav-glass"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={handlePointerCancel}
      >
        <div className="tienda-bottom-nav-track">
          <div className="tienda-bottom-nav-indicator" aria-hidden="true">
            <div className="tienda-bottom-nav-splotch" />
          </div>

          {tabs.map((tab, index) => {
            const href = resolveHref(tab);
            const isActive = activeIndex === index;
            const Icon = BOTTOM_NAV_ICONS[tab.icon] ?? Home;
            const label = resolveLocalized(tab.label, tab.label_en, locale);

            return (
              <Link
                key={tab.href + tab.label}
                href={href}
                prefetch
                className={`tienda-bottom-nav-item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => triggerNavHaptic()}
              >
                <span className="tienda-bottom-nav-icon-wrap">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                  {isActive ? <span className="tienda-bottom-nav-dot" aria-hidden /> : null}
                </span>
                <span className="tienda-bottom-nav-label">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
