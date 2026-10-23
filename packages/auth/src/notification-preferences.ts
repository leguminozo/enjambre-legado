export type NotificationCategory = 'territorio' | 'floracion' | 'pedidos' | 'sistema';
export type NotificationChannel = 'in_app' | 'email';

export type NotificationChannelPrefs = Record<NotificationChannel, boolean>;

export type NotificationPreferences = Record<NotificationCategory, NotificationChannelPrefs>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  territorio: { in_app: true, email: true },
  floracion: { in_app: true, email: true },
  pedidos: { in_app: true, email: true },
  sistema: { in_app: true, email: true },
};

const CATEGORIES: NotificationCategory[] = ['territorio', 'floracion', 'pedidos', 'sistema'];
const _CHANNELS: NotificationChannel[] = ['in_app', 'email'];

const TERRITORIO_SOURCES = new Set([
  'alerta_fitosanitaria',
  'trashumancia',
  'censo',
  'distancia_legal',
  'registro_territorial',
]);

export function sourceToNotificationCategory(source: string): NotificationCategory {
  if (
    source === 'checkout_paid' ||
    source === 'checkout_paid_v2' ||
    source === 'checkout_dte_ready' ||
    source === 'shipment_dispatched'
  ) {
    return 'pedidos';
  }
  if (source === 'floracion' || source === 'floracion_alert') return 'floracion';
  if (TERRITORIO_SOURCES.has(source)) return 'territorio';
  return 'sistema';
}

/** Qué cajones ve cada RoleKey. Una cola; distintos destinos. */
export function categoriesForPlatformRole(role: string | null | undefined): NotificationCategory[] {
  switch (role) {
    case 'territorial':
      return ['territorio', 'floracion', 'sistema'];
    case 'apicultor':
      return ['floracion', 'sistema'];
    case 'cliente':
    case 'creador':
      return ['pedidos', 'sistema'];
    case 'rep_ventas':
      return ['pedidos', 'sistema'];
    case 'operador':
    case 'colaborador':
      return ['pedidos', 'sistema'];
    case 'admin':
      return ['territorio', 'floracion', 'pedidos', 'sistema'];
    default:
      return ['sistema'];
  }
}

export function emptyStateForPlatformRole(role: string | null | undefined): string {
  switch (role) {
    case 'territorial':
      return 'Alertas del territorio, floración y avisos de la red aparecerán aquí.';
    case 'apicultor':
      return 'Avisos de patio, floración y sistema aparecerán aquí.';
    case 'cliente':
    case 'creador':
      return 'El estado de tus pedidos y avisos de cuenta aparecerán aquí.';
    case 'admin':
      return 'Operaciones, stock, CAF y avisos del sistema aparecerán aquí.';
    case 'operador':
    case 'colaborador':
      return 'Stock, envíos y avisos operativos aparecerán aquí.';
    case 'rep_ventas':
      return 'Tus ventas, comisiones y avisos operativos aparecerán aquí.';
    default:
      return 'Los avisos de tu cuenta aparecerán aquí.';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readChannelPrefs(value: unknown, fallback: NotificationChannelPrefs): NotificationChannelPrefs {
  if (!isRecord(value)) return { ...fallback };
  return {
    in_app: typeof value.in_app === 'boolean' ? value.in_app : fallback.in_app,
    email: typeof value.email === 'boolean' ? value.email : fallback.email,
  };
}

export function parseNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!isRecord(raw)) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

  const parsed = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const category of CATEGORIES) {
    parsed[category] = readChannelPrefs(raw[category], DEFAULT_NOTIFICATION_PREFERENCES[category]);
  }
  return parsed;
}

export function mergeNotificationPreferences(
  current: NotificationPreferences,
  patch: Partial<Record<NotificationCategory, Partial<NotificationChannelPrefs>>>,
): NotificationPreferences {
  const next = { ...current };
  for (const category of CATEGORIES) {
    const categoryPatch = patch[category];
    if (!categoryPatch) continue;
    next[category] = {
      in_app:
        typeof categoryPatch.in_app === 'boolean'
          ? categoryPatch.in_app
          : next[category].in_app,
      email:
        typeof categoryPatch.email === 'boolean'
          ? categoryPatch.email
          : next[category].email,
    };
  }
  return next;
}

export function shouldSendNotification(
  prefs: NotificationPreferences,
  category: NotificationCategory,
  channel: NotificationChannel,
): boolean {
  return prefs[category][channel];
}

export function countActiveNotificationCategories(prefs: NotificationPreferences): number {
  return CATEGORIES.filter(
    (category) => prefs[category].in_app || prefs[category].email,
  ).length;
}

export function serializeNotificationPreferences(prefs: NotificationPreferences): NotificationPreferences {
  const serialized = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const category of CATEGORIES) {
    serialized[category] = {
      in_app: Boolean(prefs[category]?.in_app),
      email: Boolean(prefs[category]?.email),
    };
  }
  return serialized;
}