function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

/**
 * Secret for service-to-service calls (x-internal-key).
 * In production INTERNAL_API_SECRET is required — never falls back to service role.
 */
export function getInternalApiSecret(): string | null {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (secret) return secret;

  if (isProductionRuntime()) {
    console.error(
      '[internal-api] INTERNAL_API_SECRET is required in production. Internal routes will reject all callers.',
    );
    return null;
  }

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback) {
    console.warn(
      '[internal-api] Using SUPABASE_SERVICE_ROLE_KEY as internal key (dev/test only). Set INTERNAL_API_SECRET.',
    );
    return fallback;
  }

  return null;
}

export function verifyInternalApiKey(header: string | undefined | null): boolean {
  const expected = getInternalApiSecret();
  if (!expected || !header) return false;
  return header === expected;
}