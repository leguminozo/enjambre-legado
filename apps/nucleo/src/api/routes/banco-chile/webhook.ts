import type { AppVariables } from '@/api/lib/middleware';
import type { Json } from '@enjambre/database/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { z } from 'zod';
import { createAdminClient } from '@enjambre/auth/server-index';
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

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

/** Normalize header variants: `sha256=…`, hex, or base64. */
function normalizeSignatureHeader(signature: string): string {
  const s = signature.trim();
  if (s.toLowerCase().startsWith('sha256=')) return s.slice(7).trim();
  return s;
}

export async function verifyBancoChileSignature(
  payload: string,
  signature: string | undefined,
  secret: string | null = getBancoChileWebhookSecret(),
): Promise<boolean> {
  if (!signature || !secret) return false;

  const provided = normalizeSignatureHeader(signature);
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  const hex = bytesToHex(sig);
  const b64 = bytesToBase64(sig);

  // Accept hex (case-insensitive) or standard base64
  if (timingSafeEqualString(hex, provided.toLowerCase())) return true;
  if (provided.length === b64.length && timingSafeEqualString(b64, provided)) return true;
  return false;
}

/**
 * Event id for side-effects / mark procesado.
 * Prefer datos_raw.event_id or descripcion `event:{id}` — never the row UUID alone.
 */
export function resolveWebhookEventId(notif: {
  id: string;
  descripcion?: string | null;
  datos_raw?: unknown;
}): string {
  const raw = notif.datos_raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const eventId = (raw as Record<string, unknown>).event_id;
    if (eventId != null && String(eventId).trim()) return String(eventId).trim();
  }
  const d = notif.descripcion?.trim() ?? '';
  if (d.startsWith('event:')) {
    const id = d.slice('event:'.length).trim();
    if (id) return id;
  }
  return notif.id;
}

/** Bank operation id for transferencia/nomina/documento updates (from payload datos). */
export function resolveWebhookBusinessId(data: {
  id: string;
  descripcion?: string;
  datos?: Record<string, unknown>;
}): string {
  const d = data.datos ?? {};
  const candidates = [
    d.numero_operacion,
    d.numeroOperacion,
    d.numero_nomina,
    d.numeroNomina,
    d.numero_documento,
    d.numeroDocumento,
    d.operation_id,
    d.operationId,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim()) return String(c).trim();
  }
  // human description is not a business id; fall back to event id
  return data.id;
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
    // Accept common header names used by API store / reverse proxies
    const signature =
      c.req.header('x-banco-chile-signature') ??
      c.req.header('x-signature') ??
      c.req.header('x-hub-signature-256') ??
      undefined;

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
    const eventKey = `event:${id}`;

    // Idempotency: never re-process the same event id
    const { data: existing } = await supabase
      .from('banco_chile_notificaciones')
      .select('id, procesado')
      .eq('descripcion', eventKey)
      .maybeSingle();

    if (existing) {
      return c.json({
        data: { success: true, deduped: true, procesado: existing.procesado },
        message: 'Evento ya recibido',
      });
    }

    let empresaId: string | undefined;
    if (cuenta_id) {
      const { data } = await supabase
        .from('banco_chile_cuentas')
        .select('empresa_id')
        .eq('numero_cuenta', cuenta_id)
        .maybeSingle();
      empresaId = data?.empresa_id;
    }

    if (!empresaId) {
      const { data: cfg } = await supabase
        .from('banco_chile_config')
        .select('empresa_id')
        .eq('enabled', true)
        .limit(1)
        .maybeSingle();
      empresaId = cfg?.empresa_id;
    }

    if (!empresaId) {
      console.error('[banco-chile webhook] no empresa_id for event', id);
      return c.json(
        { code: 'empresa_unresolved', message: 'No se pudo resolver empresa del evento' },
        422,
      );
    }

    const { error: insertErr } = await supabase.from('banco_chile_notificaciones').insert({
      empresa_id: empresaId,
      tipo_evento: tipo,
      cuenta_afectada: cuenta_id,
      monto: monto,
      descripcion: eventKey,
      datos_raw: { ...(datos ?? {}), event_id: id, human: descripcion } as Json,
      procesado: false,
      created_at: new Date(fecha).toISOString(),
    });

    // Race: concurrent delivery of same event (unique index mig 99)
    if (insertErr) {
      const msg = insertErr.message?.toLowerCase() ?? '';
      if (msg.includes('duplicate') || msg.includes('unique') || insertErr.code === '23505') {
        return c.json({
          data: { success: true, deduped: true },
          message: 'Evento ya recibido (race)',
        });
      }
      console.error('[banco-chile webhook] insert failed', insertErr.message);
      return c.json({ code: 'persist_failed', message: insertErr.message }, 500);
    }

    try {
      await procesarNotificacion(supabase, tipo, {
        id,
        cuenta_id,
        monto,
        descripcion,
        datos,
      });
    } catch (procErr) {
      // Keep row unprocessed for admin reprocesar
      console.error('[banco-chile webhook] process failed (queued for reprocess)', procErr);
      return c.json(
        {
          data: { success: true, deduped: false, procesado: false },
          message: 'Notificación guardada; procesamiento diferido (reprocesar en UI)',
        },
        202,
      );
    }

    return c.json({
      data: { success: true, deduped: false, procesado: true },
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
    const businessId = resolveWebhookBusinessId(data);

    switch (tipo) {
      case 'transferencia_recibida':
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'procesada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_operacion', businessId);
        break;

      case 'transferencia_rechazada':
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'rechazada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_operacion', businessId);
        break;

      case 'pago_nomina':
        await supabase
          .from('banco_chile_nominas')
          .update({
            estado: 'procesada',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_nomina', businessId);
        break;

      case 'documento_aceptado':
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'aceptado',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_documento', businessId);
        break;

      case 'documento_rechazado':
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'rechazado',
            updated_at: new Date().toISOString(),
          })
          .eq('numero_documento', businessId);
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
      const datos =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : undefined;
      const eventId = resolveWebhookEventId({
        id: notificacion.id,
        descripcion: notificacion.descripcion,
        datos_raw: raw,
      });
      const human =
        datos && typeof datos.human === 'string'
          ? datos.human
          : (notificacion.descripcion ?? undefined);

      // Use service role for side-effect updates across related tables
      const admin = createAdminClient();
      await procesarNotificacion(admin, notificacion.tipo_evento, {
        id: eventId,
        cuenta_id: notificacion.cuenta_afectada ?? undefined,
        monto: notificacion.monto ?? undefined,
        descripcion: human,
        datos,
      });

      // Ensure row marked even if descripcion was malformed pre-fix
      await admin
        .from('banco_chile_notificaciones')
        .update({ procesado: true })
        .eq('id', notificacion.id)
        .eq('empresa_id', empresaId);

      return c.json({
        data: { success: true, event_id: eventId },
        message: 'Notificación reprocesada',
      });
    } catch (error) {
      console.error('Error reprocesando:', error);
      return c.json({ code: 'reprocess_error', message: 'Error al reprocesar' }, 500);
    }
  },
);

export { procesarNotificacion };
