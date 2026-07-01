import { test, expect } from '@playwright/test';

test.describe('Nucleo Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await page.waitForURL('/');
  });

  test('dashboard loads with metrics', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard"), h1:has-text("Resumen")')).toBeVisible();
    
    // Check for key metric cards
    await expect(page.locator('text=Ventas, text=Ingresos, text=Pedidos')).toBeVisible({ timeout: 10000 });
  });

  test('navigation to caja', async ({ page }) => {
    await page.click('a:has-text("Caja"), nav >> text=Caja, [href*="/caja"]');
    await expect(page).toHaveURL(/\/caja/);
    await expect(page.locator('text=Sesión, text=Apertura, text=Cierre')).toBeVisible();
  });

  test('navigation to comisiones', async ({ page }) => {
    await page.click('a:has-text("Comisiones"), nav >> text=Comisiones, [href*="/comisiones"]');
    await expect(page).toHaveURL(/\/comisiones/);
  });

  test('navigation to sii/facturas', async ({ page }) => {
    await page.click('a:has-text("Facturas"), nav >> text=Facturas, [href*="/facturas"]');
    await expect(page).toHaveURL(/\/facturas/);
  });

  test('navigation to conciliacion bancaria', async ({ page }) => {
    await page.click('a:has-text("Conciliación"), nav >> text=Conciliación, [href*="/conciliacion"]');
    await expect(page).toHaveURL(/\/conciliacion/);
  });
});

test.describe('Caja Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'rep@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await page.waitForURL('/');
    await page.goto('/caja');
  });

  test('open cash session', async ({ page }) => {
    await page.fill('input[name="monto_inicial"], input[placeholder*="inicial"]', '50000');
    await page.click('button:has-text("Abrir"), button:has-text("Iniciar Sesión")');
    await expect(page.locator('text=Sesión abierta, text=Activa, .session-active')).toBeVisible({ timeout: 10000 });
  });

  test('close cash session', async ({ page }) => {
    await page.fill('input[name="monto_final"], input[placeholder*="final"]', '75000');
    await page.click('button:has-text("Cerrar"), button:has-text("Cerrar Sesión")');
    await expect(page.locator('text=Sesión cerrada, text=Cerrada, .session-closed')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Conciliación Bancaria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]:has-text("Iniciar")');
    await page.waitForURL('/');
    await page.goto('/conciliacion');
  });

  test('execute automatic reconciliation', async ({ page }) => {
    await page.click('button:has-text("Ejecutar"), button:has-text("Conciliar automático")');
    
    // Wait for proposals to load
    await expect(page.locator('.proposal-row, [data-testid="proposal"], tbody tr')).toBeVisible({ timeout: 15000 });
    
    // Check for confidence scores
    await expect(page.locator('text=%, text=confianza, .confidence')).toBeVisible();
  });

  test('accept high confidence proposal', async ({ page }) => {
    // First execute to get proposals
    await page.click('button:has-text("Ejecutar")');
    await page.waitForTimeout(2000);
    
    // Click accept on first proposal with high confidence
    const acceptButton = page.locator('button:has-text("Aceptar"), [data-testid="accept-proposal"]').first();
    if (await acceptButton.isVisible({ timeout: 5000 })) {
      await acceptButton.click();
      await expect(page.locator('text=Conciliación creada, text=Exitosa')).toBeVisible({ timeout: 10000 });
    }
  });
});