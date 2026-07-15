/**
 * Payment provider return URLs must never trust an arbitrary client URL
 * (open redirect / phishing after Webpay/Flow).
 */

const ALLOWED_PATHS = new Set([
  '/checkout/resultado',
  '/perfil/reposicion/resultado',
  '/perfil/ritual/resultado', // legacy redirect target if still hit
]);

function collectAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const key of [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_URL_TIENDA',
    'NEXT_PUBLIC_TIENDA_URL',
  ] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // ignore invalid env
    }
  }
  // Local monorepo ports (tienda 3001, nucleo 3000)
  for (const origin of [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]) {
    origins.add(origin);
  }
  return origins;
}

function defaultReturnBase(fallbackPath: string): string {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_URL_TIENDA?.trim() ||
    'http://localhost:3001';
  try {
    const origin = new URL(site).origin;
    return `${origin}${fallbackPath}`;
  } catch {
    return `http://localhost:3001${fallbackPath}`;
  }
}

/**
 * Resolve a safe post-payment return URL with buyOrder query.
 * Untrusted raw URLs fall back to the configured site + fallbackPath.
 */
export function resolveCheckoutReturnUrl(
  raw: string | undefined,
  buyOrder: string,
  fallbackPath = '/checkout/resultado',
): string {
  const allowedOrigins = collectAllowedOrigins();
  let base = defaultReturnBase(fallbackPath);

  if (raw) {
    try {
      const candidate = new URL(raw);
      const pathOk = ALLOWED_PATHS.has(candidate.pathname);
      if (allowedOrigins.has(candidate.origin) && pathOk) {
        base = `${candidate.origin}${candidate.pathname}`;
      }
    } catch {
      // ignore invalid client URL
    }
  }

  const url = new URL(base);
  url.searchParams.set('buyOrder', buyOrder);
  return url.toString();
}
