'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Home, ShoppingBag, QrCode, User, Grid3X3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/providers/auth-context';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';
import { normalizeStorePath, PWA_BOTTOM_NAV, type BottomNavKey } from '@/lib/shop/store-routes';

const BOTTOM_NAV_ICONS: Record<BottomNavKey, LucideIcon> = {
  home: Home,
  store: Grid3X3,
  scan: QrCode,
  legacy: User,
  bag: ShoppingBag,
};

const TAB_COUNT = PWA_BOTTOM_NAV.length;
const DRAG_THRESHOLD_PX = 12;

function triggerNavHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8);
  }
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isPwa = usePwaStandalone();
  const tNav = useTranslations('nav');
  const normalized = normalizeStorePath(pathname || '/');
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragState = useRef<{ active: boolean; startX: number; pointerId: number | null }>({
    active: false,
    startX: 0,
    pointerId: null,
  });

  const activeIndex = useMemo(
    () => PWA_BOTTOM_NAV.findIndex((tab) => tab.match(normalized)),
    [normalized],
  );

  const indicatorIndex = dragIndex ?? (activeIndex === -1 ? null : activeIndex);

  const indexFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;

    const rect = track.getBoundingClientRect();
    const sectionWidth = rect.width / TAB_COUNT;
    const relativeX = clientX - rect.left;
    const rawIndex = Math.floor(relativeX / sectionWidth);
    return Math.max(0, Math.min(TAB_COUNT - 1, rawIndex));
  }, []);

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
          const tab = PWA_BOTTOM_NAV[targetIndex];
          const href = tab.href === '/perfil' && !isAuthenticated ? '/login' : tab.href;
          triggerNavHaptic();
          router.push(href);
        }
      }
    },
    [activeIndex, dragIndex, isAuthenticated, router],
  );

  const handlePointerCancel = useCallback(() => {
    dragState.current = { active: false, startX: 0, pointerId: null };
    setDragIndex(null);
  }, []);

  const hideOnCheckout =
    normalized.startsWith('/checkout') || normalized.startsWith('/perfil/reposicion/resultado');

  if (!isPwa || hideOnCheckout) return null;

  return (
    <nav
      className="tienda-bottom-nav lg:hidden"
      aria-label={tNav('main')}
      style={
        {
          '--liquid-nav-index': indicatorIndex ?? 0,
          '--liquid-nav-count': TAB_COUNT,
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

          {PWA_BOTTOM_NAV.map((tab, index) => {
            const href = tab.href === '/perfil' && !isAuthenticated ? '/login' : tab.href;
            const isActive = activeIndex === index;
            const Icon = BOTTOM_NAV_ICONS[tab.labelKey];

            return (
              <Link
                key={tab.href}
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
                <span className="tienda-bottom-nav-label">{tNav(tab.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}