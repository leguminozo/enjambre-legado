import { test, expect } from '@playwright/test';

test.describe('Route guards — tienda shell', () => {
  test('anónimo en /perfil redirige a login con returnTo', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toMatch(/returnTo=%2Fperfil|returnTo=\/perfil/);
  });

  test('anónimo en /perfil/creador redirige a login (no filtra existencia de ruta)', async ({ page }) => {
    await page.goto('/perfil/creador');
    await expect(page).toHaveURL(/\/login/);
  });

  test('anónimo en /perfil/mayorista redirige a login', async ({ page }) => {
    await page.goto('/perfil/mayorista');
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('returnTo');
  });

  test('anónimo en /perfil/pedidos redirige a login', async ({ page }) => {
    await page.goto('/perfil/pedidos');
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('returnTo');
  });

  test('rutas públicas permanecen accesibles sin sesión', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page).toHaveURL(/\/catalogo/);

    await page.goto('/contacto');
    await expect(page).toHaveURL(/\/contacto/);
  });

  test('login no expone returnTo malicioso en redirect loop', async ({ page }) => {
    await page.goto('/login?returnTo=//evil.example');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('evil.example');
  });
});

test.describe('Route guards — locale cookie', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('burger muestra labels según locale en cookie', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'en',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/catalogo');
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(page.locator('#tienda-mobile-nav-panel')).toBeVisible();
    await expect(page.getByRole('link', { name: /^creations$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^contact$/i })).toBeVisible();
  });
});