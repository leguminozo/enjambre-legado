import { cache } from 'react';
import { getSiteContentBatch } from '@/lib/cms';
import {
  type HeaderMenuConfig,
  type HeaderNavItem,
  DEFAULT_HEADER_NAV,
  DEFAULT_HEADER_SETTINGS,
  parseHeaderNavItem,
  parseHeaderSettings,
} from '@/lib/shop/header-menu';

/** Carga menú CMS (menu_settings + menu_links) con fallbacks. */
export const loadHeaderMenu = cache(async function loadHeaderMenu(): Promise<HeaderMenuConfig> {
  const batch = await getSiteContentBatch(['menu_settings', 'menu_links']);
  const settingsRow = batch.menu_settings?.[0];
  const settings = parseHeaderSettings(
    (settingsRow?.content as Record<string, unknown> | undefined) ?? null,
  );

  const rawLinks = batch.menu_links ?? [];
  const items: HeaderNavItem[] = [];
  for (const row of rawLinks) {
    const parsed = parseHeaderNavItem(row.content as Record<string, unknown>);
    if (parsed) items.push(parsed);
  }

  return {
    settings: settingsRow ? settings : DEFAULT_HEADER_SETTINGS,
    items: items.length > 0 ? items : DEFAULT_HEADER_NAV,
  };
});
