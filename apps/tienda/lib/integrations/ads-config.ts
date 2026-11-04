import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/admin';

export interface PublicAdsConfig {
  metaAds: {
    enabled: boolean;
    pixelId: string;
    hasCapiToken: boolean;
    testEventCode?: string;
  };
  googleAds: {
    enabled: boolean;
    adsId: string;
    purchaseLabel?: string;
  };
}

export interface MetaCapiServerConfig {
  enabled: boolean;
  pixelId: string;
  token: string;
  testEventCode?: string;
  graphVersion: string;
}

interface RawIntegrationRow {
  key: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

async function fetchAdsConfigDirect(): Promise<{
  metaRow: RawIntegrationRow | null;
  googleRow: RawIntegrationRow | null;
}> {
  try {
    const admin = createAdminClient();
    if (!admin) {
      return { metaRow: null, googleRow: null };
    }

    const queryPromise = Promise.resolve(
      admin
        .from('integrations')
        .select('key, enabled, config')
        .in('key', ['meta_ads', 'google_ads']),
    );

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
      timer = setTimeout(
        () => resolve({ data: null, error: { message: 'Timeout fetching ads config' } }),
        2500,
      );
    });

    const result = await Promise.race([
      queryPromise.finally(() => {
        if (timer) clearTimeout(timer);
      }),
      timeoutPromise,
    ]);

    const data = result.data as RawIntegrationRow[] | null;
    const error = result.error;

    if (error || !data) {
      return { metaRow: null, googleRow: null };
    }

    const meta = data.find((r) => r.key === 'meta_ads');
    const google = data.find((r) => r.key === 'google_ads');

    return {
      metaRow: meta
        ? {
            key: meta.key,
            enabled: Boolean(meta.enabled),
            config: (meta.config as Record<string, unknown>) || {},
          }
        : null,
      googleRow: google
        ? {
            key: google.key,
            enabled: Boolean(google.enabled),
            config: (google.config as Record<string, unknown>) || {},
          }
        : null,
    };
  } catch (err) {
    console.warn('[ads-config] Error al consultar tabla integrations:', err);
    return { metaRow: null, googleRow: null };
  }
}

const getCachedAdsConfig = unstable_cache(
  async () => {
    return fetchAdsConfigDirect();
  },
  ['integrations_ads_config'],
  { revalidate: 3600, tags: ['integrations', 'layout', 'store_chrome'] },
);

async function loadAdsConfig(): Promise<{
  metaRow: RawIntegrationRow | null;
  googleRow: RawIntegrationRow | null;
}> {
  if (process.env.NODE_ENV !== 'production') {
    return fetchAdsConfigDirect();
  }
  return getCachedAdsConfig();
}

export async function getPublicAdsConfig(): Promise<PublicAdsConfig> {
  const { metaRow, googleRow } = await loadAdsConfig();

  const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';
  const envMetaToken = process.env.META_CAPI_TOKEN?.trim() || '';
  const envAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';
  const envPurchaseLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim() || '';

  // Meta Ads
  let metaPixelId = envPixel;
  let metaHasCapi = Boolean(envMetaToken);
  let metaEnabled = Boolean(envPixel);
  let metaTestCode: string | undefined = undefined;

  if (metaRow) {
    const dbPixel = typeof metaRow.config.pixel_id === 'string' ? metaRow.config.pixel_id.trim() : '';
    const dbToken = typeof metaRow.config.capi_token === 'string' ? metaRow.config.capi_token.trim() : '';
    const dbTest = typeof metaRow.config.test_event_code === 'string' ? metaRow.config.test_event_code.trim() : '';

    if (dbPixel) metaPixelId = dbPixel;
    if (dbToken) metaHasCapi = true;
    if (dbTest) metaTestCode = dbTest;

    // Respetar kill-switch de la base de datos
    metaEnabled = Boolean(metaRow.enabled && metaPixelId);
  }

  // Google Ads
  let googleAdsId = envAdsId;
  let googlePurchaseLabel: string | undefined = envPurchaseLabel || undefined;
  let googleEnabled = Boolean(envAdsId);

  if (googleRow) {
    const dbAds = typeof googleRow.config.ads_id === 'string' ? googleRow.config.ads_id.trim() : '';
    const dbLabel = typeof googleRow.config.purchase_label === 'string' ? googleRow.config.purchase_label.trim() : '';

    if (dbAds) googleAdsId = dbAds;
    if (dbLabel) googlePurchaseLabel = dbLabel;

    // Respetar kill-switch de la base de datos
    googleEnabled = Boolean(googleRow.enabled && googleAdsId);
  }

  return {
    metaAds: {
      enabled: metaEnabled,
      pixelId: metaPixelId,
      hasCapiToken: metaHasCapi,
      testEventCode: metaTestCode,
    },
    googleAds: {
      enabled: googleEnabled,
      adsId: googleAdsId,
      purchaseLabel: googlePurchaseLabel,
    },
  };
}

export async function getMetaCapiServerConfig(): Promise<MetaCapiServerConfig> {
  const { metaRow } = await loadAdsConfig();

  const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || '';
  const envToken = process.env.META_CAPI_TOKEN?.trim() || '';
  const envVersion = process.env.META_GRAPH_VERSION?.trim() || 'v21.0';

  if (!metaRow) {
    const pixelId = envPixel;
    const token = envToken;
    return {
      enabled: Boolean(pixelId && token),
      pixelId,
      token,
      graphVersion: envVersion,
    };
  }

  const dbPixel = typeof metaRow.config.pixel_id === 'string' ? metaRow.config.pixel_id.trim() : '';
  const dbToken = typeof metaRow.config.capi_token === 'string' ? metaRow.config.capi_token.trim() : '';
  const dbTest = typeof metaRow.config.test_event_code === 'string' ? metaRow.config.test_event_code.trim() : '';

  const pixelId = dbPixel || envPixel;
  const token = dbToken || envToken;

  return {
    enabled: Boolean(metaRow.enabled && pixelId && token),
    pixelId,
    token,
    testEventCode: dbTest || undefined,
    graphVersion: envVersion,
  };
}
