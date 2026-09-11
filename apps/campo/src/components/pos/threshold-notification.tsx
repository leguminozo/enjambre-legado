'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCLP } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';

interface ThresholdNotification {
  id: string;
  message: string;
  multiplier: number;
  current: number;
  threshold: number;
  percentage: number;
  dismissed: boolean;
}

export function useThresholdNotification(opts: {
  todayRevenue: number;
  nextThreshold: { threshold: number; multiplier: number } | null;
  triggerAt?: number;
}) {
  const { todayRevenue, nextThreshold, triggerAt = 0.8 } = opts;
  const [notification, setNotification] = useState<ThresholdNotification | null>(null);
  const firedRef = useRef(false);

  const emitCentralNotification = useCallback((notif: ThresholdNotification, isCrossed: boolean) => {
    const user = useAuthStore.getState().user;
    if (!user || !nextThreshold) return;

    void (async () => {
      try {
        const { error } = await supabase
          .from('notification_events')
          .insert({
            channel: 'in_app',
            recipient: user.email ?? user.id,
            recipient_user_id: user.id,
            subject: notif.message,
            body: `Multiplicador ×${nextThreshold.multiplier.toFixed(1)} ${isCrossed ? 'activado' : 'próximo'} (${formatCLP(todayRevenue)} / ${formatCLP(nextThreshold.threshold)})`,
            status: 'sent',
            created_by: user.id,
            provider_response: {
              via: 'pos_threshold',
              percentage: notif.percentage,
              multiplier: nextThreshold.multiplier,
              is_crossed: isCrossed,
            },
          });
        if (error) console.warn('[threshold-notification] central event warning:', error.message);
      } catch (err) {
        console.warn('[threshold-notification] central event error:', err);
      }
    })();
  }, [nextThreshold, todayRevenue]);

  const checkThreshold = useCallback(() => {
    if (!nextThreshold || firedRef.current) return;

    const pct = todayRevenue / nextThreshold.threshold;
    if (pct >= triggerAt && pct < 1) {
      firedRef.current = true;
      const notif: ThresholdNotification = {
        id: `threshold-${Date.now()}`,
        message: pct >= 0.95 ? '¡Casi cruzas el umbral!' : 'Acercándote al próximo multiplicador',
        multiplier: nextThreshold.multiplier,
        current: todayRevenue,
        threshold: nextThreshold.threshold,
        percentage: Math.round(pct * 100),
        dismissed: false,
      };
      setNotification(notif);
      emitCentralNotification(notif, false);
    } else if (pct >= 1) {
      firedRef.current = true;
      const notif: ThresholdNotification = {
        id: `threshold-crossed-${Date.now()}`,
        message: '¡Umbral cruzado! Multiplicador activado',
        multiplier: nextThreshold.multiplier,
        current: todayRevenue,
        threshold: nextThreshold.threshold,
        percentage: 100,
        dismissed: false,
      };
      setNotification(notif);
      emitCentralNotification(notif, true);
    }
  }, [todayRevenue, nextThreshold, triggerAt, emitCentralNotification]);

  useEffect(() => { checkThreshold(); }, [checkThreshold]);

  useEffect(() => {
    if (!nextThreshold) {
      firedRef.current = false;
      setNotification(null);
    }
  }, [nextThreshold]);

  const dismiss = useCallback(() => {
    setNotification(prev => prev ? { ...prev, dismissed: true } : null);
  }, []);

  return { notification, dismiss };
}

export function ThresholdNotificationBanner({ notification, onDismiss }: {
  notification: ThresholdNotification;
  onDismiss: () => void;
}) {
  if (notification.dismissed) return null;

  const isCrossed = notification.percentage >= 100;

  return (
    <div
      className={`fixed left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-45 animate-in slide-in-from-bottom-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] ${
        isCrossed ? 'bg-gradient-to-r from-warning/90 to-warning/90' : 'bg-gradient-to-r from-primary/90 to-primary/80'
      } rounded-xl p-4 shadow-2xl backdrop-blur-sm`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden>
          {isCrossed ? '🔥' : '⚡'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary-foreground">{notification.message}</p>
          <p className="text-[10px] text-primary-foreground/70 mt-1">
            ×{notification.multiplier.toFixed(1)} multiplicador · {formatCLP(notification.current)} / {formatCLP(notification.threshold)}
          </p>
          {!isCrossed && (
            <div className="mt-2 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary-foreground/50 rounded-full transition-all duration-500" style={{ width: `${notification.percentage}%` }} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso de umbral"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
