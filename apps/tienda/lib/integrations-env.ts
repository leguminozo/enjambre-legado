/**
 * Solo importar desde Route Handlers, Server Actions o lib servidor (nunca desde 'use client').
 * Valida forma de variables opcionales; secretos nunca se exponen al cliente.
 */

import { z } from 'zod';

function opt(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

const integrationsEnvSchema = z.object({
  // SII (ej. futuro OAuth o API de terceros — nunca en integrations.config)
  SII_API_KEY: z.string().optional(),
  SII_CLIENT_ID: z.string().optional(),
  SII_CLIENT_SECRET: z.string().optional(),
  // Bancos / agregador
  BANK_API_KEY: z.string().optional(),
  BANK_CLIENT_ID: z.string().optional(),
  BANK_CLIENT_SECRET: z.string().optional(),
  // Notificaciones
  NOTIFY_SENDGRID_API_KEY: z.string().optional(),
  NOTIFY_SMTP_HOST: z.string().optional(),
  NOTIFY_SMTP_USER: z.string().optional(),
  NOTIFY_SMTP_PASS: z.string().optional(),
  // Boletas / DTE
  BOLETAS_API_KEY: z.string().optional(),
  DTE_API_TOKEN: z.string().optional(),
  // Pagos (ya usadas en checkout)
  TRANSBANK_COMMERCE_CODE: z.string().optional(),
  TRANSBANK_API_KEY: z.string().optional(),
});

export type IntegrationsEnv = z.infer<typeof integrationsEnvSchema>;

/** Lee y normaliza (trim) variables de integración desde process.env. */
export function parseIntegrationsEnv(e: NodeJS.ProcessEnv = process.env): IntegrationsEnv {
  return integrationsEnvSchema.parse({
    SII_API_KEY: opt(e.SII_API_KEY),
    SII_CLIENT_ID: opt(e.SII_CLIENT_ID),
    SII_CLIENT_SECRET: opt(e.SII_CLIENT_SECRET),
    BANK_API_KEY: opt(e.BANK_API_KEY),
    BANK_CLIENT_ID: opt(e.BANK_CLIENT_ID),
    BANK_CLIENT_SECRET: opt(e.BANK_CLIENT_SECRET),
    NOTIFY_SENDGRID_API_KEY: opt(e.NOTIFY_SENDGRID_API_KEY),
    NOTIFY_SMTP_HOST: opt(e.NOTIFY_SMTP_HOST),
    NOTIFY_SMTP_USER: opt(e.NOTIFY_SMTP_USER),
    NOTIFY_SMTP_PASS: opt(e.NOTIFY_SMTP_PASS),
    BOLETAS_API_KEY: opt(e.BOLETAS_API_KEY),
    DTE_API_TOKEN: opt(e.DTE_API_TOKEN),
    TRANSBANK_COMMERCE_CODE: opt(e.TRANSBANK_COMMERCE_CODE),
    TRANSBANK_API_KEY: opt(e.TRANSBANK_API_KEY),
  });
}

/** Presencia de secretos en servidor por clave lógica de `integrations.key` (booleano solo para UI). */
export function getSecretsPresenceForIntegrationKey(
  key: string,
  env: IntegrationsEnv = parseIntegrationsEnv(),
): boolean {
  switch (key) {
    case 'sii':
      return Boolean(
        env.SII_API_KEY || (env.SII_CLIENT_ID && env.SII_CLIENT_SECRET),
      );
    case 'bancos':
      return Boolean(env.BANK_API_KEY || env.BANK_CLIENT_SECRET);
    case 'notificaciones':
      return Boolean(
        env.NOTIFY_SENDGRID_API_KEY || (env.NOTIFY_SMTP_HOST && env.NOTIFY_SMTP_USER),
      );
    case 'boletas':
      return Boolean(env.BOLETAS_API_KEY || env.DTE_API_TOKEN);
    default:
      return false;
  }
}
