/**
 * Consentimiento de cookies (Ley 19.628 / 21.719).
 * Cookie única: `preference-consent` — JSON v1 { essential, analytics, marketing }.
 * Regla estricta: sin cookie (o sin marketing) NO se carga pixel ni se envían
 * eventos CAPI. Funciones puras, sin dependencias de DOM/Next → testeables.
 */

export const CONSENT_COOKIE_NAME = 'preference-consent';
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año
export const CONSENT_VERSION = 1;

export type ConsentCategories = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentState = ConsentCategories & {
  version: number;
  updatedAt: string;
};

export function consentForAll(): ConsentCategories {
  return { essential: true, analytics: true, marketing: true };
}

export function consentEssentialOnly(): ConsentCategories {
  return { essential: true, analytics: false, marketing: false };
}

/** Solo categorías aceptadas por el usuario (version/updatedAt los agrega el serializador). */
export function parseConsentCookie(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    // Version mismatch → cookie obsoleta: no se migra, se pide de nuevo.
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      essential: parsed.essential !== false,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      version: CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

/** true solo si el usuario aceptó explícitamente marketing (tracking de ads). */
export function isMarketingConsented(state: ConsentState | null | undefined): boolean {
  return Boolean(state?.marketing);
}

/** Serializa a formato cookie (client-only: usa document.cookie al aplicar). */
export function serializeConsentCookie(categories: ConsentCategories): string {
  const state: ConsentState = {
    essential: categories.essential,
    analytics: categories.analytics,
    marketing: categories.marketing,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const value = encodeURIComponent(JSON.stringify(state));
  return `${CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Lee un estado de consentimiento desde el valor crudo de la cookie (server o client). */
export function readConsentFromCookieValue(value: string | null | undefined): ConsentState | null {
  if (!value) return null;
  return parseConsentCookie(decodeCookieValue(value));
}

/** Lee la cookie `preference-consent` desde document.cookie (client-only). */
export function readConsentFromDocumentCookie(docCookie: string): ConsentState | null {
  if (!docCookie) return null;
  const pair = docCookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!pair) return null;
  return readConsentFromCookieValue(pair.slice(CONSENT_COOKIE_NAME.length + 1));
}

/** Extrae la cookie desde un header `Cookie` crudo (server, unit-test-friendly). */
export function readConsentFromCookieHeader(header: string | null | undefined): ConsentState | null {
  if (!header) return null;
  const pair = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!pair) return null;
  return readConsentFromCookieValue(pair.slice(CONSENT_COOKIE_NAME.length + 1));
}
