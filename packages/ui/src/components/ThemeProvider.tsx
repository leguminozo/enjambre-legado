'use client';

import React, { useEffect } from 'react';
import { useTheme, Theme } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const ThemeContext = React.createContext<ReturnType<typeof useTheme> | null>(null);

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (defaultTheme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <div className={resolvedTheme === 'light' ? 'light' : 'dark'}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
