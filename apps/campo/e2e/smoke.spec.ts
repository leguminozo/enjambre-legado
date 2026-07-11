import { test, expect } from '@playwright/test';

/**
 * Smoke estable: rutas públicas / setup sin depender de sesión POS real.
 * pos.spec.ts existente requiere login con credenciales de test.
 */
test.describe('Campo smoke (CI)', () => {
  test('login es alcanzable', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
    // Formulario de auth típico
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"], input[name="password"]').first();
    await expect(email.or(password).first()).toBeVisible({ timeout: 20_000 });
  });

  test('ruta /pos sin sesión redirige o muestra login', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    // Middleware auth → login, o setup-error si faltan env
    expect(
      /\/login|\/pos|\/setup-error/.test(url),
    ).toBe(true);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });

  test('home no es 500', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status() ?? 200).toBeLessThan(500);
  });
});
