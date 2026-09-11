import { test, expect } from '@playwright/test';

// Regresión del login en pantallas chicas (bug reportado en iPhone 7):
// 1) `min-h-[var(--vh-full)]` (sintaxis v3) debe generar CSS y el main debe
//    llenar el viewport — con la forma v4 `min-h-(--vh-full)` no se generaba
//    CSS en Tailwind 3 y el layout colapsaba.
// 2) El bottom sheet de email debe tener max-height móvil + overflow-y-auto:
//    sin eso, el teclado tapa el botón "Entrar" en iPhone 7 y no hay scroll
//    (los botones "no existen").
test.describe('login viewport móvil (iPhone 7 375x667)', () => {
  test('botones visibles y main llenando el viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const m = await page.evaluate(() => {
      const main = document.querySelector('main');
      const cs = main ? getComputedStyle(main) : null;
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => {
        const r = b.getBoundingClientRect();
        return {
          text: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          inViewport: r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0,
        };
      });
      return {
        mainMinHeight: cs?.minHeight,
        mainHeight: main ? Math.round(main.getBoundingClientRect().height) : 0,
        viewport: innerHeight,
        buttons,
      };
    });

    expect(m).not.toBeNull();
    // El min-height aplica (antes del fix: 0px → layout colapsado).
    expect(parseFloat(m!.mainMinHeight ?? '0')).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.mainHeight).toBeGreaterThanOrEqual(m!.viewport);
    // Debe existir al menos un botón de acceso visible en el viewport.
    expect(m!.buttons.some((b) => b.inViewport)).toBe(true);
  });

  test('formulario directo: inputs y botón de acceso visibles inmediatamente en viewport móvil', async ({ page }) => {
    // Consentimiento precargado para evitar que el banner tape la vista
    await page.addInitScript(() => {
      const state = {
        essential: true,
        analytics: true,
        marketing: true,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      document.cookie = `preference-consent=${encodeURIComponent(JSON.stringify(state))}; Path=/; SameSite=Lax`;
    });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // Formulario directo: campos de email y password visibles sin necesidad de modales ni sheets
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Comprobar que no hay modales ni sheets flotantes
    const sheets = await page.locator('.fixed.inset-x-0.bottom-0').count();
    expect(sheets).toBe(0);
  });
});
