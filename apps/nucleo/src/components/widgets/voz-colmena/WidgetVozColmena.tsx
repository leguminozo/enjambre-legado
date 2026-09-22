import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import {
  mapInAppNotificationToAlertItem,
  resolveInAppHref,
  assertHrefAllowedForRole,
  useAuthStore,
  type InAppNotificationRow,
} from '@enjambre/auth';
import {
  categoriesForPlatformRole,
  sourceToNotificationCategory,
} from '@enjambre/auth/notification-preferences';
import { supabase } from '@/lib/supabase';

interface AlertItem {
  id?: string | number;
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  href: string;
}

function rowMeta(row: InAppNotificationRow): { category: string; source: string; entity: string } {
  const meta = (row.provider_response ?? {}) as Record<string, unknown>;
  const source = typeof meta.source === 'string' ? meta.source : '';
  const category =
    typeof meta.category === 'string' && meta.category
      ? meta.category
      : source
        ? sourceToNotificationCategory(source)
        : 'sistema';
  const entity = typeof meta.entity === 'string' ? meta.entity : '';
  return { category, source, entity };
}

/** Widget "Voz de la Colmena": misma fuente que la campanita, mismo filtro por rol, mismo destino. */
export function WidgetVozColmena() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const platformRole = useAuthStore((s) => s.user?.role ?? null);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data } = await supabase
        .from('notification_events')
        .select('*')
        .eq('channel', 'in_app')
        .or(`recipient_user_id.eq.${user.id},created_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (cancelled) return;
      const allowed = new Set<string>(categoriesForPlatformRole(platformRole));
      const items = ((data ?? []) as InAppNotificationRow[])
        .filter((row) => allowed.has(rowMeta(row).category))
        .slice(0, 3)
        .map((row) => {
          const base = mapInAppNotificationToAlertItem(row);
          const { category, source, entity } = rowMeta(row);
          const href = assertHrefAllowedForRole(
            resolveInAppHref(row.subject, 'nucleo', {
              role: platformRole,
              category,
              source,
              entity,
            }),
            platformRole,
          );
          return { ...base, href };
        });
      if (!cancelled) setAlerts(items);
    }

    void cargar();
    return () => {
      cancelled = true;
    };
  }, [platformRole]);

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
            </strong> {a.message}{' '}
            <Link
              href={a.href}
              className="text-primary underline-offset-2 hover:underline text-xs font-medium"
            >
              Ver detalle
            </Link>
          </p>
        ))}
      </div>
    </div>
  );
}
