/**
 * Shared fail-closed auth for Vercel cron / worker routes.
 * Secret absent → never authorize. Compare timing-safe (no `===`).
 * Accepts any configured platform secret (CRON / FISCAL / NOTIFICATIONS / INTEGRATIONS).
 */

const SECRET_ENV_KEYS = [
  "CRON_SECRET",
  "FISCAL_WORKER_SECRET",
  "NOTIFICATIONS_WORKER_SECRET",
  "INTEGRATIONS_CRON_SECRET",
] as const;

export function collectCronSecrets(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const key of SECRET_ENV_KEYS) {
    const v = process.env[key]?.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/** First configured secret (for callers that only need presence). */
export function resolveCronSecret(): string | undefined {
  return collectCronSecrets()[0];
}

export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function providedTokens(request: Request): string[] {
  const tokens: string[] = [];
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) tokens.push(token);
  }
  for (const header of ["x-worker-secret", "x-cron-secret"] as const) {
    const provided = request.headers.get(header)?.trim();
    if (provided) tokens.push(provided);
  }
  return tokens;
}

/** Fail-closed: no secrets configured → false. Token must timing-safe match any secret. */
export function isCronAuthorized(request: Request): boolean {
  const secrets = collectCronSecrets();
  if (secrets.length === 0) return false;

  const tokens = providedTokens(request);
  if (tokens.length === 0) return false;

  for (const token of tokens) {
    for (const secret of secrets) {
      if (timingSafeEqualString(token, secret)) return true;
    }
  }
  return false;
}
