'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  type StoreChromeConfig,
  DEFAULT_STORE_CHROME,
  themeToCssVars,
  typographyToCssVars,
} from '@/lib/shop/store-chrome';

const StoreChromeContext = createContext<StoreChromeConfig>(DEFAULT_STORE_CHROME);

export function StoreChromeProvider({
  value,
  children,
}: {
  value?: StoreChromeConfig | null;
  children: React.ReactNode;
}) {
  const config = value ?? DEFAULT_STORE_CHROME;

  useEffect(() => {
    const root = document.documentElement;
    const vars = {
      ...themeToCssVars(config.theme),
      ...typographyToCssVars(config.typography),
    };
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }
    if (config.theme.force_dark_public && typeof window !== 'undefined' && !window.location.pathname.startsWith('/perfil')) {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    return () => {
      for (const key of Object.keys(vars)) {
        root.style.removeProperty(key);
      }
    };
  }, [config.theme, config.typography]);

  const memo = useMemo(() => config, [config]);

  return <StoreChromeContext.Provider value={memo}>{children}</StoreChromeContext.Provider>;
}

export function useStoreChrome(): StoreChromeConfig {
  return useContext(StoreChromeContext);
}
