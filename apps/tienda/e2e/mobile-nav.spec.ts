import { test, expect } from '@playwright/test';

test.describe('Mobile navigation — burger', () => {
  // locale es-CL: el contexto fresco de Playwright llega en en-US (Accept-
  // Language) y next-intl resuelve el idioma del header antes que la cookie.
  test.use({ viewport: { width: 390, height: 844 }, locale: 'es-CL' });

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
    await expect(panel.getByRole('link', { name: /creaciones|creations/i })).toBeVisible();

    // El selector de idioma en el burger depende de menu_settings.show_lang_selector
    // (CMS): si la tienda lo tiene desactivado, el toggle no aplica y se salta.
    const langButton = panel.getByRole('button', { name: /english|spanish/i });
    if ((await langButton.count()) === 0) {
      test.skip(true, 'menu_settings.show_lang_selector=false en esta tienda');
      return;
    }

    await langButton.click();
    await page.reload();
    await page.getByRole('button', { name: /open menu/i }).click();
    await expect(panel.getByRole('link', { name: /creations/i })).toBeVisible();
  });

  test('bottom nav no aparece en navegador móvil (solo PWA)', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.locator('.tienda-bottom-nav')).toHaveCount(0);
  });
});