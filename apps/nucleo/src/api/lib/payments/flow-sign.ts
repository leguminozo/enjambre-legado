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

export function getNucleoPublicUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_NUCLEO_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_URL_NUCLEO?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) return 'http://localhost:3000';
  return url.replace(/\/$/, '');
}
