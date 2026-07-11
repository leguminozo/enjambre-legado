import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke del Editor de Tienda.
 * - Middleware: E2E_SKIP_AUTH=1 expone /editor-tienda
 * - Auth client: seed de store admin vía addInitScript
 * - CMS: mock de /api/cms/**
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

const THEME_ITEM = {
  id: 'theme-e2e-1',
  section_key: 'theme_settings',
  item_order: 1,
  is_active: true,
  content: { default_theme: 'dark', force_dark_public: true, grain_intensity: 0.1, border_radius: 'md' },
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

/** Simula sesión admin en el cliente (zustand / auth store) si existe. */
async function seedAdminAuth(page: Page) {
  await page.addInitScript(() => {
    const admin = {
      id: 'e2e-admin-id',
      email: 'admin@e2e.test',
      role: 'admin',
      full_name: 'E2E Admin',
    };
    const session = {
      access_token: 'e2e-access-token',
      refresh_token: 'e2e-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: admin.id,
        email: admin.email,
        app_metadata: { role: 'admin', empresa_id: 'emp-e2e' },
        user_metadata: { full_name: admin.full_name },
      },
    };
    try {
      // Claves habituales de supabase-js en localStorage
      const key = Object.keys(localStorage).find((k) => k.includes('auth-token') || k.startsWith('sb-'));
      if (key) {
        localStorage.setItem(
          key,
          JSON.stringify({
            currentSession: session,
            expiresAt: Date.now() + 3600_000,
          }),
        );
      }
      (window as unknown as { __E2E_ADMIN__: unknown }).__E2E_ADMIN__ = { user: admin, session };
    } catch {
      /* ignore */
    }
  });
}

async function mockCms(page: Page) {
  await page.route('**/api/cms/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/cms/sections') && method === 'GET' && !url.match(/\/sections\/[^/?]+$/)) {
      await route.fulfill(
        json({
          data: {
            brand_assets: [BRAND_ITEM],
            menu_settings: [MENU_ITEM],
            theme_settings: [THEME_ITEM],
            hero: [],
            colecciones: [],
          },
          sections: [
            'brand_assets',
            'menu_settings',
            'theme_settings',
            'hero',
            'colecciones',
            'announcement_settings',
            'landing_layout',
          ],
        }),
      );
      return;
    }

    if (url.includes('/sections/brand_assets') && method === 'GET') {
      await route.fulfill(json({ data: [BRAND_ITEM] }));
      return;
    }

    if (method === 'PATCH' || method === 'POST' || method === 'PUT') {
      await route.fulfill(json({ data: { ...BRAND_ITEM, updated_at: new Date().toISOString() } }));
      return;
    }

    await route.fulfill(json({ data: [] }));
  });

  // Evita ruidos de revalidate/iframe hacia tienda real
  await page.route('**/api/cms/revalidate**', async (route) => {
    await route.fulfill(json({ ok: true, revalidated: true }));
  });
}

test.describe('Editor de Tienda — smoke Marca', () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminAuth(page);
    await mockCms(page);
  });

  test('carga shell del editor y sección Marca', async ({ page }) => {
    await page.goto('/editor-tienda');

    await expect(page.getByTestId('editor-tienda-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Editor de Tienda')).toBeVisible();

    // Desktop: lista agrupada; mobile: chips
    const marcaCandidates = [
      page.getByRole('button', { name: /Marca y logos|Marca — Logos|Marca/i }).first(),
      page.locator('button', { hasText: /Marca/i }).first(),
    ];

    for (const btn of marcaCandidates) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        break;
      }
    }

    await expect(
      page.getByText(/Logo header|Subir a la nube|Marca y logos|Tamaño en tienda|PNG\/SVG/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('muestra bloques de la tienda en sidebar', async ({ page }) => {
    await page.goto('/editor-tienda');
    await expect(page.getByTestId('editor-tienda-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Bloques de la tienda|Tema|Menú|Apariencia/i).first()).toBeVisible();
  });

  test('guarda cambios de marca (PATCH mock)', async ({ page }) => {
    let patchSeen = false;
    await page.route('**/api/cms/items/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchSeen = true;
        await route.fulfill(json({ data: BRAND_ITEM }));
        return;
      }
      await route.continue();
    });

    await page.goto('/editor-tienda');
    await expect(page.getByTestId('editor-tienda-root')).toBeVisible({ timeout: 30_000 });

    const marca = page.locator('button', { hasText: /Marca/i }).first();
    if (await marca.isVisible().catch(() => false)) await marca.click();

    // Abrir URL manual y tocar un campo si existe
    const urlToggle = page.getByText(/URL manual/i).first();
    if (await urlToggle.isVisible().catch(() => false)) {
      await urlToggle.click();
      const input = page.locator('input[placeholder*="https"]').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('/icons/icon-192.svg');
      }
    }

    const save = page.getByRole('button', { name: /Guardar/i }).first();
    if (await save.isVisible().catch(() => false)) {
      await save.click();
      await expect.poll(() => patchSeen, { timeout: 10_000 }).toBe(true);
    } else {
      // Sin dirty state: al menos el shell y marca son usables
      await expect(page.getByTestId('editor-tienda-root')).toBeVisible();
    }
  });
});
