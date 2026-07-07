import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  buildApplePassJson,
  buildGoogleSavePayload,
  isAppleSigningConfigured,
  isGoogleWalletConfigured,
  isGoogleWalletSigningReady,
  signWalletQrToken,
  toStampProgressView,
  verifyWalletQrToken,
  type StampProgressRow,
  type WalletGuardianSnapshot,
} from '@enjambre/wallet';
import { authMiddleware } from '@/api/lib/middleware';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/api/lib/ratelimit';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveUserFromToken(token: string | null) {
  if (!token) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function loadWalletSnapshot(userId: string): Promise<WalletGuardianSnapshot | null> {
  const admin = createAdminClient();

  const [profileRes, tierRes, puntosRes, progressRes] = await Promise.all([
    admin.from('profiles').select('full_name, email').eq('id', userId).maybeSingle(),
    admin.from('user_tier_view').select('tier, ciclos_historicos').eq('user_id', userId).maybeSingle(),
    admin
      .from('puntos_fidelizacion')
      .select('puntos')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('guardian_stamp_progress')
      .select(
        'program_id, unidades_acumuladas, unidades_canjeadas, guardian_stamp_programs(id, producto_id, nombre, unidades_requeridas, unidad_gratis, wallet_label, imagen_url, productos(nombre))',
      )
      .eq('user_id', userId),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const programs = (progressRes.data ?? []).map((row) => {
    const rawProg = row.guardian_stamp_programs as unknown;
    const prog = (Array.isArray(rawProg) ? rawProg[0] : rawProg) as Record<string, unknown> | null | undefined;
    const stampRow: StampProgressRow = {
      program_id: row.program_id as string,
      unidades_acumuladas: row.unidades_acumuladas as number,
      unidades_canjeadas: row.unidades_canjeadas as number,
      program: prog
        ? {
            id: prog.id as string,
            producto_id: prog.producto_id as string,
            nombre: prog.nombre as string,
            unidades_requeridas: prog.unidades_requeridas as number,
            unidad_gratis: prog.unidad_gratis as number,
            wallet_label: (prog.wallet_label as string | null) ?? null,
            imagen_url: (prog.imagen_url as string | null) ?? null,
            producto_nombre: (prog.productos as { nombre?: string } | null)?.nombre ?? null,
          }
        : undefined,
    };
    return toStampProgressView(stampRow);
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return {
    userId,
    displayName: profile.full_name ?? profile.email?.split('@')[0] ?? 'Guardián',
    tier: (tierRes.data?.tier as string) ?? 'OBRERA',
    ciclos: Number(tierRes.data?.ciclos_historicos ?? 0),
    puntos: Number(puntosRes.data?.puntos ?? 0),
    programs,
  };
}

export const walletRoutes = new Hono();

function walletCapabilities() {
  const appleCerts = isAppleSigningConfigured({
    certBase64: process.env.APPLE_PASS_CERT_P12_BASE64,
    teamId: process.env.APPLE_TEAM_IDENTIFIER,
    passTypeId: process.env.APPLE_PASS_TYPE_IDENTIFIER,
  });
  const passSecret = Boolean(process.env.WALLET_PASS_SECRET?.trim());
  const googleEnv = {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_WALLET_PRIVATE_KEY,
    serviceAccountJson: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON,
  };

  return {
    apple: {
      available: appleCerts && passSecret,
      reason: appleCerts && passSecret
        ? null
        : 'Configura APPLE_PASS_CERT_P12_BASE64, APPLE_TEAM_IDENTIFIER y WALLET_PASS_SECRET',
    },
    google: {
      available: isGoogleWalletSigningReady(googleEnv),
      configured: isGoogleWalletConfigured(googleEnv),
      reason: isGoogleWalletSigningReady(googleEnv)
        ? null
        : 'Configura GOOGLE_WALLET_ISSUER_ID, service account y clave privada para Save to Wallet',
    },
    qr: {
      available: true,
      reason: null as string | null,
    },
  };
}

walletRoutes.get('/capabilities', async (c) => {
  return c.json(walletCapabilities());
});

walletRoutes.get('/stamps', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? null;
  const user = await resolveUserFromToken(token);
  if (!user) return c.json({ code: 'unauthorized' }, 401);

  const snapshot = await loadWalletSnapshot(user.id);
  if (!snapshot) return c.json({ code: 'not_found' }, 404);

  return c.json({ snapshot });
});

walletRoutes.get('/apple/download', async (c) => {
  const identifier = getClientIdentifier(c);
  const rl = await checkRateLimit({ identifier: `wallet:${identifier}`, limit: 10, window: '1 h' });
  if (!rl.success) return c.json({ code: 'rate_limited' }, 429);

  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? null;
  const user = await resolveUserFromToken(token);
  if (!user) return c.json({ code: 'unauthorized' }, 401);

  const snapshot = await loadWalletSnapshot(user.id);
  if (!snapshot) return c.json({ code: 'not_found' }, 404);

  const qrSecret = process.env.WALLET_QR_SIGNING_SECRET ?? 'oyz-wallet-dev';
  const qrPayload = `guardian://scan?tok=${signWalletQrToken(user.id, qrSecret)}`;
  const serialNumber = `oyz-${user.id}`;
  const authToken = createHash('sha256')
    .update(`${user.id}:${process.env.WALLET_PASS_SECRET ?? 'dev-pass-secret'}`)
    .digest('hex')
    .slice(0, 32);

  const passJson = buildApplePassJson(snapshot, serialNumber, {
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER ?? 'pass.cl.oyz.guardian',
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER ?? 'TEAMID',
    organizationName: 'La Obrera y el Zángano',
    description: 'Guardian del Bosque',
    foregroundColor: 'rgb(212, 160, 23)',
    backgroundColor: 'rgb(10, 61, 47)',
    logoText: 'OYZ',
    webServiceURL: process.env.NEXT_PUBLIC_NUCLEO_API_URL
      ? `${process.env.NEXT_PUBLIC_NUCLEO_API_URL}/api/wallet/apple`
      : undefined,
    authenticationToken: authToken,
  }, qrPayload);

  const caps = walletCapabilities();
  if (!caps.apple.available) {
    return c.json({
      ok: false,
      code: 'wallet_apple_unavailable',
      message: caps.apple.reason,
      preview: process.env.NODE_ENV === 'development' ? { pass: passJson, qrPayload } : undefined,
    }, 503);
  }

  return c.json({
    ok: false,
    code: 'wallet_apple_signing_pending',
    message: 'Certificados detectados; pipeline de firma .pkpass en implementación',
    preview: process.env.NODE_ENV === 'development' ? { pass: passJson, qrPayload } : undefined,
  }, 503);
});

walletRoutes.post('/google/save-link', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? null;
  const user = await resolveUserFromToken(token);
  if (!user) return c.json({ code: 'unauthorized' }, 401);

  const snapshot = await loadWalletSnapshot(user.id);
  if (!snapshot) return c.json({ code: 'not_found' }, 404);

  const googleEnv = {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_WALLET_PRIVATE_KEY,
    serviceAccountJson: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON,
  };

  if (!isGoogleWalletSigningReady(googleEnv)) {
    return c.json({
      ok: false,
      code: 'wallet_google_unavailable',
      configured: isGoogleWalletConfigured(googleEnv),
      message: walletCapabilities().google.reason,
      payload: process.env.NODE_ENV === 'development'
        ? buildGoogleSavePayload(snapshot, googleEnv.issuerId ?? 'issuer_stub')
        : undefined,
    }, 503);
  }

  return c.json({
    ok: false,
    code: 'wallet_google_signing_pending',
    message: 'Service account listo; falta implementar firma JWT de Google Wallet',
  }, 503);
});

const QrResolveSchema = z.object({ token: z.string().min(16) });

walletRoutes.post('/qr/resolve', zValidator('json', QrResolveSchema), async (c) => {
  const rl = await rateLimitMiddleware(c);
  if (rl) return rl;

  const secret = process.env.WALLET_QR_SIGNING_SECRET ?? 'oyz-wallet-dev';
  const verified = verifyWalletQrToken(c.req.valid('json').token, secret);
  if (!verified.ok) {
    return c.json({ code: verified.reason, message: 'QR inválido o expirado' }, 400);
  }

  const snapshot = await loadWalletSnapshot(verified.userId);
  if (!snapshot) return c.json({ code: 'not_found' }, 404);

  return c.json({
    ok: true,
    userId: verified.userId,
    displayName: snapshot.displayName,
    tier: snapshot.tier,
    programs: snapshot.programs,
  });
});

walletRoutes.post('/apple/register', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const deviceLibraryIdentifier = String(body.deviceLibraryIdentifier ?? '');
  const pushToken = body.pushToken ? String(body.pushToken) : null;
  const serialNumber = String(body.serialNumber ?? `oyz-${user.id}`);

  const admin = createAdminClient();
  const authToken = createHash('sha256')
    .update(`${user.id}:${process.env.WALLET_PASS_SECRET ?? 'dev-pass-secret'}`)
    .digest('hex')
    .slice(0, 32);

  await admin.from('wallet_pass_registrations').upsert(
    {
      user_id: user.id,
      platform: 'apple',
      serial_number: serialNumber,
      pass_type_identifier: process.env.APPLE_PASS_TYPE_IDENTIFIER ?? 'pass.cl.oyz.guardian',
      authentication_token: authToken,
      device_library_identifier: deviceLibraryIdentifier || null,
      push_token: pushToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'platform,serial_number,device_library_identifier' },
  );

  return c.json({ ok: true });
});

async function rateLimitMiddleware(c: {
  req: { header: (name: string) => string | undefined; ip?: string };
  json: (data: unknown, status: number) => Response;
}) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...RATE_LIMIT_CONFIGS.api });
  if (!result.success) {
    return c.json({ code: 'rate_limited', message: 'Demasiadas solicitudes' }, 429);
  }
  return null;
}