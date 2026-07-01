import { test, expect } from '@playwright/test';

test.describe('Campo POS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'rep@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await page.waitForURL('/');
  });

  test('quick sale flow - 4 taps', async ({ page }) => {
    await page.goto('/pos');
    
    // Wait for POS grid
    await page.waitForSelector('[data-testid="pos-grid"], .product-grid, .pos-products, .grid', { timeout: 10000 });
    
    // Tap 1: Select product
    await page.click('[data-testid="product-item"]:first-child, .product-item:first-child, .product-card:first-child');
    
    // Tap 2: Quantity (if needed) - just click again or use quick add
    // Tap 3: Add to sale
    await page.click('button:has-text("Agregar"), button:has-text("Vender"), [data-testid="quick-sale"]');
    
    // Tap 4: Complete sale
    await page.click('button:has-text("Cobrar"), button:has-text("Finalizar"), [data-testid="complete-sale"]');
    
    // Verify sale completed
    await expect(page.locator('text=Venta completada, text=Éxito, .success, text=Ticket')).toBeVisible({ timeout: 10000 });
  });

  test('cash session open/close', async ({ page }) => {
    await page.goto('/pos/caja');
    
    // Open session
    await page.fill('input[name="monto_inicial"], input[placeholder*="inicial"]', '50000');
    await page.click('button:has-text("Abrir"), button:has-text("Iniciar")');
    await expect(page.locator('text=Abierta, text=Activa, .session-open')).toBeVisible({ timeout: 10000 });
    
    // Close session
    await page.fill('input[name="monto_final"], input[placeholder*="final"]', '75000');
    await page.click('button:has-text("Cerrar"), button:has-text("Cerrar Sesión")');
    await expect(page.locator('text=Cerrada, text=Cierre exitoso')).toBeVisible({ timeout: 10000 });
  });

  test('client lookup', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForSelector('[data-testid="pos-grid"], .product-grid', { timeout: 10000 });
    
    // Click client lookup
    await page.click('button:has-text("Cliente"), button:has-text("Buscar"), [data-testid="client-lookup"]');
    
    // Search for client
    await page.fill('input[placeholder*="buscar"], input[placeholder*="Buscar"], input[name="search"]', 'Test');
    await page.keyboard.press('Enter');
    
    // Select client
    await page.click('[data-testid="client-result"]:first-child, .client-result:first-child');
    
    // Verify client selected
    await expect(page.locator('text=Test, .selected-client')).toBeVisible({ timeout: 5000 });
  });

  test('leaderboard visible', async ({ page }) => {
    await page.goto('/pos');
    await expect(page.locator('text=Ranking, text=Líderes, .leaderboard')).toBeVisible({ timeout: 10000 });
  });
});