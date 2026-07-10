import { cache } from 'react';
import { getSiteContentBatch } from '@/lib/cms';
import {
  type StoreChromeConfig,
  DEFAULT_STORE_CHROME,
  parseThemeSettings,
  parseAnnouncementSettings,
  parseAnnouncementSlide,
  parseFooterSettings,
  parseFooterSocialItem,
  parsePwaNavSettings,
  parsePwaNavItem,
  parseBrandAssets,
  parseLandingLayout,
  parseCatalogSettings,
  parsePdpSettings,
  parseSeoDefaults,
  parseContactSettings,
  parseCampaignBanner,
  DEFAULT_ANNOUNCEMENT_SLIDES,
  DEFAULT_FOOTER_SOCIAL,
  DEFAULT_PWA_NAV_ITEMS,
} from '@/lib/shop/store-chrome';

export const loadStoreChrome = cache(async function loadStoreChrome(): Promise<StoreChromeConfig> {
  const batch = await getSiteContentBatch([
    'theme_settings',
    'announcement_settings',
    'announcement_slides',
    'footer_settings',
    'footer_social',
    'pwa_nav_settings',
    'pwa_nav_items',
    'brand_assets',
    'landing_layout',
    'catalog_settings',
    'pdp_settings',
    'seo_defaults',
    'contact_settings',
    'campaign_banners',
  ]);

  const theme = parseThemeSettings(
    (batch.theme_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );
  const announcement = parseAnnouncementSettings(
    (batch.announcement_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );

  const slides = (batch.announcement_slides ?? [])
    .map((row) => parseAnnouncementSlide(row.content as Record<string, unknown>))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const footer = parseFooterSettings(
    (batch.footer_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );

  const footerSocial = (batch.footer_social ?? [])
    .map((row) => parseFooterSocialItem(row.content as Record<string, unknown>))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const pwaNav = parsePwaNavSettings(
    (batch.pwa_nav_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );

  const pwaNavItems = (batch.pwa_nav_items ?? [])
    .map((row) => parsePwaNavItem(row.content as Record<string, unknown>))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const brand = parseBrandAssets(
    (batch.brand_assets?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );

  const landing = parseLandingLayout(
    (batch.landing_layout?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );
  const catalog = parseCatalogSettings(
    (batch.catalog_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );
  const pdp = parsePdpSettings(
    (batch.pdp_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );

  const seo = parseSeoDefaults(
    (batch.seo_defaults?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );
  const contact = parseContactSettings(
    (batch.contact_settings?.[0]?.content as Record<string, unknown> | undefined) ?? null,
  );
  const campaignBanners = (batch.campaign_banners ?? [])
    .map((row) => parseCampaignBanner(row.content as Record<string, unknown>))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return {
    theme: batch.theme_settings?.[0] ? theme : DEFAULT_STORE_CHROME.theme,
    announcement: batch.announcement_settings?.[0] ? announcement : DEFAULT_STORE_CHROME.announcement,
    announcementSlides: slides.length > 0 ? slides : DEFAULT_ANNOUNCEMENT_SLIDES,
    footer: batch.footer_settings?.[0] ? footer : DEFAULT_STORE_CHROME.footer,
    footerSocial: footerSocial.length > 0 ? footerSocial : DEFAULT_FOOTER_SOCIAL,
    pwaNav: batch.pwa_nav_settings?.[0] ? pwaNav : DEFAULT_STORE_CHROME.pwaNav,
    pwaNavItems: pwaNavItems.length > 0 ? pwaNavItems : DEFAULT_PWA_NAV_ITEMS,
    brand: batch.brand_assets?.[0] ? brand : DEFAULT_STORE_CHROME.brand,
    landing: batch.landing_layout?.[0] ? landing : DEFAULT_STORE_CHROME.landing,
    catalog: batch.catalog_settings?.[0] ? catalog : DEFAULT_STORE_CHROME.catalog,
    pdp: batch.pdp_settings?.[0] ? pdp : DEFAULT_STORE_CHROME.pdp,
    seo: batch.seo_defaults?.[0] ? seo : DEFAULT_STORE_CHROME.seo,
    contact: batch.contact_settings?.[0] ? contact : DEFAULT_STORE_CHROME.contact,
    campaignBanners,
  };
});
