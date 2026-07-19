import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/api/lib/middleware';
import { tenantMiddleware } from '@/api/lib/middleware';
import { bancoChileRouter } from './routes';
import { conciliacionRouter } from './conciliacion';
import { conciliacionAutoRoutes } from './conciliacion-auto';
import { conciliacionStatsRoutes } from './conciliacion-stats';
import { webhookRouter } from './webhook';
import { transferenciasRouter } from './transferencias';
import { nominasRouter } from './nominas';
import { documentosRouter } from './documentos';
import { cotizacionesRouter } from './cotizaciones';
import { rentasRouter } from './rentas';
import { montosRouter } from './montos';
import {
  resolveBancoChileClient,
  sealBancoSecrets,
  type BancoChileConfigRow,
} from '@/api/lib/banco-chile-client';
import { resolveSiiEncryptionKeyBytes } from '@/api/lib/sii-crypto';

/**
 * Router principal Banco Chile — config-en-UI via BFF (nunca secretos desde client supabase).
 */
export const bancoChileRoutes = new Hono<{ Variables: AppVariables }>();

// Webhooks bancarios: sin JWT de usuario (verificación HMAC en handler)
bancoChileRoutes.route('/webhook', webhookRouter);

bancoChileRoutes.use('*', authMiddleware, tenantMiddleware);

bancoChileRoutes.get('/config', async (c) => {
  const supabase = c.get('supabase');
  const empresaId = c.get('empresaId');

  const { data, error } = await supabase
    .from('banco_chile_config')
    .select(
      'id, empresa_id, environment, enabled, last_sync, created_at, updated_at, client_id, client_secret, username, password',
    )
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error || !data) {
    return c.json({
      data: {
        config: null,
        hasCredentials: false,
        encryptionReady: Boolean(resolveSiiEncryptionKeyBytes()),
      },
    });
  }

  const row = data as BancoChileConfigRow;
  const { client_id, client_secret, username, password, ...safe } = row;
  return c.json({
    data: {
      config: {
        ...safe,
        hasCredentials: !!(client_id && client_secret && username && password),
      },
      hasCredentials: !!(client_id && client_secret && username && password),
      encryptionReady: Boolean(resolveSiiEncryptionKeyBytes()),
    },
  });
});

bancoChileRoutes.post(
  '/config',
  zValidator(
    'json',
    z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      environment: z.enum(['sandbox', 'production']).default('sandbox'),
      enabled: z.boolean().default(false),
    }),
  ),
  async (c) => {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const body = c.req.valid('json');

    const { data: existing } = await supabase
      .from('banco_chile_config')
      .select('id, client_id, client_secret, username, password')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    const sealed = await sealBancoSecrets({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      username: body.username,
      password: body.password,
    });
    if (!sealed.ok) {
      return c.json(
        {
          code: 'encryption_key_missing',
          message:
            'Falta SII_CLAVE_ENCRYPTION_KEY (≥32). No se guardan secretos Banco Chile en claro en producción.',
        },
        503,
      );
    }

    const payload: Record<string, unknown> = {
      empresa_id: empresaId,
      environment: body.environment,
      enabled: body.enabled,
      updated_at: new Date().toISOString(),
      ...sealed.sealed,
    };

    if (!existing) {
      // First save requires all four fields
      const hasAll =
        sealed.sealed.client_id &&
        sealed.sealed.client_secret &&
        sealed.sealed.username &&
        sealed.sealed.password;
      if (!hasAll) {
        return c.json(
          {
            code: 'credentials_required',
            message: 'Primera configuración: clientId, clientSecret, username y password son requeridos',
          },
          400,
        );
      }
      const { error } = await supabase
        .from('banco_chile_config')
        .insert(payload as {
          empresa_id: string;
          client_id: string;
          client_secret: string;
          username: string;
          password: string;
          environment: string;
          enabled: boolean;
        });
      if (error) {
        return c.json({ code: 'config_insert_failed', message: error.message }, 500);
      }
    } else {
      const { error } = await supabase
        .from('banco_chile_config')
        .update(payload as {
          environment?: string;
          enabled?: boolean;
          client_id?: string;
          client_secret?: string;
          username?: string;
          password?: string;
          updated_at?: string;
        })
        .eq('empresa_id', empresaId);
      if (error) {
        return c.json({ code: 'config_update_failed', message: error.message }, 500);
      }
    }

    return c.json({ data: { success: true } });
  },
);

bancoChileRoutes.get('/checklist', async (c) => {
  const supabase = c.get('supabase');
  const empresaId = c.get('empresaId');

  const { data: cfg } = await supabase
    .from('banco_chile_config')
    .select('id, client_id, client_secret, username, password, environment, enabled, last_sync')
    .eq('empresa_id', empresaId)
    .maybeSingle();

  const hasCreds = Boolean(
    cfg?.client_id && cfg?.client_secret && cfg?.username && cfg?.password,
  );
  const enabled = Boolean(cfg?.enabled);
  const isProd = cfg?.environment === 'production';
  const encryptionReady = Boolean(resolveSiiEncryptionKeyBytes());

  let tokenOk = false;
  if (cfg?.id) {
    const { data: tok } = await supabase
      .from('banco_chile_tokens')
      .select('id, expires_at')
      .eq('config_id', cfg.id)
      .maybeSingle();
    if (tok?.expires_at) {
      tokenOk = new Date(tok.expires_at) > new Date();
    }
  }

  const { count: cuentasCount } = await supabase
    .from('banco_chile_cuentas')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId);

  type Item = {
    id: string;
    titulo: string;
    cumplido: boolean;
    critico: boolean;
    detalle?: string;
  };

  const items: Item[] = [
    {
      id: 'credentials',
      titulo: 'Credenciales OAuth / API store guardadas',
      cumplido: hasCreds,
      critico: true,
      detalle: hasCreds ? 'client + secret + user + pass' : 'Completá el formulario de configuración',
    },
    {
      id: 'encryption',
      titulo: 'Material de cifrado en runtime',
      cumplido: encryptionReady,
      critico: process.env.VERCEL_ENV === 'production',
      detalle: encryptionReady ? 'OK' : 'Set SII_CLAVE_ENCRYPTION_KEY',
    },
    {
      id: 'enabled',
      titulo: 'Integración habilitada',
      cumplido: enabled,
      critico: true,
    },
    {
      id: 'token',
      titulo: 'Token OAuth vigente',
      cumplido: tokenOk,
      critico: true,
      detalle: tokenOk ? 'Token activo' : 'Ejecutá «Probar auth»',
    },
    {
      id: 'cuentas',
      titulo: 'Al menos una cuenta sincronizada',
      cumplido: (cuentasCount ?? 0) > 0,
      critico: false,
      detalle: `${cuentasCount ?? 0} cuenta(s)`,
    },
    {
      id: 'sync',
      titulo: 'Último sync registrado',
      cumplido: Boolean(cfg?.last_sync),
      critico: false,
      detalle: cfg?.last_sync ? String(cfg.last_sync) : 'Sin sync',
    },
    {
      id: 'webhook-secret',
      titulo: 'BANCO_CHILE_WEBHOOK_SECRET en runtime',
      cumplido: Boolean(process.env.BANCO_CHILE_WEBHOOK_SECRET?.trim()),
      critico: false,
      detalle: process.env.BANCO_CHILE_WEBHOOK_SECRET?.trim()
        ? 'HMAC configurado'
        : 'Set en Vercel para notificaciones push',
    },
    {
      id: 'production',
      titulo: 'Ambiente production (API store prod)',
      cumplido: isProd,
      critico: false,
      detalle: `Ambiente: ${cfg?.environment ?? '—'}`,
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;

  return c.json({
    data: {
      listoOperacion: criticosPendientes === 0,
      listoProduccion: criticosPendientes === 0 && isProd,
      criticosPendientes,
      items,
      environment: cfg?.environment ?? null,
      enabled,
    },
  });
});

bancoChileRoutes.post('/auth', async (c) => {
  const supabase = c.get('supabase');
  const empresaId = c.get('empresaId');

  const resolved = await resolveBancoChileClient(supabase, empresaId, {
    requireEnabled: false,
  });
  if (!resolved.ok) {
    return c.json({ code: resolved.code, message: resolved.message }, 400);
  }

  const result = await resolved.client.authenticate();
  if (!result.success) {
    return c.json(
      {
        code: result.error.code,
        message: result.error.message,
      },
      502,
    );
  }

  const row = resolved.config;
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
    return c.json(
      { code: 'token_persist_failed', message: 'Autenticación OK pero falló guardar token' },
      500,
    );
  }

  await supabase
    .from('banco_chile_config')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', row.id);

  return c.json({
    data: {
      success: true,
      expires_at: expiresAt,
      token_type: result.data.token_type,
    },
  });
});

// Mount sub-routers
bancoChileRoutes.route('', bancoChileRouter);
bancoChileRoutes.route('/conciliacion', conciliacionRouter);
bancoChileRoutes.route('/conciliacion-auto', conciliacionAutoRoutes);
bancoChileRoutes.route('/conciliacion-stats', conciliacionStatsRoutes);
bancoChileRoutes.route('/transferencias', transferenciasRouter);
bancoChileRoutes.route('/nominas', nominasRouter);
bancoChileRoutes.route('/documentos', documentosRouter);
bancoChileRoutes.route('/cotizaciones', cotizacionesRouter);
bancoChileRoutes.route('/rentas', rentasRouter);
bancoChileRoutes.route('/montos', montosRouter);
