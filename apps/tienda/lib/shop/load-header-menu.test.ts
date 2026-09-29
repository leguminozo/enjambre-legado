import { describe, expect, it, vi } from 'vitest';
import { fetchHeaderMenuDirect } from './load-header-menu';
import type { SiteContentRow } from '@/lib/cms';

vi.mock('@/lib/cms', () => ({
  getSiteContentBatch: vi.fn(),
}));

import { getSiteContentBatch } from '@/lib/cms';

describe('fetchHeaderMenuDirect', () => {
  it('respeta children: [] cuando el operador elimina los subenlaces en CMS', async () => {
    vi.mocked(getSiteContentBatch).mockResolvedValueOnce({
      menu_settings: [],
      menu_links: [
        {
          id: '1',
          section_key: 'menu_links',
          item_order: 1,
          is_active: true,
          content: {
            label: 'Inicio',
            href: '/',
            show_desktop: true,
            show_mobile: true,
          },
        } as SiteContentRow,
        {
          id: '2',
          section_key: 'menu_links',
          item_order: 2,
          is_active: true,
          content: {
            label: 'Club Legado',
            href: '/club-legado-del-bosque',
            show_desktop: true,
            show_mobile: true,
            children: [], // El operador borró todos los subenlaces
          },
        } as SiteContentRow,
      ],
    });

    const result = await fetchHeaderMenuDirect(false);
    const club = result.items.find((i) => i.href === '/club-legado-del-bosque');

    expect(club).toBeDefined();
    // No debe revivir los 4 subenlaces por defecto
    expect(club?.children).toBeUndefined();
  });

  it('aplica canonical.children solo en filas legacy sin clave children', async () => {
    vi.mocked(getSiteContentBatch).mockResolvedValueOnce({
      menu_settings: [],
      menu_links: [
        {
          id: '1',
          section_key: 'menu_links',
          item_order: 1,
          is_active: true,
          content: {
            label: 'Inicio',
            href: '/',
          },
        } as SiteContentRow,
        {
          id: '2',
          section_key: 'menu_links',
          item_order: 2,
          is_active: true,
          content: {
            label: 'Experiencias',
            href: '/experiencias',
            // Sin propiedad 'children' (DB antigua pre-dropdowns)
          },
        } as SiteContentRow,
      ],
    });

    const result = await fetchHeaderMenuDirect(false);
    const exp = result.items.find((i) => i.href === '/experiencias');

    expect(exp).toBeDefined();
    // Debe aplicar los subenlaces canónicos por compatibilidad legacy
    expect(exp?.children?.length).toBeGreaterThan(0);
  });

  it('preserva subenlaces personalizados cuando existen', async () => {
    vi.mocked(getSiteContentBatch).mockResolvedValueOnce({
      menu_settings: [],
      menu_links: [
        {
          id: '1',
          section_key: 'menu_links',
          item_order: 1,
          is_active: true,
          content: {
            label: 'Inicio',
            href: '/',
          },
        } as SiteContentRow,
        {
          id: '2',
          section_key: 'menu_links',
          item_order: 2,
          is_active: true,
          content: {
            label: 'Club Legado',
            href: '/club-legado-del-bosque',
            children: [
              {
                label: 'Subenlace Personalizado',
                href: '/club-legado-del-bosque/custom',
              },
            ],
          },
        } as SiteContentRow,
      ],
    });

    const result = await fetchHeaderMenuDirect(false);
    const club = result.items.find((i) => i.href === '/club-legado-del-bosque');

    expect(club).toBeDefined();
    expect(club?.children).toHaveLength(1);
    expect(club?.children?.[0].label).toBe('Subenlace Personalizado');
  });
});
