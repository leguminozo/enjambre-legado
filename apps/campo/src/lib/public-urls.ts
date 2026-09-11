/** URLs canónicas Vercel — fallback si faltan env en deploy */
export const CANONICAL_PRODUCTION_URLS = {
  nucleo: 'https://nucleo-theta.vercel.app',
  tienda: 'https://tienda-eta-lime.vercel.app',
  campo: 'https://campo-olive.vercel.app',
  campo_store: 'https://obrerayzangano.store',
  campo_www_store: 'https://www.obrerayzangano.store',
  tienda_cl: 'https://obrerayzangano.cl',
  campo_online: 'https://obrerayzangano.online',
  nucleo_me: 'https://registroapicolachiloe.me',
} as const;

/** URL canónica del BFF Núcleo (guillermoc) */
export const CANONICAL_NUCLEO_URL = CANONICAL_PRODUCTION_URLS.nucleo;

/**
 * Dominios que jamás son el BFF Núcleo (p. ej. dominios sin deployment como
 * obrerayzangano.online que da 404 sin CORS, la propia tienda, o el propio campo).
 */
const INVALID_NUCLEO_ORIGINS = new Set([
  'https://obrerayzangano.online',
  'https://www.obrerayzangano.online',
  'https://obrerayzangano.store',
  'https://www.obrerayzangano.store',
  'https://campo-olive.vercel.app',
  'https://obrerayzangano.cl',
  'https://www.obrerayzangano.cl',
  'https://tienda-eta-lime.vercel.app',
]);

function toOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** URL base para llamadas al BFF de Núcleo (/api/...). */
export function getNucleoApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim();
  if (raw) {
    const cleaned = raw.replace(/\/$/, '');
    const origin = toOrigin(cleaned);
    if (origin && !INVALID_NUCLEO_ORIGINS.has(origin)) {
      return cleaned;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return CANONICAL_NUCLEO_URL;
}

/** Origen público de la tienda (claim QR, enlaces post-venta POS). */
export function getTiendaOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_URL_TIENDA,
    process.env.NEXT_PUBLIC_TIENDA_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const origin = toOrigin(candidate.trim());
    if (origin) return origin;
  }

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if (hostname === 'localhost' && port === '3002') {
      return 'http://localhost:3001';
    }
    if (hostname.includes('localhost')) {
      const tiendaPort = port === '3002' ? '3001' : port;
      return `${protocol}//${hostname}${tiendaPort ? `:${tiendaPort}` : ''}`;
    }
  }

  return toOrigin(CANONICAL_PRODUCTION_URLS.tienda_cl) ?? CANONICAL_PRODUCTION_URLS.tienda_cl;
}

/** URL de reclamo guardian para una venta POS (campo → tienda). */
export function buildClaimUrl(claimToken: string): string {
  const base = getTiendaOrigin().replace(/\/$/, '');
  const token = encodeURIComponent(claimToken.trim());
  return `${base}/claim/${token}`;
}