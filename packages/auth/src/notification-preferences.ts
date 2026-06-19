export type NotificationCategory = 'pedidos' | 'floracion' | 'sistema';
export type NotificationChannel = 'in_app' | 'email';

export type NotificationChannelPrefs = Record<NotificationChannel, boolean>;

export type NotificationPreferences = Record<NotificationCategory, NotificationChannelPrefs>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pedidos: { in_app: true, email: true },
  floracion: { in_app: true, email: true },
  sistema: { in_app: true, email: true },
};

const CATEGORIES: NotificationCategory[] = ['pedidos', 'floracion', 'sistema'];
const CHANNELS: NotificationChannel[] = ['in_app', 'email'];

export function sourceToNotificationCategory(source: string): NotificationCategory {
  if (source === 'checkout_paid' || source === 'shipment_dispatched') return 'pedidos';
  if (source === 'floracion' || source === 'floracion_alert') return 'floracion';
  return 'sistema';
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