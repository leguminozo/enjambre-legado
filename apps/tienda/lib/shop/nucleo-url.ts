/** URL del BFF nucleo — con fallback canónico a nucleo-theta si falta o apunta a la misma tienda por error en env. */
export const CANONICAL_NUCLEO_URL = 'https://nucleo-theta.vercel.app';

const TIENDA_SELF_ORIGINS = new Set([
  'https://obrerayzangano.com',
  'https://www.obrerayzangano.com',
  'https://obrerayzangano.cl',
  'https://www.obrerayzangano.cl',
  'https://tienda-eta-lime.vercel.app',
]);

function isSelfStoreUrl(url: string): boolean {
  try {
    const origin = new URL(url).origin;
    if (TIENDA_SELF_ORIGINS.has(origin)) return true;
    if (typeof window !== 'undefined' && window.location.origin === origin) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getNucleoApiUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (raw) {
    const cleaned = raw.replace(/\/$/, '');
    if (!isSelfStoreUrl(cleaned)) {
      return cleaned;
    }
  }

  const isProdBuild =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.CI);

  if (isProdBuild) return CANONICAL_NUCLEO_URL;
  return 'http://localhost:3000';
}

export function requireNucleoApiUrl(): string {
  const url = getNucleoApiUrl();
  if (!url) {
    throw new Error('NEXT_PUBLIC_NUCLEO_API_URL no esta configurada');
  }
  return url;
}
