import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';

interface BancoChileConfigRow {
  id: string;
  empresa_id: string;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  environment: string;
  enabled: boolean;
  [key: string]: unknown;
}
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/api/lib/middleware';
import { tenantMiddleware } from '@/api/lib/middleware';
import { BancoChileClient } from '@enjambre/banco-chile';
import { bancoChileRouter } from './routes';
import { conciliacionRouter } from './conciliacion';
import { conciliacionAutoRoutes } from './conciliacion-auto';
import { webhookRouter } from './webhook';
import { transferenciasRouter } from './transferencias';
import { nominasRouter } from './nominas';
import { documentosRouter } from './documentos';
import { cotizacionesRouter } from './cotizaciones';
import { rentasRouter } from './rentas';
import { montosRouter } from './montos';

/**
 * Router principal para Banco Chile APIs
 *
 * Endpoints:
 * - GET /api/banco-chile/config - Obtener configuración
 * - POST /api/banco-chile/config - Crear/actualizar configuración
 * - POST /api/banco-chile/auth - Autenticar con Banco Chile
 * - GET /api/banco-chile/cuentas - Listar cuentas
 * - GET /api/banco-chile/movimientos - Listar movimientos
 * - POST /api/banco-chile/transferencias - Crear transferencia
 * - GET /api/banco-chile/conciliacion - Conciliación bancaria
 * - POST /api/banco-chile/conciliacion - Conciliar movimiento
 * - ... y más por cada API
 */
export const bancoChileRoutes = new Hono<{ Variables: AppVariables }>();

bancoChileRoutes.use('*', authMiddleware, tenantMiddleware);

// Rutas de configuración
bancoChileRoutes.get('/config', async (c) => {
  const supabase = c.get('supabase');
  const empresaId = c.get('empresaId');

  const { data, error } = await supabase
    .from('banco_chile_config')
    .select('*')
    .eq('empresa_id', empresaId)
    .single();

  if (error || !data) {
    return c.json({ config: null });
  }

  // No devolver credenciales sensibles
  const { client_id, client_secret, username, password, ...safeConfig } = data as BancoChileConfigRow;
  return c.json({
    config: {
      ...safeConfig,
      hasCredentials: !!(client_id && client_secret),
    },
  });
});

bancoChileRoutes.post(
  '/config',
  zValidator('json', z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    username: z.string(),
    password: z.string(),
    environment: z.enum(['sandbox', 'production']).default('sandbox'),
    enabled: z.boolean().default(false),
  })),
  async (c) => {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const { clientId, clientSecret, username, password, environment, enabled } = c.req.valid('json');

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('banco_chile_config')
      .select('id')
      .eq('empresa_id', empresaId)
      .single();

    if (existing) {
      // Actualizar
      const { error } = await supabase
        .from('banco_chile_config')
        .update({
          client_id: clientId,
          client_secret: clientSecret,
          username,
          password,
          environment,
          enabled,
        })
        .eq('empresa_id', empresaId);

      if (error) {
        return c.json({ error: error.message }, 500);
      }
    } else {
      // Crear nueva
      const { error } = await supabase
        .from('banco_chile_config')
        .insert({
          empresa_id: empresaId,
          client_id: clientId,
          client_secret: clientSecret,
          username,
          password,
          environment,
          enabled,
        });

      if (error) {
        return c.json({ error: error.message }, 500);
      }
    }

    return c.json({ success: true });
  }
);

// Rutas de autenticación
bancoChileRoutes.post('/auth', async (c) => {
  const supabase = c.get('supabase');
  const empresaId = c.get('empresaId');

  // Obtener credenciales de la DB
  const { data: config } = await supabase
    .from('banco_chile_config')
    .select('*')
    .eq('empresa_id', empresaId)
    .single();

  if (!config || !(config as BancoChileConfigRow).client_id) {
    return c.json({ error: 'Configuración no encontrada' }, 404);
  }

  const row = config as BancoChileConfigRow;
  const client = new BancoChileClient({
    clientId: row.client_id,
    clientSecret: row.client_secret,
    username: row.username,
    password: row.password,
    environment: row.environment === 'production' ? 'production' : 'sandbox',
  });

  const result = await client.authenticate();
  if (!result.success) {
    return c.json(
      {
        error: result.error.message,
        code: result.error.code,
      },
      502,
    );
  }

  const expiresAt = new Date(Date.now() + result.data.expires_in * 1000).toISOString();
  const tokenPayload = {
    config_id: row.id,
    access_token: result.data.access_token,
    refresh_token: result.data.refresh_token ?? null,
    expires_at: expiresAt,
    token_type: result.data.token_type,
  };

  const { data: existingToken } = await supabase
    .from('banco_chile_tokens')
    .select('id')
    .eq('config_id', row.id)
    .maybeSingle();

  const { error: tokenError } = existingToken
    ? await supabase.from('banco_chile_tokens').update(tokenPayload).eq('id', existingToken.id)
    : await supabase.from('banco_chile_tokens').insert(tokenPayload);

  if (tokenError) {
    console.error('[banco-chile/auth] token persist failed:', tokenError.message);
    return c.json({ error: 'Autenticación OK pero falló guardar token' }, 500);
  }

  await supabase
    .from('banco_chile_config')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', row.id);

  return c.json({
    success: true,
    expires_at: expiresAt,
    token_type: result.data.token_type,
  });
});

// Mount sub-routers
bancoChileRoutes.route('', bancoChileRouter);
bancoChileRoutes.route('/conciliacion', conciliacionRouter);
bancoChileRoutes.route('/conciliacion-auto', conciliacionAutoRoutes);
bancoChileRoutes.route('/webhook', webhookRouter);
bancoChileRoutes.route('/transferencias', transferenciasRouter);
bancoChileRoutes.route('/nominas', nominasRouter);
bancoChileRoutes.route('/documentos', documentosRouter);
bancoChileRoutes.route('/cotizaciones', cotizacionesRouter);
bancoChileRoutes.route('/rentas', rentasRouter);
bancoChileRoutes.route('/montos', montosRouter);
