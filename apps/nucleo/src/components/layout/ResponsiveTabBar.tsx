'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  testId?: string;
}

interface ResponsiveTabBarProps {
  tabs: readonly TabItem[] | TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  layoutId?: string;
  className?: string;
}

export function ResponsiveTabBar({
  tabs,
  activeId,
  onChange,
  variant = 'underline',
  layoutId = 'responsive-tab-indicator',
  className,
}: ResponsiveTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener('scroll', updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollHints);
      ro.disconnect();
    };
  }, [updateScrollHints, tabs.length]);

  useEffect(() => {
    const btn = tabRefs.current.get(activeId);
    const container = scrollRef.current;
    if (!btn || !container) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;
    if (btnLeft < viewLeft + 12) {
      container.scrollTo({ left: btnLeft - 16, behavior: 'smooth' });
    } else if (btnRight > viewRight - 12) {
      container.scrollTo({ left: btnRight - container.clientWidth + 16, behavior: 'smooth' });
    }
  }, [activeId]);

  const isPill = variant === 'pill';

  return (
    <div
      className={cn(
        'responsive-tab-bar',
        isPill ? 'responsive-tab-bar--pill' : 'responsive-tab-bar--underline',
        canScrollLeft && 'has-scroll-left',
        canScrollRight && 'has-scroll-right',
        className,
      )}
    >
      <div ref={scrollRef} className="responsive-tab-bar-scroll" role="tablist">
        <div className="responsive-tab-bar-track">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={tab.testId}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'responsive-tab-bar-item btn-press',
                  isActive && 'is-active',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="responsive-tab-bar-indicator"
                    transition={{ type: 'spring', bounce: 0.12, duration: 0.38 }}
                  />
                )}
                {tab.icon && <span className="responsive-tab-bar-icon">{tab.icon}</span>}
                <span className="responsive-tab-bar-label">{tab.label}</span>
                {tab.badge != null && (
                  <span className="responsive-tab-bar-badge">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}