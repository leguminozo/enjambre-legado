import { test, expect } from '@playwright/test';

/**
 * Smoke estable: rutas públicas / setup sin depender de sesión POS real.
 * Con E2E_SKIP_AUTH=1 (playwright.config webServer) también se valida /pos shell.
 * pos.spec.ts existente requiere login con credenciales de test (no CI por defecto).
 */
test.describe('Campo smoke (CI)', () => {
  test('login es alcanzable', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"], input[name="password"]').first();
    await expect(email.or(password).first()).toBeVisible({ timeout: 20_000 });
  });

  test('ruta /pos sin sesión redirige o muestra login (sin skip)', async ({ page }) => {
    // Con E2E_SKIP_AUTH=1 el middleware deja pasar /pos — se cubre en test siguiente.
    // Este test solo garantiza que no hay 500 en la transición.
    await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    expect(/\/login|\/pos|\/setup-error/.test(url)).toBe(true);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });

  test('home no es 500', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status() ?? 200).toBeLessThan(500);
  });

  test('POS shell con E2E_SKIP_AUTH no es 500', async ({ page }) => {
    const res = await page.goto('/pos');
    await page.waitForLoadState('domcontentloaded');
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
    // CI webServer setea E2E_SKIP_AUTH=1 → /pos; sin envs → setup-error; fallback login
    expect(/\/pos|\/setup-error|\/login/.test(page.url())).toBe(true);
  });
});
