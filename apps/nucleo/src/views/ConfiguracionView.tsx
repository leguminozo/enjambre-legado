'use client';

import { useState } from 'react';
import { Settings, Moon, Sun, Monitor, User, Bell, Database } from 'lucide-react';
import { useTheme, type Theme } from '@enjambre/ui';

export default function ConfiguracionView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [sync, setSync] = useState(true);

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="hero-banner">
        <h1 className="hero-title">Configuración</h1>
        <p className="hero-subtitle">Personaliza tu experiencia en Nucleo</p>
      </div>

      <div className="max-w-2xl space-y-8">
        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            {resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            <h3 className="text-sm font-bold uppercase tracking-widest">Apariencia</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === t.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-secondary hover:border-accent/50'
                }`}
              >
                {t.icon}
                <span className="text-xs uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Bell size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Notificaciones</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="text-sm font-medium">Notificaciones push</p>
              <p className="text-xs text-muted-foreground">Recibe alertas en tiempo real</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-foreground transition-transform ${
                  notifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Database size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Datos</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="text-sm font-medium">Sincronización automática</p>
              <p className="text-xs text-muted-foreground">Sincronizar datos en segundo plano</p>
            </div>
            <button
              onClick={() => setSync(!sync)}
              className={`w-12 h-6 rounded-full transition-colors ${
                sync ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-foreground transition-transform ${
                  sync ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
