'use server';

import { createClient } from '@/utils/supabase/server';

export type ProfileIdentity = {
  full_name: string;
  email: string;
  theme_preference?: 'light' | 'dark' | 'system';
};

export type ProfileCompleteData = {
  // 1. Identidad Personal & Contacto
  full_name: string;
  email: string;
  telefono: string;
  theme_preference?: 'light' | 'dark' | 'system';

  // 2. Despacho Predeterminado
  courier_preferido: string;
  direccion_id?: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigo_postal: string;
  instrucciones: string;

  // 3. Documento Tributario (Boleta o Factura B2B para Empresas/Alianzas)
  tipo_dte: 'boleta' | 'factura';
  rut: string;
  razon_social: string;
  giro: string;
  direccion_tributaria: string;
};

export async function getProfileIdentity(): Promise<ProfileIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, theme_preference')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error('No se pudo cargar tu identidad');
  }

  const rawPref = data?.theme_preference;
  const themePref =
    rawPref === 'light' || rawPref === 'dark' || rawPref === 'system' ? rawPref : undefined;

  return {
    full_name: data?.full_name?.trim() || '',
    email: data?.email?.trim() || user.email || '',
    theme_preference: themePref,
  };
}

export async function getProfileCompleteData(): Promise<ProfileCompleteData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, direccionRes, revendedorRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, telefono, theme_preference, courier_preferido, tipo_dte_preferido')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('cliente_direcciones')
      .select('*')
      .eq('user_id', user.id)
      .order('es_predeterminada', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('revendedor_profile')
      .select('rut, razon_social, tipo_negocio, direccion, region')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const p = profileRes.data;
  const addr = direccionRes.data;
  const rev = revendedorRes.data;

  const rawPref = p?.theme_preference;
  const themePref =
    rawPref === 'light' || rawPref === 'dark' || rawPref === 'system' ? rawPref : undefined;

  const hasB2B = Boolean(rev?.rut || rev?.razon_social);
  const tipoDte: 'boleta' | 'factura' = (p?.tipo_dte_preferido === 'factura' || hasB2B) ? 'factura' : 'boleta';

  return {
    full_name: p?.full_name?.trim() || user.user_metadata?.full_name || '',
    email: p?.email?.trim() || user.email || '',
    telefono: p?.telefono?.trim() || addr?.telefono || user.phone || '',
    theme_preference: themePref,
    courier_preferido: p?.courier_preferido || 'blueexpress',
    direccion_id: addr?.id,
    direccion: addr?.direccion || '',
    comuna: addr?.comuna || '',
    ciudad: addr?.ciudad || '',
    region: addr?.region || '',
    codigo_postal: addr?.codigo_postal || '',
    instrucciones: addr?.instrucciones || '',
    tipo_dte: tipoDte,
    rut: rev?.rut || '',
    razon_social: rev?.razon_social || '',
    giro: rev?.tipo_negocio || '',
    direccion_tributaria: rev?.direccion || addr?.direccion || '',
  };
}

export async function updateProfileThemePreference(
  theme: 'light' | 'dark' | 'system',
): Promise<void> {
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    throw new Error('Tema inválido');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', user.id);

  if (error) {
    console.error('[profile] Error al guardar preferencia de apariencia:', error.message);
  }
}

export async function updateProfileFullName(fullName: string): Promise<ProfileIdentity> {
  const trimmed = fullName.trim();
  if (trimmed.length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres');
  }
  if (trimmed.length > 120) {
    throw new Error('El nombre es demasiado largo');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión para actualizar tu perfil');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: trimmed })
    .eq('id', user.id);

  if (profileError) {
    throw new Error('No se pudo guardar el nombre');
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: trimmed },
  });

  if (authError) {
    console.error('[profile] auth metadata update failed:', authError.message);
  }

  const email = user.email || '';
  return { full_name: trimmed, email };
}

export async function updateProfileCompleteData(
  formData: ProfileCompleteData,
): Promise<ProfileCompleteData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión para guardar tus datos');
  }

  const trimmedName = formData.full_name.trim();
  if (trimmedName.length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres');
  }

  const cleanPhone = formData.telefono.trim();

  // 1. Guardar en profiles
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: trimmedName,
      telefono: cleanPhone || null,
      courier_preferido: formData.courier_preferido || 'blueexpress',
      tipo_dte_preferido: formData.tipo_dte,
    })
    .eq('id', user.id);

  if (profileErr) {
    console.error('[profile] Error actualizando tabla profiles:', profileErr.message);
    throw new Error('No se pudo guardar el perfil');
  }

  // 2. Guardar metadata auth (esperar resultado para no perder sincronía)
  const { error: authMetaError } = await supabase.auth.updateUser({
    data: { full_name: trimmedName, phone: cleanPhone || undefined },
  });
  if (authMetaError) {
    console.error('[profile] auth metadata update failed:', authMetaError.message);
  }

  // 3. Dirección de despacho predeterminada (si viene dirección)
  let savedAddressId = formData.direccion_id;
  if (formData.direccion.trim()) {
    const addressPayload = {
      user_id: user.id,
      nombre: trimmedName,
      telefono: cleanPhone || '+56900000000',
      direccion: formData.direccion.trim(),
      comuna: formData.comuna.trim() || 'Castro',
      ciudad: formData.ciudad.trim() || 'Castro',
      region: formData.region.trim() || 'Los Lagos',
      codigo_postal: formData.codigo_postal.trim() || null,
      instrucciones: formData.instrucciones.trim() || null,
      pais: 'CL',
      es_predeterminada: true,
    };

    if (savedAddressId) {
      const { data: updatedAddr } = await supabase
        .from('cliente_direcciones')
        .update(addressPayload)
        .eq('id', savedAddressId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();
      if (updatedAddr) savedAddressId = updatedAddr.id;
    } else {
      // Verificar si ya tiene alguna
      const { data: existing } = await supabase
        .from('cliente_direcciones')
        .select('id')
        .eq('user_id', user.id)
        .order('es_predeterminada', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cliente_direcciones')
          .update(addressPayload)
          .eq('id', existing.id);
        savedAddressId = existing.id;
      } else {
        const { data: inserted } = await supabase
          .from('cliente_direcciones')
          .insert(addressPayload)
          .select('id')
          .single();
        if (inserted) savedAddressId = inserted.id;
      }
    }
  }

  // 4. Datos de Empresa / Alianzas / Factura B2B
  if (formData.tipo_dte === 'factura' || formData.rut.trim()) {
    const cleanRut = formData.rut.trim();
    const cleanRazon = formData.razon_social.trim() || trimmedName;
    const cleanGiro = formData.giro.trim() || 'Alianza / Comercio Asociado';
    const cleanDirTrib = (formData.direccion_tributaria || formData.direccion).trim();

    if (cleanRut) {
      const { error: revErr } = await supabase.from('revendedor_profile').upsert(
        {
          user_id: user.id,
          rut: cleanRut,
          razon_social: cleanRazon,
          tipo_negocio: cleanGiro,
          direccion: cleanDirTrib,
          region: formData.region || 'Los Lagos',
        },
        { onConflict: 'user_id' },
      );
      if (revErr) {
        console.error('[profile] Error upsert revendedor_profile:', revErr.message);
      }
    }
  }

  return {
    ...formData,
    direccion_id: savedAddressId,
  };
}
