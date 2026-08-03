import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { mapInAppNotificationToAlertItem } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';

interface AlertItem {
  id?: string | number;
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
}

/** Widget "Voz de la Colmena": últimas notificaciones in_app creadas por el usuario. */
export function WidgetVozColmena() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data } = await supabase
        .from('notification_events')
        .select('*')
        .eq('created_by', user.id)
        .eq('channel', 'in_app')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!cancelled) setAlerts((data ?? []).map(mapInAppNotificationToAlertItem));
    }

    void cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="card card-accent animate-in delay-3">
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} style={{ color: 'hsl(var(--warning))' }} /> Voz de la Colmena
      </div>
      <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' }}>
        {alerts.map((a, i) => (
          <p key={a.id || i} style={{ marginBottom: i < alerts.length - 1 ? 'var(--space-md)' : 0 }}>
            <strong style={{ color: a.severity === 'critical' ? 'hsl(var(--destructive))' : a.severity === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
              {a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '⚠' : '✨'} {a.title}:
            </strong> {a.message}
          </p>
        ))}
      </div>
    </div>
  );
}
