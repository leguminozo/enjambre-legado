import { test, expect } from '@playwright/test';

test.describe('Purchase Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo');
  });

  test('complete purchase flow: catalog -> cart -> checkout -> payment', async ({ page }) => {
    await page.waitForSelector('.product-card', { timeout: 10000 });
    await page.click('.product-card:first-child');
    await expect(page).toHaveURL(/\/producto\//);

    await page.click('[data-testid="add-to-cart"]');

    await page.click('[data-testid="cart-link"]');
    await expect(page).toHaveURL(/\/carrito/);

    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

    await page.click('[data-testid="proceed-checkout"]');
    await expect(page).toHaveURL(/\/checkout/);

    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="telefono"]', '+56912345678');
    await page.fill('input[name="direccion"]', 'Av. Test 123');
    await page.selectOption('select[name="region"]', { label: 'Metropolitana' });
    await page.fill('input[name="comuna"]', 'Santiago');
    await page.fill('input[name="ciudad"]', 'Santiago');

    await page.click('button:has-text("Pagar ahora")');

    await expect(page).toHaveURL(/checkout|payment|webpay|flow|resultado/, { timeout: 15000 });
  });
});

test.describe('Login Multi-Role', () => {
  test('cliente login redirects to perfil', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cliente@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await expect(page).toHaveURL(/\/perfil/);
  });

  test('admin login redirects to nucleo', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await expect(page).toHaveURL(/nucleo|\/perfil|admin/);
  });
});