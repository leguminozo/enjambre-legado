'use client';

import { useTheme as useNextTheme } from 'next-themes';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme: (theme as Theme) || 'system',
    resolvedTheme: (resolvedTheme as 'light' | 'dark') || 'dark',
    setTheme,
  };
}
