import type { AppVariables } from '@/api/lib/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/api/lib/ratelimit';

async function webhookRateLimit(c: { req: { header: (name: string) => string | undefined; ip?: string }; json: (data: unknown, status: number) => Response; header: (name: string, value: string) => void }) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...RATE_LIMIT_CONFIGS.webhook });

  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.reset));

  if (!result.success) {
    c.header("Retry-After", String(result.retryAfter || 60));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);
  }
  return null;
}

/**
 * Webhook para notificaciones de Banco Chile
 * Endpoint para recibir notificaciones automáticas de eventos
 */
export const webhookRouter = new Hono<{ Variables: AppVariables }>();

// Schema para notificaciones
const WebhookEventSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  cuenta_id: z.string().optional(),
  monto: z.number().optional(),
  descripcion: z.string().optional(),
  fecha: z.string(),
  datos: z.record(z.string(), z.unknown()).optional(),
});

function getBancoChileWebhookSecret(): string {
  const secret = process.env.BANCO_CHILE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Falta BANCO_CHILE_WEBHOOK_SECRET');
  return secret;
}

async function verifyBancoChileSignature(
  payload: string,
  signature: string | undefined
): Promise<boolean> {
  if (!signature) return false;

  const secret = getBancoChileWebhookSecret();
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

// Endpoint principal para webhooks
webhookRouter.post('/', async (c) => {
  const rateLimitResult = await webhookRateLimit(c);
  if (rateLimitResult) return rateLimitResult;

  try {
    const supabase = c.get('supabase');
    const rawBody = await c.req.text();
    const signature = c.req.header('x-banco-chile-signature');

    // Verificar firma HMAC-SHA256
    const isValid = await verifyBancoChileSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Banco Chile webhook: firma inválida');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Validar datos
    const body = JSON.parse(rawBody);
    const parsed = WebhookEventSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const { id, tipo, cuenta_id, monto, descripcion, fecha, datos } = parsed.data;

    // Obtener empresa asociada a la cuenta
    let empresaId: string | undefined;
    if (cuenta_id) {
      const { data } = await supabase
        .from('banco_chile_cuentas')
        .select('empresa_id')
        .eq('numero_cuenta', cuenta_id)
        .single();
      empresaId = data?.empresa_id;
    }

    // Guardar notificación
    await (supabase as any).from('banco_chile_notificaciones').insert({
      empresa_id: empresaId,
      tipo_evento: tipo,
      cuenta_afectada: cuenta_id,
      monto: monto,
      descripcion: descripcion,
      datos_raw: datos,
      procesado: false,
      created_at: new Date(fecha),
    });

    // Procesar notificación según tipo
    await procesarNotificacion(supabase, tipo, {
      id,
      cuenta_id,
      monto,
      descripcion,
      datos,
    });

    return c.json({ success: true, message: 'Notificación recibida' });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// Endpoint para verificar estado del webhook
webhookRouter.get('/status', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Función para procesar notificaciones por tipo
async function procesarNotificacion(
  supabase: SupabaseClient,
  tipo: string,
  data: {
    id: string;
    cuenta_id?: string;
    monto?: number;
    descripcion?: string;
    datos?: Record<string, unknown>;
  }
) {
  try {
    switch (tipo) {
      case 'transferencia_recibida':
        // Actualizar estado de transferencia
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'procesada',
            updated_at: new Date(),
          })
          .eq('numero_operacion', data.id);
        break;

      case 'transferencia_rechazada':
        // Actualizar estado a rechazada
        await supabase
          .from('banco_chile_transferencias')
          .update({
            estado: 'rechazada',
            updated_at: new Date(),
          })
          .eq('numero_operacion', data.id);
        break;

      case 'pago_nomina':
        // Actualizar estado de nómina
        await supabase
          .from('banco_chile_nominas')
          .update({
            estado: 'procesada',
            updated_at: new Date(),
          })
          .eq('numero_nomina', data.id || '');
        break;

      case 'documento_aceptado':
        // Actualizar estado de documento
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'aceptado',
            updated_at: new Date(),
          })
          .eq('numero_documento', data.id || '');
        break;

      case 'documento_rechazado':
        // Actualizar estado de documento
        await supabase
          .from('banco_chile_documentos')
          .update({
            estado: 'rechazado',
            updated_at: new Date(),
          })
          .eq('numero_documento', data.id || '');
        break;

      case 'saldo_disponible':
        // Actualizar saldo de cuenta
        if (data.cuenta_id && data.monto) {
          await supabase
            .from('banco_chile_cuentas')
            .update({
              saldo_disponible: data.monto,
              ultimo_movimiento: new Date(),
            })
            .eq('numero_cuenta', data.cuenta_id);
        }
        break;

default:
      break;
    }

    // Marcar notificación como procesada
    await supabase
      .from('banco_chile_notificaciones')
      .update({ procesado: true })
      .eq('id', data.id);
  } catch (error) {
    console.error('Error procesando notificación:', error);
    throw error;
  }
}

// Endpoint para listar notificaciones no procesadas
webhookRouter.get('/pendientes', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const { data, error } = await supabase
      .from('banco_chile_notificaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('procesado', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ notificaciones: data || [], total: data?.length || 0 });
  } catch (error) {
    console.error('Error listando pendientes:', error);
    return c.json({ error: 'Error al listar pendientes' }, 500);
  }
});

// Endpoint para reprocesar notificaciones
webhookRouter.post('/reprocesar/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    const { data: notificacion } = await supabase
      .from('banco_chile_notificaciones')
      .select('*')
      .eq('id', id)
      .single();

    if (!notificacion) {
      return c.json({ error: 'Notificación no encontrada' }, 404);
    }

    // Re-procesar
    await procesarNotificacion(supabase, notificacion.tipo_evento, {
      id: notificacion.id,
      cuenta_id: notificacion.cuenta_afectada,
      monto: notificacion.monto,
      descripcion: notificacion.descripcion,
      datos: notificacion.datos_raw,
    } as any);

    return c.json({ success: true, message: 'Notificación reprocesada' });
  } catch (error) {
    console.error('Error reprocesando:', error);
    return c.json({ error: 'Error al reprocesar' }, 500);
  }
});

export { procesarNotificacion };
