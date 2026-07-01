'use server'

import { createClient } from '@/utils/supabase/server'

export type ProfileIdentity = {
  full_name: string
  email: string
}

export async function getProfileIdentity(): Promise<ProfileIdentity | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error('No se pudo cargar tu identidad')
  }

  return {
    full_name: data?.full_name?.trim() || '',
    email: data?.email?.trim() || user.email || '',
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