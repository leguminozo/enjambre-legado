import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  categoriesForPlatformRole,
  countActiveNotificationCategories,
  emptyStateForPlatformRole,
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

  it('maps territorial sources to territorio', () => {
    expect(sourceToNotificationCategory('alerta_fitosanitaria')).toBe('territorio');
    expect(sourceToNotificationCategory('trashumancia')).toBe('territorio');
  });

  it('hides pedidos from territorial and territorio from cliente', () => {
    expect(categoriesForPlatformRole('territorial')).toEqual([
      'territorio',
      'floracion',
      'sistema',
    ]);
    expect(categoriesForPlatformRole('territorial')).not.toContain('pedidos');
    expect(categoriesForPlatformRole('cliente')).toEqual(['pedidos', 'sistema']);
    expect(categoriesForPlatformRole('cliente')).not.toContain('territorio');
    expect(categoriesForPlatformRole('admin')).toContain('pedidos');
  });

  it('empty state for territorial does not mention pedidos', () => {
    expect(emptyStateForPlatformRole('territorial')).not.toMatch(/pedido/i);
    expect(emptyStateForPlatformRole('cliente')).toMatch(/pedido/i);
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
    expect(countActiveNotificationCategories(prefs)).toBe(3);
  });
});