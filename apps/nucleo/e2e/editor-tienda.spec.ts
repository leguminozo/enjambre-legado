import { test, expect } from '@playwright/test';

/**
 * Smoke del Editor de Tienda con E2E_SKIP_AUTH=1 (middleware).
 * Mockea CMS para no depender de Supabase.
 */

const BRAND_ITEM = {
  id: 'brand-e2e-1',
  section_key: 'brand_assets',
  item_order: 1,
  is_active: true,
  content: {
    logo_url: '/icons/icon-192.svg',
    logo_footer_url: '',
    favicon_url: '/icons/icon-192.svg',
    og_image_url: '',
    logo_height_px: 40,
    logo_max_width_px: 180,
    logo_footer_height_px: 48,
  },
  created_at: null,
  updated_at: null,
};

const MENU_ITEM = {
  id: 'menu-e2e-1',
  section_key: 'menu_settings',
  item_order: 1,
  is_active: true,
  content: {
    show_logo: false,
    logo_src: '',
    logo_height_px: 32,
    show_brand_text: true,
    brand_line1: 'La Obrera',
    brand_line2: 'y el Zángano',
  },
  created_at: null,
  updated_at: null,
};

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

test.describe('Editor de Tienda — smoke Marca', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/cms/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/api/cms/sections') && method === 'GET' && !url.match(/\/sections\/[^/]+$/)) {
        await route.fulfill(
          json({
            data: {
              brand_assets: [BRAND_ITEM],
              menu_settings: [MENU_ITEM],
              theme_settings: [],
              hero: [],
            },
            sections: ['brand_assets', 'menu_settings', 'theme_settings', 'hero'],
          }),
        );
        return;
      }

      if (method === 'PATCH' || method === 'POST') {
        await route.fulfill(json({ data: BRAND_ITEM }));
        return;
      }

      await route.fulfill(json({ data: [] }));
    });
  });

  test('carga shell del editor y sección Marca', async ({ page }) => {
    await page.goto('/editor-tienda');

    await expect(page.getByTestId('editor-tienda-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Editor de Tienda')).toBeVisible();

    // Navegar a bloque Marca (lista con iconos)
    const marcaBtn = page.getByRole('button', { name: /Marca/i }).first();
    if (await marcaBtn.isVisible().catch(() => false)) {
      await marcaBtn.click();
    } else {
      // Mobile chips o label alternativo
      const chip = page.locator('button', { hasText: /Marca|Logos/i }).first();
      if (await chip.count()) await chip.click();
    }

    await expect(
      page.getByText(/Logo header|Subir a la nube|Marca y logos|Tamaño en tienda/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('muestra bloques de la tienda en sidebar', async ({ page }) => {
    await page.goto('/editor-tienda');
    await expect(page.getByTestId('editor-tienda-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Bloques de la tienda|Sección|Tema|Menú/i).first()).toBeVisible();
  });
});
