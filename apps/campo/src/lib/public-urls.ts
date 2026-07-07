/** URLs canónicas Vercel — fallback si faltan env en deploy */
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

  return toOrigin(CANONICAL_PRODUCTION_URLS.tienda) ?? CANONICAL_PRODUCTION_URLS.tienda;
}

/** URL de reclamo guardian para una venta POS (campo → tienda). */
export function buildClaimUrl(claimToken: string): string {
  const base = getTiendaOrigin().replace(/\/$/, '');
  const token = encodeURIComponent(claimToken.trim());
  return `${base}/claim/${token}`;
}