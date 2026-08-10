import { NextRequest, NextResponse } from 'next/server';
import { getSecretsPresenceForIntegrationKey } from '@/lib/integrations-env';
import { resolveMetaAdsMode } from '@/lib/integrations/meta-ads';
import { getMetaCapiConfig } from '@/lib/tracking/meta/capi';

/**
 * GET /api/integrations/status — estado de integraciones para el dashboard de
 * Núcleo. Auth interna (Bearer CMS_REVALIDATE_SECRET || INTERNAL_API_SECRET,
 * timing-safe; en dev sin secret permite preview local).
 * Expone SOLO presencia booleana de secretos — nunca valores.
 */

const INTEGRATION_KEYS = ['meta_ads', 'sii', 'bancos', 'notificaciones', 'boletas'] as const;

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function GET(req: NextRequest) {
  const configured =
    process.env.CMS_REVALIDATE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    '';

  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  const isDev = process.env.NODE_ENV === 'development';
  if (configured) {
    if (!bearer || !timingSafeEqualString(bearer, configured)) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  } else if (!isDev) {
    return NextResponse.json(
      { ok: false, error: 'CMS_REVALIDATE_SECRET o INTERNAL_API_SECRET no configurado' },
      { status: 503 },
    );
  }

  const presence = Object.fromEntries(
    INTEGRATION_KEYS.map((key) => [key, getSecretsPresenceForIntegrationKey(key)]),
  );
  const metaCapi = getMetaCapiConfig();

  return NextResponse.json({
    ok: true,
    presence,
    metaAds: {
      hasPixelId: Boolean(metaCapi.pixelId),
      mode: resolveMetaAdsMode(),
    },
  });
}
