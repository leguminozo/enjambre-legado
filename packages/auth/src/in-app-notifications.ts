export type InAppBellNotification = {
  id: string | number;
  title: string;
  message: string;
  time?: string;
  type?: 'default' | 'success' | 'warning' | 'error' | 'gold';
  href?: string;
  read?: boolean;
};

export type InAppNotificationRow = {
  id: string;
  channel: string;
  created_at: string;
  created_by: string | null;
  body: string | null;
  subject: string | null;
  recipient: string | null;
  status: string;
  provider_response: unknown;
};

export type InAppNotificationApp = 'tienda' | 'nucleo';

export type AlertSeverity = 'critical' | 'warning' | 'success';

export function inferNotificationSeverity(
  subject: string | null,
  providerResponse: unknown,
): AlertSeverity {
  const meta = providerResponse as Record<string, unknown> | null;
  const raw = meta?.severity;
  if (raw === 'critical' || raw === 'warning' || raw === 'success') return raw;

  const text = (subject ?? '').toLowerCase();
  if (text.includes('error') || text.includes('fallo') || text.includes('crític')) return 'critical';
  if (text.includes('pedido') || text.includes('despach') || text.includes('stock')) return 'warning';
  return 'success';
}

export function resolveInAppHref(subject: string | null, app: InAppNotificationApp): string {
  const text = (subject ?? '').toLowerCase();

  if (app === 'tienda') {
    if (text.includes('floraci')) return '/perfil/alertas';
    if (text.includes('pedido') || text.includes('despach')) return '/perfil/pedidos';
    return '/perfil/alertas';
  }

  if (text.includes('pedido') || text.includes('despach')) return '/operaciones';
  if (text.includes('colmena') || text.includes('floraci')) return '/colmenas';
  return '/';
}

export function mapInAppNotificationRow(
  row: InAppNotificationRow,
  app: InAppNotificationApp,
): InAppBellNotification {
  return {
    id: row.id,
    title: row.subject || 'Notificación',
    message: row.body || '',
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    type: row.channel === 'in_app' ? 'gold' : 'default',
    href: resolveInAppHref(row.subject, app),
  };
}

export function mapInAppNotificationToAlertItem(row: InAppNotificationRow): {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
} {
  return {
    id: row.id,
    severity: inferNotificationSeverity(row.subject, row.provider_response),
    title: row.subject || 'Notificación',
    message: row.body || '',
  };
}

export const IN_APP_READ_STORAGE_PREFIX = 'oyz-notif-read-';