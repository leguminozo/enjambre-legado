'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@enjambre/ui';
import { updateProfileThemePreference } from '@/app/actions/profile';

interface AjustesThemeSectionProps {
  initialTheme?: Theme;
}

export function AjustesThemeSection({ initialTheme }: AjustesThemeSectionProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    if (initialTheme && initialTheme !== 'system') {
      try {
        const local = localStorage.getItem('enjambre-theme');
        if (!local) {
          setTheme(initialTheme);
        }
      } catch {
        /* ignore localStorage error */
      }
    }
  }, [initialTheme, setTheme]);

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  const handleSelect = (val: Theme) => {
    setTheme(val);
    startTransition(async () => {
      try {
        await updateProfileThemePreference(val);
      } catch (err) {
        console.error('[AjustesThemeSection] Error saving theme preference:', err);
      }
    });
  };

  const currentTheme = mounted ? theme : initialTheme ?? 'dark';
  const isLight = mounted ? resolvedTheme === 'light' : initialTheme === 'light';

  return (
    <section className="space-y-8" aria-label="Preferencia de apariencia">
      <div className="flex items-center gap-3 text-accent-text">
        {isLight ? <Sun size={18} /> : <Moon size={18} />}
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Apariencia</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-md" role="radiogroup" aria-label="Modo de apariencia">
        {themes.map((t) => {
          const isSelected = currentTheme === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(t.value)}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                isSelected
                  ? 'border-accent bg-accent/15 text-accent-text shadow-sm ring-1 ring-accent/30 font-medium'
                  : 'border-border bg-secondary/80 hover:bg-secondary hover:border-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="shrink-0">{t.icon}</span>
              <span className="text-[0.65rem] uppercase tracking-wider">{t.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}