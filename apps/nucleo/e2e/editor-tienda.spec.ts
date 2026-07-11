import { test, expect } from '@playwright/test';

/**
 * Smoke sin login completo: el editor es admin-only.
 * Anónimo debe ir a /login (no filtrar existencia de la ruta).
 */
test.describe('Editor de Tienda — guards', () => {
  test('anónimo en /editor-tienda redirige a login', async ({ page }) => {
    await page.goto('/editor-tienda');
    await expect(page).toHaveURL(/\/login/);
  });

  test('ruta está en shell de app (no 404 hard)', async ({ page }) => {
    const res = await page.goto('/editor-tienda');
    // Redirect a login = 200/302 chain; no 404 de Next
    expect(res?.status()).not.toBe(404);
    await expect(page).toHaveURL(/\/login/);
  });
});
