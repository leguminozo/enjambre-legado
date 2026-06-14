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

const AUTH_ERROR_MAP: Record<string, string> = {
  // Common Supabase Auth messages / codes surfaced in error
  email_exists: 'Ya existe una cuenta con este correo. Inicia sesión o usa "Olvidé mi contraseña".',
  user_already_exists: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  'email address has already been registered': 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  weak_password: 'La contraseña es demasiado débil. Usa al menos 6 caracteres con letras y números.',
  'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  invalid_credentials: 'Correo o contraseña incorrectos. Verifica tus datos.',
  'invalid login credentials': 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo electrónico antes de iniciar sesión (revisa tu bandeja).',
  'email not confirmed': 'Por favor confirma tu cuenta desde el enlace enviado a tu correo.',
  signup_disabled: 'El registro está temporalmente deshabilitado. Intenta más tarde.',
  over_email_send_rate_limit: 'Demasiados correos enviados. Espera unos minutos e intenta de nuevo.',
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

  const msg = (error.message || '').toLowerCase().trim();

  // Auth specific (Supabase signUp / signIn common messages)
  for (const [key, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return AUTH_ERROR_MAP.email_exists;
  }
  if (msg.includes('weak') || msg.includes('password')) {
    return AUTH_ERROR_MAP.weak_password;
  }
  if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
    return AUTH_ERROR_MAP.invalid_credentials;
  }

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
