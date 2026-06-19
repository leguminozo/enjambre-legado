import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  countActiveNotificationCategories,
  mergeNotificationPreferences,
  parseNotificationPreferences,
  shouldSendNotification,
  sourceToNotificationCategory,
} from './notification-preferences';

describe('notification-preferences', () => {
  it('maps transactional sources to pedidos', () => {
    expect(sourceToNotificationCategory('checkout_paid')).toBe('pedidos');
    expect(sourceToNotificationCategory('shipment_dispatched')).toBe('pedidos');
  });

  it('maps unknown sources to sistema', () => {
    expect(sourceToNotificationCategory('tienda_signup')).toBe('sistema');
  });

  it('parses partial JSONB safely', () => {
    const prefs = parseNotificationPreferences({
      pedidos: { in_app: false },
      floracion: { email: false },
    });
    expect(prefs.pedidos.in_app).toBe(false);
    expect(prefs.pedidos.email).toBe(true);
    expect(prefs.floracion.email).toBe(false);
    expect(prefs.sistema).toEqual(DEFAULT_NOTIFICATION_PREFERENCES.sistema);
  });

  it('merges category patches without dropping other categories', () => {
    const merged = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
      pedidos: { email: false },
    });
    expect(merged.pedidos.email).toBe(false);
    expect(merged.pedidos.in_app).toBe(true);
    expect(merged.floracion).toEqual(DEFAULT_NOTIFICATION_PREFERENCES.floracion);
  });

  it('shouldSendNotification respects channel toggles', () => {
    const prefs = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
      sistema: { in_app: false, email: true },
    });
    expect(shouldSendNotification(prefs, 'sistema', 'in_app')).toBe(false);
    expect(shouldSendNotification(prefs, 'sistema', 'email')).toBe(true);
  });

  it('countActiveNotificationCategories ignores fully disabled categories', () => {
    const prefs = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
      floracion: { in_app: false, email: false },
    });
    expect(countActiveNotificationCategories(prefs)).toBe(2);
  });
});