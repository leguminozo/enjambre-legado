import { test, expect } from '@playwright/test';

test.describe('Mobile navigation — burger', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('abre panel opaco con enlaces y cierra con backdrop', async ({ page }) => {
    await page.goto('/catalogo');
    const menuButton = page.getByRole('button', { name: /abrir menú|open menu/i });
    await menuButton.click();

    const panel = page.locator('#tienda-mobile-nav-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: /creaciones|creations/i })).toBeVisible();
    await expect(panel.getByRole('link', { name: /contacto|contact/i })).toBeVisible();

    const backdrop = page.getByRole('button', { name: /cerrar menú|close menu/i }).first();
    await backdrop.click();
    await expect(panel).toBeHidden();
  });

  test('toggle locale desde burger cambia labels', async ({ page }) => {
    await page.goto('/catalogo');
    await page.getByRole('button', { name: /abrir menú|open menu/i }).click();

    const panel = page.locator('#tienda-mobile-nav-panel');
    await expect(panel.getByRole('link', { name: /creaciones/i })).toBeVisible();

    await panel.getByRole('button', { name: /english/i }).click();
    await page.reload();
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(panel.getByRole('link', { name: /creations/i })).toBeVisible();
  });

  test('bottom nav no aparece en navegador móvil (solo PWA)', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.locator('.tienda-bottom-nav')).toHaveCount(0);
  });
});