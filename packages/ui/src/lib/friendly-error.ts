const SUPABASE_ERROR_MAP: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos',
  '23503': 'No se encontró el registro relacionado',
  '23502': 'Falta un dato obligatorio',
  '42501': 'No tienes permisos para esta acción',
  'P0001': 'No se pudo completar la operación',
  'PGRST116': 'No se encontró el registro solicitado',
  '22P02': 'Los datos ingresados no son válidos',
  '42703': 'Error interno de configuración',
  '42P01': 'Error interno de configuración',
};

const FRIENDLY_ERROR_MAP: Record<string, string> = {
  unauthorized: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',
  forbidden: 'No tienes permisos para realizar esta acción',
  not_found: 'No se encontró lo que buscas',
  rate_limit: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo',
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo',
  timeout: 'La solicitud tardó demasiado. Intenta de nuevo',
  internal: 'Ocurrió un problema inesperado. Intenta más tarde',
  unknown: 'Ocurrió un error inesperado',
};

export function friendlySupabaseError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return FRIENDLY_ERROR_MAP.unknown;
  const code = error.code?.trim();
  if (code && SUPABASE_ERROR_MAP[code]) return SUPABASE_ERROR_MAP[code];
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('expired')) return FRIENDLY_ERROR_MAP.unauthorized;
  if (msg.includes('rls') || msg.includes('policy') || msg.includes('permission')) return FRIENDLY_ERROR_MAP.forbidden;
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) return FRIENDLY_ERROR_MAP.network;
  return FRIENDLY_ERROR_MAP.internal;
}

export function friendlyApiError(code: string | undefined, fallback?: string): string {
  if (!code) return fallback || FRIENDLY_ERROR_MAP.unknown;
  return FRIENDLY_ERROR_MAP[code] || fallback || FRIENDLY_ERROR_MAP.unknown;
}

export function friendlyError(err: unknown, fallback?: string): string {
  if (!err) return fallback || FRIENDLY_ERROR_MAP.unknown;
  if (typeof err === 'string') return err;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) return FRIENDLY_ERROR_MAP.network;
    if (msg.includes('timeout')) return FRIENDLY_ERROR_MAP.timeout;
    return fallback || FRIENDLY_ERROR_MAP.internal;
  }
  if (typeof err === 'object' && err !== null) {
    if ('code' in err || 'message' in err) return friendlySupabaseError(err as { code?: string; message?: string });
  }
  return fallback || FRIENDLY_ERROR_MAP.unknown;
}
