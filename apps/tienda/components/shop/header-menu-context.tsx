'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  type HeaderMenuConfig,
  type HeaderMenuSettings,
  type HeaderNavItem,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HEADER_NAV,
  headerSettingsToCssVars,
} from '@/lib/shop/header-menu';

const HeaderMenuContext = createContext<HeaderMenuConfig>({
  settings: DEFAULT_HEADER_SETTINGS,
  items: DEFAULT_HEADER_NAV,
});

export function HeaderMenuProvider({
  settings,
  items,
  children,
}: {
  settings?: HeaderMenuSettings | null;
  items?: HeaderNavItem[] | null;
  children: React.ReactNode;
}) {
  const value = useMemo<HeaderMenuConfig>(
    () => ({
      settings: settings ?? DEFAULT_HEADER_SETTINGS,
      items: items && items.length > 0 ? items : DEFAULT_HEADER_NAV,
    }),
    [settings, items],
  );

  // Apply CSS vars on :root so portaled burger panel inherits them
  useEffect(() => {
    const vars = headerSettingsToCssVars(value.settings);
    const root = document.documentElement;
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }
    root.style.setProperty(
      '--tienda-nav-font',
      value.settings.nav_font === 'display'
        ? 'var(--font-display, "Cormorant Garamond", serif)'
        : 'var(--font-sans, Inter, system-ui, sans-serif)',
    );
    return () => {
      for (const key of Object.keys(vars)) {
        root.style.removeProperty(key);
      }
      root.style.removeProperty('--tienda-nav-font');
    };
  }, [value.settings]);

  return <HeaderMenuContext.Provider value={value}>{children}</HeaderMenuContext.Provider>;
}

export function useHeaderMenu(): HeaderMenuConfig {
  return useContext(HeaderMenuContext);
}
