'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { Theme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}