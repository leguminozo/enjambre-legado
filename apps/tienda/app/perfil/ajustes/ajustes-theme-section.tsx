'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@enjambre/ui';

export function AjustesThemeSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 text-accent">
        {resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Apariencia</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {themes.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              theme === t.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-secondary hover:border-accent/50'
            }`}
          >
            {t.icon}
            <span className="text-[0.6rem] uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}