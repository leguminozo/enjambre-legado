'use server'

import { createClient } from '@/utils/supabase/server'

export type ProfileIdentity = {
  full_name: string
  email: string
  theme_preference?: 'light' | 'dark' | 'system'
}

export async function getProfileIdentity(): Promise<ProfileIdentity | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, theme_preference')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error('No se pudo cargar tu identidad')
  }

  const rawPref = data?.theme_preference
  const themePref =
    rawPref === 'light' || rawPref === 'dark' || rawPref === 'system' ? rawPref : undefined

  return {
    full_name: data?.full_name?.trim() || '',
    email: data?.email?.trim() || user.email || '',
    theme_preference: themePref,
  }
}

export async function updateProfileThemePreference(
  theme: 'light' | 'dark' | 'system',
): Promise<void> {
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    throw new Error('Tema inválido')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', user.id)

  if (error) {
    console.error('[profile] Error al guardar preferencia de apariencia:', error.message)
  }
}

export async function updateProfileFullName(fullName: string): Promise<ProfileIdentity> {
  const trimmed = fullName.trim()
  if (trimmed.length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }
  if (trimmed.length > 120) {
    throw new Error('El nombre es demasiado largo')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para actualizar tu perfil')
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: trimmed })
    .eq('id', user.id)

  if (profileError) {
    throw new Error('No se pudo guardar el nombre')
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: trimmed },
  })

  if (authError) {
    console.error('[profile] auth metadata update failed:', authError.message)
  }

  const email = user.email || ''
  return { full_name: trimmed, email }
}