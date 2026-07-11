'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { Theme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  /** When set, theme is locked (e.g. public store force_dark). */
  forcedTheme?: Theme;
  storageKey?: string;
  /**
   * Allow `system` + prefers-color-scheme.
   * Independent of defaultTheme (nucleo uses default dark but still offers system/light).
   */
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  forcedTheme,
  storageKey = 'enjambre-theme',
  enableSystem = true,
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      enableSystem={Boolean(enableSystem) && !forcedTheme}
      storageKey={storageKey}
      // Avoid flash / #418 class mismatch on <html>
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
