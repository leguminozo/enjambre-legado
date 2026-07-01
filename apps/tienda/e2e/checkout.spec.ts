import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo');
  });

  test('should navigate to checkout from product page', async ({ page }) => {
    await page.click('.product-card:first-child');
    await expect(page).toHaveURL(/\/producto\//);

    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-link"]');
    await expect(page).toHaveURL(/\/carrito/);

    await page.click('[data-testid="proceed-checkout"]');
    await expect(page).toHaveURL('/checkout');
  });

  test('should display checkout form', async ({ page }) => {
    await page.goto('/checkout');

    await expect(page.locator('input[name="nombre"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="telefono"]')).toBeVisible();
    await expect(page.locator('input[name="region"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout');

    await page.click('button:has-text("Pagar ahora")');
    await expect(page.locator('text=Nombre requerido')).toBeVisible();
  });

  test('should calculate total correctly', async ({ page }) => {
    await page.click('.product-card:first-child');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-link"]');
    await page.click('[data-testid="proceed-checkout"]');

    const totalElement = page.locator('[data-testid="checkout-total"]');
    await expect(totalElement).toBeVisible();

    const totalText = await totalElement.textContent();
    expect(totalText).toMatch(/\$\d{1,3}(?:\.\d{3})*(?:\.\d{3})?/);
  });
});

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/es');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on catalog page', async ({ page }) => {
    await page.goto('/catalogo');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on checkout page', async ({ page }) => {
    await page.goto('/checkout');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/es');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast',
    );
    expect(colorContrastViolations).toEqual([]);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/catalogo');

    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusable);
  });
});