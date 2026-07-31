import { getNucleoApiUrl } from './nucleo-url';

/** URL de la app Núcleo (dashboard), no solo el origin del BFF API. */
export function getNucleoAppUrl(): string | null {
  return getNucleoApiUrl();
}

export function getNucleoStaffEntryPath(): string {
  return '/ejecutivo';
}

export function getNucleoStaffEntryUrl(): string | null {
  const base = getNucleoAppUrl();
  if (!base) return null;
  return `${base}${getNucleoStaffEntryPath()}`;
}

/**
 * Determina si un objetivo de redirección de staff debe resolverse via
 * window.location (full-page) en lugar de router.replace/push.
 *
 * El router de App Router emite un fetch de payload RSC same-origin; una URL
 * absoluta cross-origin (Núcleo en otro dominio) no puede devolver el stream
 * RSC y se rompe con "Failed to fetch RSC payload" → fallback a navegación.
 * Mismo contrato que access.external en store-routes → NextResponse.redirect.
 */
export function isStaffRedirectExternal(url: string | null | undefined): boolean {
  return Boolean(url) && (url!.startsWith('http://') || url!.startsWith('https://'));
}