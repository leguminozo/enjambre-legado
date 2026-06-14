'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

  const checkThreshold = useCallback(() => {
    if (!nextThreshold || firedRef.current) return;

    const pct = todayRevenue / nextThreshold.threshold;
    if (pct >= triggerAt && pct < 1) {
      firedRef.current = true;
      const notif = {
        id: `threshold-${Date.now()}`,
        message: pct >= 0.95 ? '¡Casi cruzas el umbral!' : 'Acercándote al próximo multiplicador',
        multiplier: nextThreshold.multiplier,
        current: todayRevenue,
        threshold: nextThreshold.threshold,
        percentage: Math.round(pct * 100),
        dismissed: false,
      };
      setNotification(notif);

      // TODO (profundidad entrega): entrelazar creando notification_event central (usar cliente supabase de campo + @ts-expect-error por tipos generados). Por ahora banner local + nota para nucleo/tienda.
      // const supabase = createClient();
      // supabase.from('notification_events').insert({...}).catch(() => {});
    } else if (pct >= 1) {
      firedRef.current = true;
      const notif = {
        id: `threshold-crossed-${Date.now()}`,
        message: '¡Umbral cruzado! Multiplicador activado',
        multiplier: nextThreshold.multiplier,
        current: todayRevenue,
        threshold: nextThreshold.threshold,
        percentage: 100,
        dismissed: false,
      };
      setNotification(notif);

      // TODO (profundidad entrega): entrelazar creando notification_event central (usar cliente supabase de campo + @ts-expect-error por tipos generados). Por ahora banner local + nota para nucleo/tienda.
      // const supabase = createClient();
      // supabase.from('notification_events').insert({...}).catch(() => {});
    }
  }, [todayRevenue, nextThreshold, triggerAt]);

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
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 ${
      isCrossed ? 'bg-gradient-to-r from-warning/90 to-warning/90' : 'bg-gradient-to-r from-primary/90 to-primary/80'
    } rounded-xl p-4 shadow-2xl backdrop-blur-sm`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{isCrossed ? '🔥' : '⚡'}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary-foreground">{notification.message}</p>
          <p className="text-[10px] text-primary-foreground/70 mt-1">
            ×{notification.multiplier.toFixed(1)} multiplicador · ${notification.current.toLocaleString('es-CL')} / ${notification.threshold.toLocaleString('es-CL')}
          </p>
          {!isCrossed && (
            <div className="mt-2 h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary-foreground/50 rounded-full transition-all duration-500" style={{ width: `${notification.percentage}%` }} />
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="text-primary-foreground/60 hover:text-primary-foreground text-lg leading-none">×</button>
      </div>
    </div>
  );
}
