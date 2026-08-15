import { test, expect, type Page } from '@playwright/test';

async function openStoreBurger(page: Page) {
  await page.goto('/catalogo', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header.tienda-shop-header')).toBeVisible();
  const consent = page.getByRole('button', {
    name: /aceptar todas|accept all|solo esenciales|essential only/i,
  });
  if (await consent.first().isVisible().catch(() => false)) {
    await consent.first().click();
  }
  const menuButton = page.getByRole('button', { name: /abrir menú|open menu/i });
  const panel = page.locator('#tienda-mobile-nav-panel');
  await expect(menuButton).toBeVisible();
  // El burger es toggle: solo clicar si el panel aún no está. Reintentar
  // cubre el clic previo a la hidratación de ShopHeader.
  await expect(async () => {
    if (!(await panel.isVisible().catch(() => false))) {
      await menuButton.click();
    }
    await expect(panel).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 12_000 });
}

test.describe('Mobile navigation — burger', () => {
  // locale es-CL: el contexto fresco de Playwright llega en en-US (Accept-
  // Language) y next-intl resuelve el idioma del header antes que la cookie.
  test.use({ viewport: { width: 390, height: 844 }, locale: 'es-CL' });

  test('abre panel opaco con enlaces y cierra con backdrop', async ({ page }) => {
    await openStoreBurger(page);

    const panel = page.locator('#tienda-mobile-nav-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: /creaciones|creations/i })).toBeVisible();
    await expect(panel.getByRole('link', { name: /contacto|contact/i })).toBeVisible();

    const backdrop = page.getByRole('button', { name: /cerrar menú|close menu/i }).first();
    await backdrop.click();
    await expect(panel).toBeHidden();
  });

  test('toggle locale desde burger cambia labels', async ({ page }) => {
    await openStoreBurger(page);

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
    await page.goto('/catalogo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header.tienda-shop-header')).toBeVisible();
    await expect(page.locator('.tienda-bottom-nav')).toHaveCount(0);
  });
});

test.describe('Mobile navigation — iPhone 8 375×667', () => {
  test.use({ viewport: { width: 375, height: 667 }, locale: 'es-CL' });

  test('el último enlace del burger es alcanzable (no recortado)', async ({ page }) => {
    await openStoreBurger(page);

    const panel = page.locator('#tienda-mobile-nav-panel');
    await expect(panel).toBeVisible();

    const scroller = panel.locator('.tienda-mobile-nav-scroll');
    await expect(scroller).toBeVisible();

    const overflowY = await scroller.evaluate((el) => getComputedStyle(el).overflowY);
    expect(['auto', 'scroll']).toContain(overflowY);

    const last = scroller.getByRole('link').last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();

    const box = await last.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(667 + 2);
  });

  test('la marca del header no se recorta con overflow hidden', async ({ page }) => {
    await page.goto('/catalogo', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('header.tienda-shop-header')).toBeVisible();
    const logo = page.locator('header.tienda-shop-header a[href="/"]').first();
    await expect(logo).toBeVisible();
    const overflow = await logo.evaluate((el) => getComputedStyle(el).overflow);
    expect(overflow).not.toBe('hidden');
  });
});