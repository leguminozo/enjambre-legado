'use client';

import React, { useState, useTransition } from 'react';
import { Bell, Mail, Smartphone, Radio, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import {
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '@enjambre/auth/notification-preferences';
import { useWebPush } from '@enjambre/auth';
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
    description: 'Alertas sobre el estado de tu colmena y ventanas de recolección',
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
      className={`relative inline-flex h-11 min-h-[44px] w-[52px] shrink-0 items-center rounded-full px-1 transition-colors ${
        enabled ? 'bg-accent' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
          enabled ? 'translate-x-[1.125rem]' : 'translate-x-0'
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

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = useWebPush({ appSource: 'tienda' });

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
        const message = friendlyError(error, 'No se pudieron guardar las preferencias');
        toast(message, { type: 'error', duration: 6000 });
      }
    });
  };

  return (
    <section id="notificaciones" className="space-y-8 border-t border-border pt-12 scroll-mt-24 relative">
      <span id="canales" className="absolute -top-24" aria-hidden="true" />
      <div className="flex items-center gap-3 text-accent-text">
        <Bell size={18} />
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">
          Comunicaciones del Bosque
        </h3>
      </div>

      {/* Notificaciones Web Push Directas */}
      <div className="p-6 bg-card border border-border/80 rounded-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-primary animate-pulse" />
              <p className="text-sm font-medium text-foreground">
                Avisos Inmediatos en este Navegador
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recibe alertas directas sobre floraciones nativas, despachos de pedidos y convocatorias exclusivas en tu pantalla.
            </p>
          </div>
          {isPushSupported && (
            <div className="shrink-0">
              {isPushSubscribed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  Vinculado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium bg-muted text-muted-foreground border border-border">
                  Inactivo
                </span>
              )}
            </div>
          )}
        </div>

        {!isPushSupported ? (
          <p className="text-xs text-muted-foreground italic">
            Este navegador no admite notificaciones push en segundo plano.
          </p>
        ) : pushPermission === 'denied' ? (
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <XCircle size={14} />
            Los permisos fueron bloqueados en este navegador. Habilítalos desde los ajustes de tu navegador para recibir avisos.
          </p>
        ) : (
          <div className="pt-2">
            {isPushSubscribed ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await unsubscribePush();
                  if (ok) toast('Notificaciones desactivadas para este equipo.', { type: 'success' });
                }}
                disabled={isPushLoading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isPushLoading && <Loader2 size={13} className="animate-spin" />}
                Desvincular este dispositivo
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const ok = await subscribePush(['general', 'floracion', 'pedidos']);
                  if (ok) {
                    toast('Dispositivo vinculado exitosamente para avisos inmediatos.', { type: 'success' });
                  } else {
                    toast('No se pudo activar el servicio de avisos.', { type: 'error' });
                  }
                }}
                disabled={isPushLoading}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
              >
                {isPushLoading && <Loader2 size={13} className="animate-spin" />}
                Activar avisos en este equipo
              </button>
            )}
          </div>
        )}
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
        className="px-8 py-3.5 bg-primary text-primary-foreground text-xs uppercase tracking-[0.18em] font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm disabled:opacity-60 inline-flex items-center gap-2"
      >
        {isPending ? 'Guardando…' : 'Guardar preferencias de avisos'}
      </button>
    </section>
  );
}