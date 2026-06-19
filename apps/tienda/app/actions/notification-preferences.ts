'use server'

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  type NotificationCategory,
  type NotificationChannelPrefs,
  type NotificationPreferences,
} from '@enjambre/auth/notification-preferences'
import { createClient } from '@/utils/supabase/server'

export type NotificationPreferencesPatch = Partial<
  Record<NotificationCategory, Partial<NotificationChannelPrefs>>
>

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error('No se pudieron cargar las preferencias de notificación')
  }

  return parseNotificationPreferences(data?.notification_preferences)
}

export async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para guardar preferencias')
  }

  const current = await getNotificationPreferences()
  const next = serializeNotificationPreferences(mergeNotificationPreferences(current, patch))

  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: next })
    .eq('id', user.id)

  if (error) {
    throw new Error('No se pudieron guardar las preferencias de notificación')
  }

  return next
}