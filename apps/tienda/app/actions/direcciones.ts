'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { type ClienteDireccion, type DireccionFormData, direccionSchema } from '@/lib/shop/direcciones-schema';

export async function getDirecciones(): Promise<ClienteDireccion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('cliente_direcciones')
    .select('*')
    .eq('user_id', user.id)
    .order('es_predeterminada', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[direcciones] getDirecciones error:', error);
    return [];
  }

  return data as ClienteDireccion[];
}

export async function createDireccion(formData: DireccionFormData): Promise<ClienteDireccion> {
  const parsed = direccionSchema.parse(formData);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión');
  }

  // Si no tiene direcciones, la primera será predeterminada
  const { count } = await supabase
    .from('cliente_direcciones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isFirst = count === 0;

  const { data, error } = await supabase
    .from('cliente_direcciones')
    .insert({
      ...parsed,
      user_id: user.id,
      es_predeterminada: isFirst,
    })
    .select()
    .single();

  if (error) {
    console.error('[direcciones] createDireccion error:', error);
    throw new Error('No se pudo guardar la dirección');
  }

  return data as ClienteDireccion;
}

export async function updateDireccion(id: string, formData: DireccionFormData): Promise<ClienteDireccion> {
  const parsed = direccionSchema.parse(formData);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Debes iniciar sesión');

  const { data, error } = await supabase
    .from('cliente_direcciones')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[direcciones] updateDireccion error:', error);
    throw new Error('No se pudo actualizar la dirección');
  }

  return data as ClienteDireccion;
}

export async function deleteDireccion(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Debes iniciar sesión');

  const { error } = await supabase
    .from('cliente_direcciones')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[direcciones] deleteDireccion error:', error);
    throw new Error('No se pudo eliminar la dirección');
  }
}

export async function setDefaultDireccion(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Debes iniciar sesión');

  // Primero quitamos el default a todas
  const { error: resetError } = await supabase
    .from('cliente_direcciones')
    .update({ es_predeterminada: false })
    .eq('user_id', user.id);

  if (resetError) {
    throw new Error('No se pudo actualizar la dirección predeterminada');
  }

  // Luego asignamos el default a la elegida
  const { error: setOk } = await supabase
    .from('cliente_direcciones')
    .update({ es_predeterminada: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (setOk) {
    throw new Error('No se pudo actualizar la dirección predeterminada');
  }
}
