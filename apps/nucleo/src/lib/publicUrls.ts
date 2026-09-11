/** URLs canónicas Vercel (guillermoc) — fallback CSRF/CORS si faltan env en deploy */
export const CANONICAL_PRODUCTION_URLS = {
  nucleo: 'https://nucleo-theta.vercel.app',
  tienda: 'https://tienda-eta-lime.vercel.app',
  campo: 'https://campo-olive.vercel.app',
  obrerayzangano_com: 'https://obrerayzangano.cl',
  obrerayzangano_www_com: 'https://www.obrerayzangano.cl',
  obrerayzangano_cl: 'https://obrerayzangano.cl',
  obrerayzangano_www_cl: 'https://www.obrerayzangano.cl',
  obrerayzangano_online: 'https://obrerayzangano.online',
  obrerayzangano_www_online: 'https://www.obrerayzangano.online',
  registroapicolachiloe_me: 'https://registroapicolachiloe.me',
  registroapicolachiloe_www_me: 'https://www.registroapicolachiloe.me',
  obrerayzangano_store: 'https://obrerayzangano.store',
  obrerayzangano_www_store: 'https://www.obrerayzangano.store',
} as const;

/**
 * Dominios custom extra — Campo usa un dominio .store que se pasa por env.
 * Se leen en runtime para no hardcodear un TLD que puede cambiar.
 */
function getRuntimeCustomOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_URL_CAMPO,
    process.env.NEXT_PUBLIC_CAMPO_URL,
    process.env.NEXT_PUBLIC_SITE_CAMPO,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function toOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function getUrlTienda(): string {
  // NO incluir NEXT_PUBLIC_SITE_URL: en el proyecto Núcleo esa var apunta al propio
  // dominio de Núcleo → el iframe del Editor se auto-embebe y queda en blanco
  // (CSP frame-ancestors 'none' de Núcleo). El fallback canónico .cl es la tienda real.
  const v = process.env.NEXT_PUBLIC_URL_TIENDA || process.env.NEXT_PUBLIC_TIENDA_URL;
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3001';
  return CANONICAL_PRODUCTION_URLS.obrerayzangano_cl;
}

export function getUrlCampo(): string {
  const v = process.env.NEXT_PUBLIC_URL_CAMPO || process.env.NEXT_PUBLIC_CAMPO_URL;
  return typeof v === 'string' && v.trim() ? v.trim() : CANONICAL_PRODUCTION_URLS.obrerayzangano_store;
}

/** Orígenes permitidos para CSRF — env + producción canónica + runtime custom (campo .store) */
export function getAllowedCorsOrigins(): Set<string> {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_TIENDA_URL,
    process.env.NEXT_PUBLIC_URL_TIENDA,
    process.env.NEXT_PUBLIC_CAMPO_URL,
    process.env.NEXT_PUBLIC_URL_CAMPO,
    process.env.NEXT_PUBLIC_NUCLEO_API_URL,
    ...Object.values(CANONICAL_PRODUCTION_URLS),
    ...getRuntimeCustomOrigins(),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];

  const origins = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const origin = toOrigin(candidate);
    if (origin) origins.add(origin);
  }
  return origins;
}

/**
 * Validador robusto de orígenes para CORS y CSRF.
 * Acepta orígenes explícitos configurados y subdominios oficiales de la plataforma.
 */
export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const allowed = getAllowedCorsOrigins();
  if (allowed.has(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (
      host === 'obrerayzangano.store' ||
      host.endsWith('.obrerayzangano.store') ||
      host === 'obrerayzangano.online' ||
      host.endsWith('.obrerayzangano.online') ||
      host === 'obrerayzangano.cl' ||
      host.endsWith('.obrerayzangano.cl') ||
      host === 'registroapicolachiloe.me' ||
      host.endsWith('.registroapicolachiloe.me') ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
