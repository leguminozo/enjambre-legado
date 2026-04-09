/**
 * integrations.config must never store secrets (panel is client-fetched).
 * Use env / vault for credentials; only non-sensitive fields belong in JSONB.
 */

/** Nombres completos normalizados (snake_case) que no pueden aparecer como clave. */
const FORBIDDEN_FULL_KEYS = new Set([
  'api_key',
  'apikey',
  'password',
  'passwd',
  'secret',
  'private_key',
  'privatekey',
  'client_secret',
  'access_token',
  'refresh_token',
  'webhook_secret',
  'authorization',
  'bearer_token',
  'cert_pem',
  'certificate',
  'credential',
  'credentials',
  'notify_smtp_pass',
]);

/**
 * Si algún segmento (separado por _) coincide, la clave se rechaza.
 * Evita subcadenas sueltas tipo "token" dentro de "histoken".
 */
const FORBIDDEN_SEGMENTS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'apikey',
  'authorization',
  'credential',
  'certificate',
  'webhook',
  'bearer',
  'private',
  'pem',
]);

/** Normaliza a snake_case para comparar. */
export function normalizeIntegrationConfigKey(key: string): string {
  return key
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
}

export function isForbiddenConfigKey(key: string): boolean {
  const n = normalizeIntegrationConfigKey(key);
  if (FORBIDDEN_FULL_KEYS.has(n)) return true;
  const segments = n.split('_').filter(Boolean);
  return segments.some((s) => FORBIDDEN_SEGMENTS.has(s));
}

function collectForbiddenPaths(
  value: unknown,
  pathPrefix: string,
): string[] {
  const bad: string[] = [];
  if (value === null || value === undefined) return bad;
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      bad.push(...collectForbiddenPaths(item, `${pathPrefix}[${i}]`));
    });
    return bad;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const p = pathPrefix ? `${pathPrefix}.${k}` : k;
      if (isForbiddenConfigKey(k)) bad.push(p);
      bad.push(...collectForbiddenPaths(v, p));
    }
  }
  return bad;
}

/** Returns paths like "apiKey" or "nested.secret" for forbidden keys. */
export function findForbiddenConfigKeys(config: unknown): string[] {
  if (config === null || config === undefined) return [];
  if (typeof config !== 'object' || Array.isArray(config)) {
    return ['config'];
  }
  return collectForbiddenPaths(config, '');
}

export function redactIntegrationConfig(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (isForbiddenConfigKey(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = redactIntegrationConfig(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? redactIntegrationConfig(item as Record<string, unknown>)
          : item,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}
