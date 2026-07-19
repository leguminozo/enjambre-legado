/**
 * Canonical env matrix for Enjambre Legado (nucleo · tienda · campo).
 * Used by env-matrix-check / go-live-check. Values never printed.
 */

/** @typedef {{ name: string, path: string, required: string[], recommended: string[] }} AppMatrix */

/** @type {AppMatrix[]} */
export const ENV_MATRIX = [
  {
    name: 'nucleo',
    path: 'apps/nucleo/.env.local',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'INTERNAL_API_SECRET',
      'NEXT_PUBLIC_URL_TIENDA',
    ],
    recommended: [
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_NUCLEO_API_URL',
      'NEXT_PUBLIC_URL_CAMPO',
      'CMS_REVALIDATE_SECRET',
      'SII_CLAVE_ENCRYPTION_KEY',
      'CRON_SECRET',
      'PAYMENT_PROVIDER',
      'FLOW_API_KEY',
      'FLOW_SECRET',
      'FLOW_API_URL',
      'TRANSBANK_COMMERCE_CODE',
      'TRANSBANK_API_KEY',
      'TRANSBANK_ENVIRONMENT',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
    ],
  },
  {
    name: 'tienda',
    path: 'apps/tienda/.env.local',
    required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_NUCLEO_API_URL'],
    recommended: [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'INTERNAL_API_SECRET',
      'CMS_REVALIDATE_SECRET',
    ],
  },
  {
    name: 'campo',
    path: 'apps/campo/.env.local',
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_NUCLEO_API_URL',
      'NEXT_PUBLIC_URL_TIENDA',
    ],
    recommended: [
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'INTERNAL_API_SECRET',
    ],
  },
];

/** Runtime groups for nucleo API (presence-only). */
export const NUCLEO_RUNTIME_GROUPS = [
  {
    id: 'core',
    label: 'Core multi-app',
    critical: true,
    keys: [
      { id: 'supabase_url', anyOf: ['NEXT_PUBLIC_SUPABASE_URL'] },
      {
        id: 'supabase_anon',
        anyOf: [
          'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ],
      },
      { id: 'service_role', anyOf: ['SUPABASE_SERVICE_ROLE_KEY'] },
      { id: 'internal_api', anyOf: ['INTERNAL_API_SECRET'] },
      {
        id: 'tienda_url',
        anyOf: ['NEXT_PUBLIC_URL_TIENDA', 'NEXT_PUBLIC_TIENDA_URL'],
      },
    ],
  },
  {
    id: 'fiscal',
    label: 'SII / cifrado',
    critical: true,
    keys: [
      {
        id: 'encryption',
        anyOf: [
          'SII_CLAVE_ENCRYPTION_KEY',
          'FISCAL_ENCRYPTION_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
        ],
        note: 'SII_CLAVE_ENCRYPTION_KEY preferido (≥32); SERVICE_ROLE fallback',
      },
      { id: 'cron', anyOf: ['CRON_SECRET'], recommended: true },
    ],
  },
  {
    id: 'pagos_web',
    label: 'Checkout web (Flow/TBK)',
    critical: false,
    keys: [
      { id: 'payment_provider', anyOf: ['PAYMENT_PROVIDER'], recommended: true },
      {
        id: 'flow',
        allOf: ['FLOW_API_KEY', 'FLOW_SECRET', 'FLOW_API_URL'],
        recommended: true,
      },
      {
        id: 'transbank',
        allOf: ['TRANSBANK_COMMERCE_CODE', 'TRANSBANK_API_KEY'],
        recommended: true,
      },
    ],
  },
  {
    id: 'ops',
    label: 'Ops / rate limit',
    critical: false,
    keys: [
      {
        id: 'upstash',
        allOf: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        recommended: true,
      },
      {
        id: 'nucleo_public',
        anyOf: ['NEXT_PUBLIC_NUCLEO_API_URL', 'NEXT_PUBLIC_URL_NUCLEO'],
        recommended: true,
      },
      { id: 'campo_url', anyOf: ['NEXT_PUBLIC_URL_CAMPO'], recommended: true },
    ],
  },
];
