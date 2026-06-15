'use client';

import React from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  size?: number;
  className?: string;
}

const CYCLE: Theme[] = ['light', 'dark', 'system'];

const LABELS: Record<Theme, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
};

export function ThemeToggle({ size = 18, className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];

  const icon =
    !mounted || theme === 'system' ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    ) : theme === 'light' ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    );

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Tema: ${mounted ? LABELS[theme] : LABELS.system}. Cambiar a ${mounted ? LABELS[next] : LABELS.light}`}
      title={`${mounted ? LABELS[theme] : LABELS.system} — clic para ${mounted ? LABELS[next] : LABELS.light}`}
      className={`text-muted-foreground hover:text-accent transition-colors ${className ?? ''}`}
      suppressHydrationWarning
    >
      {icon}
    </button>
  );
}
