export * from './supabase'
export * from './auth-store'
export { useAuthProvider, EnjambreAuthProvider, type EnjambreAuthProviderProps } from './auth-provider'
export { SessionVault, type VaultUser, type VaultSessionMeta, type CachedVaultData } from './session-vault'
export {
  ensurePersistentStorage,
  initPwaLifecycleSync,
  broadcastSessionRevoke,
  broadcastSessionUpdate,
  type AuthSyncEvent,
  type PwaLifecycleOptions,
} from './pwa-lifecycle'
export * from './hooks'
export * from './role-redirect'
export * from './security-events'
export { useSecurityAlerts } from './use-security-alerts'
export {
  inferNotificationSeverity,
  mapInAppNotificationRow,
  mapInAppNotificationToAlertItem,
  resolveInAppHref,
  assertHrefAllowedForRole,
  IN_APP_READ_STORAGE_PREFIX,
  type InAppNotificationRow,
  type InAppNotificationApp,
  type InAppBellNotification,
  type AlertSeverity,
} from './in-app-notifications'
export { useInAppNotifications, type UseInAppNotificationsOptions } from './use-in-app-notifications'
export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  categoriesForPlatformRole,
  countActiveNotificationCategories,
  emptyStateForPlatformRole,
  mergeNotificationPreferences,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  shouldSendNotification,
  sourceToNotificationCategory,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationChannelPrefs,
  type NotificationPreferences,
} from './notification-preferences'
export * from './use-web-push'
