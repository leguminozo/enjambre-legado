'use client';

import React, { useState, useTransition } from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from '@enjambre/ui';
import {
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '@enjambre/auth/notification-preferences';
import { updateNotificationPreferences } from '@/app/actions/notification-preferences';

type CategoryConfig = {
  key: NotificationCategory;
  title: string;
  description: string;
};

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'pedidos',
    title: 'Pedidos y despachos',
    description: 'Confirmación de compra, seguimiento y envíos en camino',
  },
  {
    key: 'floracion',
    title: 'Avisos de floración',
    description: 'Alertas sobre el estado de tu colmena y ventanas de cosecha',
  },
  {
    key: 'sistema',
    title: 'Cuenta y bienvenida',
    description: 'Mensajes de cuenta, acceso y novedades del ecosistema',
  },
];

function PreferenceToggle({
  enabled,
  disabled,
  onChange,
  label,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`w-10 h-5 rounded-full relative transition-colors ${
        enabled ? 'bg-accent' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div
        className={`absolute top-1 w-3 h-3 bg-foreground rounded-full transition-all ${
          enabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}

export function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();

  const setChannel = (
    category: NotificationCategory,
    channel: NotificationChannel,
    value: boolean,
  ) => {
    setPreferences((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [channel]: value,
      },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const saved = await updateNotificationPreferences(preferences);
        setPreferences(saved);
        toast('Preferencias de notificación guardadas.', { type: 'success', duration: 5000 });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudieron guardar las preferencias';
        toast(message, { type: 'error', duration: 6000 });
      }
    });
  };

  return (
    <section id="notificaciones" className="space-y-8 border-t border-border pt-12">
      <div className="flex items-center gap-3 text-accent">
        <Bell size={18} />
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">
          Comunicaciones del Bosque
        </h3>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <div
            key={category.key}
            className="p-6 bg-secondary/50 border border-border rounded-2xl space-y-5"
          >
            <div>
              <p className="text-sm text-foreground mb-1">{category.title}</p>
              <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">
                {category.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone size={14} />
                  <span className="text-[0.65rem] uppercase tracking-widest">En la app</span>
                </div>
                <PreferenceToggle
                  enabled={preferences[category.key].in_app}
                  disabled={isPending}
                  onChange={(value) => setChannel(category.key, 'in_app', value)}
                  label={`${category.title} en la app`}
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} />
                  <span className="text-[0.65rem] uppercase tracking-widest">Email</span>
                </div>
                <PreferenceToggle
                  enabled={preferences[category.key].email}
                  disabled={isPending}
                  onChange={(value) => setChannel(category.key, 'email', value)}
                  label={`${category.title} por email`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="px-10 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all disabled:opacity-60"
      >
        {isPending ? 'Guardando…' : 'Guardar Cambios'}
      </button>
    </section>
  );
}