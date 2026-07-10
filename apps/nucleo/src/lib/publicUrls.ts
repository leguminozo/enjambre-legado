/** URLs canónicas Vercel (guillermoc) — fallback CSRF/CORS si faltan env en deploy */
export const CANONICAL_PRODUCTION_URLS = {
  nucleo: 'https://nucleo-theta.vercel.app',
  tienda: 'https://tienda-eta-lime.vercel.app',
  campo: 'https://campo-olive.vercel.app',
} as const;

function toOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function getUrlTienda(): string {
  const v = process.env.NEXT_PUBLIC_URL_TIENDA || process.env.NEXT_PUBLIC_TIENDA_URL;
  return typeof v === 'string' && v.trim() ? v.trim() : CANONICAL_PRODUCTION_URLS.tienda;
}

export function getUrlCampo(): string {
  const v = process.env.NEXT_PUBLIC_URL_CAMPO || process.env.NEXT_PUBLIC_CAMPO_URL;
  return typeof v === 'string' && v.trim() ? v.trim() : CANONICAL_PRODUCTION_URLS.campo;
}

/** Orígenes permitidos para CSRF — env + producción canónica */
export function getAllowedCorsOrigins(): Set<string> {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_TIENDA_URL,
    process.env.NEXT_PUBLIC_URL_TIENDA,
    process.env.NEXT_PUBLIC_CAMPO_URL,
    process.env.NEXT_PUBLIC_URL_CAMPO,
    process.env.NEXT_PUBLIC_NUCLEO_API_URL,
    ...Object.values(CANONICAL_PRODUCTION_URLS),
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
