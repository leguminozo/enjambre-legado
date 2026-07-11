import { test, expect } from '@playwright/test';

/**
 * Smoke estable para CI: no depende de catálogo con productos reales
 * ni de completar un pago.
 */
test.describe('Checkout smoke (CI)', () => {
  test('página /checkout carga formulario de contacto', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    // Formulario o empty-state de carrito vacío — ambos son “página viva”
    const email = page.locator('input[name="email"], input[type="email"]').first();
    const nombre = page.locator('input[name="nombre"], input[name="name"]').first();
    const emptyCart = page.getByText(/carrito vacío|sin productos|vacío/i).first();
    const checkoutHeading = page.getByRole('heading', { name: /checkout|pago|datos/i }).first();

    await expect
      .poll(async () => {
        if (await email.isVisible().catch(() => false)) return 'form';
        if (await nombre.isVisible().catch(() => false)) return 'form';
        if (await emptyCart.isVisible().catch(() => false)) return 'empty';
        if (await checkoutHeading.isVisible().catch(() => false)) return 'heading';
        return 'none';
      }, { timeout: 20_000 })
      .not.toBe('none');
  });

  test('catálogo es alcanzable (precondición del funnel)', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page).toHaveURL(/\/catalogo/);
    // No 404 / error boundary genérico
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });

  test('carrito es alcanzable', async ({ page }) => {
    await page.goto('/carrito');
    await expect(page).toHaveURL(/\/carrito/);
    await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i);
  });
});
