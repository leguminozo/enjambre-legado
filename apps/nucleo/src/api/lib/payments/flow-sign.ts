/**
 * Flow.cl HMAC-SHA256 signing per official API docs:
 * Sort keys alphabetically, concatenate as key+value (no = or &), then HMAC.
 * @see https://developers.flow.cl/api
 */
export async function signFlowParams(
  params: Record<string, string>,
  secret: string,
): Promise<string> {
  const toSign = Object.keys(params)
    .filter((k) => k !== 's')
    .sort()
    .map((k) => k + params[k])
    .join('');

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(toSign));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function withFlowSignature(
  params: Record<string, string>,
  secret: string,
): Promise<Record<string, string>> {
  const s = await signFlowParams(params, secret);
  return { ...params, s };
}

export function toFlowFormBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

const NOT_NUCLEO_ORIGINS = new Set([
  'https://obrerayzangano.cl',
  'https://www.obrerayzangano.cl',
  'https://tienda-eta-lime.vercel.app',
  'https://campo-olive.vercel.app',
  'https://obrerayzangano.store',
  'https://www.obrerayzangano.store',
]);

export function getNucleoPublicUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_NUCLEO_API_URL,
    process.env.NEXT_PUBLIC_URL_NUCLEO,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      const parsed = new URL(candidate.trim());
      if (!NOT_NUCLEO_ORIGINS.has(parsed.origin)) {
        // En Vercel / Cloudflare, el apex registroapicolachiloe.me redirige 308 a www.
        // Las pasarelas de pago (Flow) no siguen 308 en webhooks y reportan error.
        // Se normaliza automáticamente a https://www.registroapicolachiloe.me.
        if (parsed.hostname === 'registroapicolachiloe.me') {
          return 'https://www.registroapicolachiloe.me';
        }
        return candidate.trim().replace(/\/$/, '');
      }
    } catch {
      // ignore invalid URL
    }
  }

  const isProd =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.CI);

  if (isProd) return 'https://nucleo-theta.vercel.app';
  return 'http://localhost:3000';
}
