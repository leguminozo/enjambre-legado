import type { AppVariables } from '@/api/lib/middleware';
import type { Json } from '@enjambre/database/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/browser';
import {
  authMiddleware,
  tenantMiddleware,
  requireProfileRole,
} from '@/api/lib/middleware';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/api/lib/ratelimit';

async function webhookRateLimit(c: {
  req: { header: (name: string) => string | undefined; ip?: string };
  json: (data: unknown, status: number) => Response;
  header: (name: string, value: string) => void;
}) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...RATE_LIMIT_CONFIGS.webhook });

  c.header('X-RateLimit-Limit', String(result.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', String(result.reset));

  if (!result.success) {
    c.header('Retry-After', String(result.retryAfter || 60));
    return c.json(
      { code: 'rate_limited', message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
      429,
    );
  }
  return null;
}

/**
 * Webhook público Banco Chile (HMAC) + endpoints admin autenticados.
 * Montado ANTES de auth global en bancoChileRoutes — no exponer list/reprocess sin JWT.
 */
export const webhookRouter = new Hono<{ Variables: AppVariables }>();

const WebhookEventSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  cuenta_id: z.string().optional(),
  monto: z.number().optional(),
  descripcion: z.string().optional(),
  fecha: z.string(),
  datos: z.record(z.string(), z.unknown()).optional(),
});

/** Fail-closed: null if secret absent (never authorize with empty material). */
export function getBancoChileWebhookSecret(): string | null {
  const secret = process.env.BANCO_CHILE_WEBHOOK_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

/** Constant-time compare for equal-length strings (hex HMAC digests). */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyBancoChileSignature(
  payload: string,
  signature: string | undefined,
  secret: string | null = getBancoChileWebhookSecret(),
): Promise<boolean> {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqualString(computed, signature.toLowerCase());
}

// POST / — público, firma HMAC obligatoria
webhookRouter.post('/', async (c) => {
  const rateLimitResult = await webhookRateLimit(c);
  if (rateLimitResult) return rateLimitResult;

  const secret = getBancoChileWebhookSecret();
  if (!secret) {
    console.error('[banco-chile webhook] BANCO_CHILE_WEBHOOK_SECRET missing');
    return c.json(
      {
        code: 'webhook_secret_missing',
        message: 'Webhook no configurado (BANCO_CHILE_WEBHOOK_SECRET)',
      },
      503,
    );
  }

  try {
    const supabase = createAdminClient();
    const rawBody = await c.req.text();
    const signature = c.req.header('x-banco-chile-signature') ?? undefined;

    const isValid = await verifyBancoChileSignature(rawBody, signature, secret);
    if (!isValid) {
      console.warn('Banco Chile webhook: firma inválida');
      return c.json({ code: 'unauthorized', message: 'Unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ code: 'invalid_json', message: 'Invalid JSON' }, 400);
    }

    const parsed = WebhookEventSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ code: 'invalid_payload', message: 'Invalid payload' }, 400);
    }

    const { id, tipo, cuenta_id, monto, descripcion, fecha, datos } = parsed.data;

    // Idempotency: skip if already stored with same event id in datos_raw or tipo+id
    const { data: existing } = await supabase
      .from('banco_chile_notificaciones')
      .select('id')
      .eq('descripcion', `event:${id}`)
      .maybeSingle();

    let empresaId: string | undefined;
    if (cuenta_id) {
      const { data } = await supabase
        .from('banco_chile_cuentas')
        .select('empresa_id')
        .eq('numero_cuenta', cuenta_id)
        .maybeSingle();
      empresaId = data?.empresa_id;
    }

    if (!existing && empresaId) {
      await supabase.from('banco_chile_notificaciones').insert({
        empresa_id: empresaId,
        tipo_evento: tipo,
        cuenta_afectada: cuenta_id,
        monto: monto,
        descripcion: `event:${id}`,
        datos_raw: (datos ?? { event_id: id }) as Json,
        procesado: false,
        created_at: new Date(fecha).toISOString(),
      });
    } else if (!existing && !empresaId) {
      // Persist orphan for ops with empresa fallback from first config if single-tenant
      const { data: cfg } = await supabase
        .from('banco_chile_config')
        .select('empresa_id')
        .eq('enabled', true)
        .limit(1)
        .maybeSingle();
      if (cfg?.empresa_id) {
        await supabase.from('banco_chile_notificaciones').insert({
          empresa_id: cfg.empresa_id,
          tipo_evento: tipo,
          cuenta_afectada: cuenta_id,
          monto: monto,
          descripcion: `event:${id}`,
          datos_raw: (datos ?? { event_id: id }) as Json,
          procesado: false,
          created_at: new Date(fecha).toISOString(),
        });
        empresaId = cfg.empresa_id;
      }
    }

    await procesarNotificacion(supabase, tipo, {
      id,
      cuenta_id,
      monto,
      descripcion,
      datos,
    });

    return c.json({
      data: { success: true, deduped: Boolean(existing) },
      message: 'Notificación recibida',
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return c.json({ code: 'internal_error', message: 'Internal error' }, 500);
  }
});

// Health público (no secret)
webhookRouter.get('/status', async (c) => {
  const configured = Boolean(getBancoChileWebhookSecret());
  return c.json({
    data: {
      status: configured ? 'ok' : 'unconfigured',
      webhookSecret: configured ? 'present' : 'missing',
      timestamp: new Date().toISOString(),
    },
  });
});

async function procesarNotificacion(
  supabase: SupabaseClient,
  tipo: string,
  data: {
    id: string;
    cuenta_id?: string;
    monto?: number;
    descripcion?: string;
    datos?: Record<string, unknown>;
  },
) {
  try {
    switch (tipo) {
      case 'transferencia_recibida':
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'procesada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_operacion', data.id);
        break;

      case 'transferencia_rechazada':
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'rechazada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_operacion', data.id);
        break;

      case 'pago_nomina':
        await supabase
          .from('banco_chile_nominas')
          .update({
            estado: 'procesada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_nomina', data.id || '');
        break;

      case 'documento_aceptado':
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'aceptado',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_documento', data.id || '');
        break;

      case 'documento_rechazado':
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'rechazado',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_documento', data.id || '');
        break;

      case 'saldo_disponible':
        if (data.cuenta_id && data.monto != null) {
          await supabase
            .from('banco_chile_cuentas')
            .update({
              saldo_disponible: data.monto,
              ultimo_movimiento: new Date().toISOString(),
            })
            .eq('numero_cuenta', data.cuenta_id);
        }
        break;

      default:
        break;
    }

    await supabase
      .from('banco_chile_notificaciones')
      .update({ procesado: true })
      .eq('descripcion', `event:${data.id}`);
  } catch (error) {
    console.error('Error procesando notificación:', error);
    throw error;
  }
}

// Admin: listar pendientes (JWT + tenant)
webhookRouter.get(
  '/pendientes',
  authMiddleware,
  tenantMiddleware,
  requireProfileRole('admin'),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');

      const { data, error } = await supabase
        .from('banco_chile_notificaciones')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('procesado', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return c.json({ code: 'list_failed', message: error.message }, 500);
      }

      return c.json({ data: { notificaciones: data || [], total: data?.length || 0 } });
    } catch (error) {
      console.error('Error listando pendientes:', error);
      return c.json({ code: 'list_error', message: 'Error al listar pendientes' }, 500);
    }
  },
);

// Admin: reprocesar
webhookRouter.post(
  '/reprocesar/:id',
  authMiddleware,
  tenantMiddleware,
  requireProfileRole('admin'),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { id } = c.req.param();

      const { data: notificacion } = await supabase
        .from('banco_chile_notificaciones')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (!notificacion) {
        return c.json({ code: 'not_found', message: 'Notificación no encontrada' }, 404);
      }

      const raw = notificacion.datos_raw;
      // Use service role for side-effect updates across related tables
      const admin = createAdminClient();
      await procesarNotificacion(admin, notificacion.tipo_evento, {
        id: notificacion.id,
        cuenta_id: notificacion.cuenta_afectada ?? undefined,
        monto: notificacion.monto ?? undefined,
        descripcion: notificacion.descripcion ?? undefined,
        datos:
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : undefined,
      });

      return c.json({ data: { success: true }, message: 'Notificación reprocesada' });
    } catch (error) {
      console.error('Error reprocesando:', error);
      return c.json({ code: 'reprocess_error', message: 'Error al reprocesar' }, 500);
    }
  },
);

export { procesarNotificacion };
