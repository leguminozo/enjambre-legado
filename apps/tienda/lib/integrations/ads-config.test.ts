import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPublicAdsConfig, getMetaCapiServerConfig } from './ads-config';

// Mock del cliente admin de Supabase
vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/utils/supabase/admin';

describe('ads-config module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('degrada a variables de entorno cuando no hay registros en base de datos', async () => {
    vi.mocked(createAdminClient).mockReturnValue(null);
    process.env.NEXT_PUBLIC_META_PIXEL_ID = 'pixel-env-123';
    process.env.META_CAPI_TOKEN = 'capi-env-token';
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = 'AW-999888';
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL = 'label-env';

    const publicConfig = await getPublicAdsConfig();
    expect(publicConfig.metaAds.enabled).toBe(true);
    expect(publicConfig.metaAds.pixelId).toBe('pixel-env-123');
    expect(publicConfig.metaAds.hasCapiToken).toBe(true);
    expect(publicConfig.googleAds.enabled).toBe(true);
    expect(publicConfig.googleAds.adsId).toBe('AW-999888');
    expect(publicConfig.googleAds.purchaseLabel).toBe('label-env');

    const serverConfig = await getMetaCapiServerConfig();
    expect(serverConfig.enabled).toBe(true);
    expect(serverConfig.pixelId).toBe('pixel-env-123');
    expect(serverConfig.token).toBe('capi-env-token');
  });

  it('respeta kill-switch enabled=false de la base de datos aun con credenciales presentes', async () => {
    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                key: 'meta_ads',
                enabled: false,
                config: { pixel_id: 'db-pixel', capi_token: 'db-token' },
              },
              {
                key: 'google_ads',
                enabled: false,
                config: { ads_id: 'AW-db-123', purchase_label: 'db-label' },
              },
            ],
            error: null,
          }),
        }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as unknown as ReturnType<typeof createAdminClient>);

    const publicConfig = await getPublicAdsConfig();
    expect(publicConfig.metaAds.enabled).toBe(false);
    expect(publicConfig.metaAds.pixelId).toBe('db-pixel');
    expect(publicConfig.googleAds.enabled).toBe(false);
    expect(publicConfig.googleAds.adsId).toBe('AW-db-123');

    const serverConfig = await getMetaCapiServerConfig();
    expect(serverConfig.enabled).toBe(false);
    expect(serverConfig.pixelId).toBe('db-pixel');
    expect(serverConfig.token).toBe('db-token');
  });

  it('habilita correctamente cuando enabled=true con configuración en base de datos', async () => {
    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                key: 'meta_ads',
                enabled: true,
                config: {
                  pixel_id: '123456789',
                  capi_token: 'EAA123token',
                  test_event_code: 'TEST999',
                },
              },
              {
                key: 'google_ads',
                enabled: true,
                config: {
                  ads_id: 'AW-555444333',
                  purchase_label: 'purchase-label-xyz',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as unknown as ReturnType<typeof createAdminClient>);

    const publicConfig = await getPublicAdsConfig();
    expect(publicConfig.metaAds.enabled).toBe(true);
    expect(publicConfig.metaAds.pixelId).toBe('123456789');
    expect(publicConfig.metaAds.hasCapiToken).toBe(true);
    expect(publicConfig.metaAds.testEventCode).toBe('TEST999');
    expect(publicConfig.googleAds.enabled).toBe(true);
    expect(publicConfig.googleAds.adsId).toBe('AW-555444333');
    expect(publicConfig.googleAds.purchaseLabel).toBe('purchase-label-xyz');

    const serverConfig = await getMetaCapiServerConfig();
    expect(serverConfig.enabled).toBe(true);
    expect(serverConfig.pixelId).toBe('123456789');
    expect(serverConfig.token).toBe('EAA123token');
    expect(serverConfig.testEventCode).toBe('TEST999');
  });
});
