import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getSiteContentBatch } from '@/lib/cms';
import {
  type HeaderMenuConfig,
  type HeaderNavItem,
  DEFAULT_HEADER_NAV,
  DEFAULT_HEADER_SETTINGS,
  parseHeaderNavItem,
  parseHeaderSettings,
} from '@/lib/shop/header-menu';

export async function fetchHeaderMenuDirect(draft: boolean): Promise<HeaderMenuConfig> {
  const batch = await getSiteContentBatch(
    ['menu_settings', 'menu_links'],
    draft ? { draft: true } : undefined,
  );
  const settingsRow = batch.menu_settings?.[0];
  const settings = parseHeaderSettings(
    (settingsRow?.content as Record<string, unknown> | undefined) ?? null,
  );

  const rawLinks = batch.menu_links ?? [];
  const items: HeaderNavItem[] = [];
  for (const row of rawLinks) {
    const rawContent = (row.content as Record<string, unknown> | undefined) ?? {};
    const parsed = parseHeaderNavItem(rawContent);
    if (parsed) {
      // Si la fila DB nunca tuvo la clave 'children' (DB legacy sin migrar),
      // aplicamos los subenlaces canónicos por defecto.
      // Si 'children' existe en la BD (incluyendo [] vacío si el operador los eliminó),
      // se respeta estrictamente lo guardado en el CMS.
      const hasExplicitChildren = 'children' in rawContent;
      if (!hasExplicitChildren) {
        const canonical = DEFAULT_HEADER_NAV.find((d) => d.href === parsed.href);
        if (canonical?.children && canonical.children.length > 0) {
          parsed.children = canonical.children;
        }
      }
      items.push(parsed);
    }
  }

  // Si los enlaces de BD no incluyen Inicio ('/'), asegurar Inicio al principio
  if (items.length > 0 && !items.some((i) => i.href === '/')) {
    items.unshift({
      label: 'Inicio',
      label_en: 'Home',
      href: '/',
      show_desktop: true,
      show_mobile: true,
    });
  }

  return {
    settings: settingsRow ? settings : DEFAULT_HEADER_SETTINGS,
    items: items.length > 0 ? items : DEFAULT_HEADER_NAV,
  };
}

const getCachedHeaderMenu = unstable_cache(
  async () => fetchHeaderMenuDirect(false),
  ['header_menu_parsed'],
  { revalidate: 300, tags: ['header_menu', 'site_content'] },
);

/** Carga menú CMS (menu_settings + menu_links) con fallbacks y caché optimizada. */
export const loadHeaderMenu = cache(async function loadHeaderMenu(
  opts?: { draft?: boolean },
): Promise<HeaderMenuConfig> {
  if (opts?.draft) {
    return fetchHeaderMenuDirect(true);
  }
  // Desarrollo/test: sin caché para ver el CMS al recargar (en producción
  // rige ISR 300s + revalidación bajo demanda vía /api/cms/revalidate).
  if (process.env.NODE_ENV !== 'production') {
    return fetchHeaderMenuDirect(false);
  }
  return getCachedHeaderMenu();
});
