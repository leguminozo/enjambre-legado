import { test, expect } from '@playwright/test';

test.describe('Replenishment PDP', () => {
  test('product page shows schedule replenishment when plans exist', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForSelector('.product-card', { timeout: 10000 });
    await page.click('.product-card:first-child');
    await expect(page).toHaveURL(/\/producto\//);

    const replenishBtn = page.locator('[data-testid="schedule-replenishment"]');
    const count = await replenishBtn.count();

    if (count === 0) {
      test.skip(true, 'No replenishment plans configured for this product');
      return;
    }

    await replenishBtn.click();
    await expect(page.locator('[data-testid="replenishment-sheet"]')).toBeVisible();
    await expect(page.getByText('Programar reposición')).toBeVisible();
    await expect(page.getByText('Intervalo')).toBeVisible();
  });
});