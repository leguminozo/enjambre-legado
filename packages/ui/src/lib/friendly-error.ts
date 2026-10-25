/**
 * Mapas canónicos de errores legibles (es-CL).
 * `as const` + lookup con narrowing evita `string | undefined`
 * bajo `noUncheckedIndexedAccess` (TS estricto del package).
 */

const SUPABASE_ERROR_MAP = {
  '23505': 'Ya existe un registro con esos datos',
  '23503': 'No se encontró el registro relacionado',
  '23502': 'Falta un dato obligatorio',
  '42501': 'No tienes permisos para esta acción',
  P0001: 'No se pudo completar la operación',
  PGRST116: 'No se encontró el registro solicitado',
  '22P02': 'Los datos ingresados no son válidos',
  '42703': 'Error interno de configuración',
  '42P01': 'Error interno de configuración',
} as const;

const AUTH_ERROR_MAP = {
  email_exists:
    'Ya existe una cuenta con este correo. Inicia sesión o usa "Olvidé mi contraseña".',
  user_already_exists:
    'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  'email address has already been registered':
    'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  weak_password:
    'La contraseña es demasiado débil. Usa al menos 6 caracteres con letras y números.',
  'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  invalid_credentials: 'Correo o contraseña incorrectos. Verifica tus datos.',
  'invalid login credentials': 'Correo o contraseña incorrectos.',
  email_not_confirmed:
    'Confirma tu correo electrónico antes de iniciar sesión (revisa tu bandeja).',
  'email not confirmed': 'Por favor confirma tu cuenta desde el enlace enviado a tu correo.',
  signup_disabled: 'El registro está temporalmente deshabilitado. Intenta más tarde.',
  over_email_send_rate_limit:
    'Demasiados correos enviados. Espera unos minutos e intenta de nuevo.',
} as const;

import { humanizeTechnicalPhrase } from './narrative-copy';

export { humanizeTechnicalPhrase };

const FRIENDLY_ERROR_MAP = {
  unauthorized: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente',
  forbidden: 'No tienes permisos para realizar esta acción',
  not_found: 'No se encontró lo que buscas',
  rate_limit: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo',
  network: 'Sin conexión. Verifica tu internet e intenta de nuevo',
  timeout: 'La solicitud tardó demasiado. Intenta de nuevo',
  internal: 'Ocurrió un problema inesperado. Intenta más tarde',
  unknown: 'Ocurrió un error inesperado',
  offline: 'Modo sin conexión: la información se guardará localmente',
  pos_no_cash_session: 'Debes abrir una sesión de caja antes de registrar ventas',
  pos_terminal_disconnected: 'El terminal de pago no responde. Verifica la conexión Bluetooth o reintenta',
  stock_insufficient: 'No hay suficiente stock disponible para este producto',
} as const;

type FriendlyCode = keyof typeof FRIENDLY_ERROR_MAP;

function lookupRecord<T extends Record<string, string>>(
  map: T,
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  if (Object.prototype.hasOwnProperty.call(map, key)) {
    return map[key as keyof T];
  }
  return undefined;
}

export function friendlySupabaseError(
  error: { code?: string; message?: string } | null | undefined,
): string {
  if (!error) return FRIENDLY_ERROR_MAP.unknown;

  const byCode = lookupRecord(SUPABASE_ERROR_MAP, error.code?.trim());
  if (byCode) return byCode;

  const msg = (error.message || '').toLowerCase().trim();

  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return SUPABASE_ERROR_MAP['23505'];
  }
  if (msg.includes('foreign key') || msg.includes('violates foreign key constraint')) {
    return SUPABASE_ERROR_MAP['23503'];
  }
  if (msg.includes('not-null') || msg.includes('null value in column')) {
    return SUPABASE_ERROR_MAP['23502'];
  }
  if (msg.includes('invalid input syntax')) {
    return SUPABASE_ERROR_MAP['22P02'];
  }

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

  if (msg.includes('jwt') || msg.includes('token') || msg.includes('expired')) {
    return FRIENDLY_ERROR_MAP.unauthorized;
  }
  if (msg.includes('rls') || msg.includes('policy') || msg.includes('permission')) {
    return FRIENDLY_ERROR_MAP.forbidden;
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return FRIENDLY_ERROR_MAP.network;
  }
  return FRIENDLY_ERROR_MAP.internal;
}

const PAYMENT_ERROR_MESSAGE =
  'No fue posible verificar el pago con la pasarela. Por favor intenta nuevamente o utiliza otro medio de pago.';

const WALLET_ERROR_MESSAGE =
  'La tarjeta digital para tu billetera móvil no está disponible en este momento.';

function isPaymentLeak(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('flow.cl') ||
    lower.includes('getstatus') ||
    lower.includes('no services available') ||
    lower.includes('transbank') ||
    lower.includes('tbk_') ||
    lower.includes('commit_failed') ||
    lower.includes('failed (400)') ||
    lower.includes('failed (500)')
  );
}

function isWalletLeak(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('apple_pass') ||
    lower.includes('google_wallet') ||
    lower.includes('wallet_pass_secret') ||
    lower.includes('.pkpass') ||
    lower.includes('service account listo') ||
    lower.includes('certificados detectados') ||
    lower.includes('save to wallet')
  );
}

function isTechnicalLeak(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    isPaymentLeak(lower) ||
    isWalletLeak(lower) ||
    lower.includes('syntax error') ||
    lower.includes('violates') ||
    lower.includes('constraint') ||
    lower.includes('pgrst') ||
    lower.includes('relation "') ||
    lower.includes('column "') ||
    lower.includes('failed (4') ||
    lower.includes('failed (5') ||
    lower.includes('database error') ||
    lower.includes('typeerror:') ||
    lower.includes('referenceerror:') ||
    lower.includes('cannot read properties of') ||
    lower.includes('null is not an object') ||
    lower.includes('undefined is not an object')
  );
}

export function friendlyApiError(code: string | undefined, fallback?: string): string {
  if (fallback) {
    if (isPaymentLeak(fallback)) return PAYMENT_ERROR_MESSAGE;
    if (isWalletLeak(fallback)) return WALLET_ERROR_MESSAGE;
    if (isTechnicalLeak(fallback)) return FRIENDLY_ERROR_MAP.internal;
  }
  if (!code) return fallback ? humanizeTechnicalPhrase(fallback) : FRIENDLY_ERROR_MAP.unknown;
  const mapped = lookupRecord(FRIENDLY_ERROR_MAP, code);
  return mapped ?? (fallback ? humanizeTechnicalPhrase(fallback) : FRIENDLY_ERROR_MAP.unknown);
}

export function friendlyError(err: unknown, fallback?: string): string {
  if (fallback) {
    if (isPaymentLeak(fallback)) return PAYMENT_ERROR_MESSAGE;
    if (isWalletLeak(fallback)) return WALLET_ERROR_MESSAGE;
  }

  if (!err) {
    if (fallback && isTechnicalLeak(fallback)) return FRIENDLY_ERROR_MAP.internal;
    return fallback ?? FRIENDLY_ERROR_MAP.unknown;
  }

  // Si el fallback provisto contiene jerga técnica o coincide con el error crudo, sanear
  const safeFallback = fallback && !isTechnicalLeak(fallback) ? humanizeTechnicalPhrase(fallback) : undefined;

  if (typeof err === 'string') {
    if (isPaymentLeak(err)) return PAYMENT_ERROR_MESSAGE;
    if (isWalletLeak(err)) return WALLET_ERROR_MESSAGE;
    return friendlySupabaseError({ message: err });
  }

  if (typeof err === 'object' && err !== null) {
    const code = 'code' in err && typeof err.code === 'string' ? err.code : undefined;
    const message = 'message' in err && typeof err.message === 'string' ? err.message : undefined;
    if (code || message) {
      const combined = `${code ?? ''} ${message ?? ''}`;
      if (isPaymentLeak(combined)) return PAYMENT_ERROR_MESSAGE;
      if (isWalletLeak(combined)) return WALLET_ERROR_MESSAGE;
      const mapped = friendlySupabaseError({ code, message });
      if (mapped !== FRIENDLY_ERROR_MAP.internal && mapped !== FRIENDLY_ERROR_MAP.unknown) {
        return mapped;
      }
    }
  }

  if (err instanceof Error) {
    if (isPaymentLeak(err.message)) return PAYMENT_ERROR_MESSAGE;
    if (isWalletLeak(err.message)) return WALLET_ERROR_MESSAGE;
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return FRIENDLY_ERROR_MAP.network;
    }
    if (msg.includes('timeout')) return FRIENDLY_ERROR_MAP.timeout;
    return safeFallback ?? FRIENDLY_ERROR_MAP.internal;
  }

  return safeFallback ?? FRIENDLY_ERROR_MAP.unknown;
}

/** Expuesto para tests / callers que quieran el literal canónico. */
export function friendlyDefault(code: FriendlyCode = 'unknown'): string {
  return FRIENDLY_ERROR_MAP[code];
}
