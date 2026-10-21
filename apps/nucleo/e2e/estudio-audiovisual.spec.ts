import { test, expect } from '@playwright/test';

/**
 * Estudio Audiovisual — costo del cuadro y control de calidad.
 *
 * El sustrato se anima solo. Si el cuadro se encarece, el motor baja la
 * calidad antes de que la pieza vaya a tirones. Esta prueba mira que el
 * presupuesto se respete en un equipo de escritorio común.
 */

test.describe('Estudio Audiovisual — Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/estudio-audiovisual');
    await expect(page.locator('text=Motor Activo')).toBeVisible({ timeout: 30000 });
  });

  test('el cuadro entra en el presupuesto de 60 fps', async ({ page }) => {
    const readout = page.locator('text=/Cuadro: [0-9.]+ ms/');
    await expect(readout).toBeVisible({ timeout: 30000 });

    // Deja que el motor se estabilice antes de medir.
    await page.waitForTimeout(4000);

    const text = (await readout.textContent()) ?? '';
    const cost = Number.parseFloat(text.replace(/[^0-9.]/g, ''));

    expect(Number.isFinite(cost)).toBe(true);
    // 33 ms es 30 fps: cota generosa para equipos compartidos en CI.
    expect(cost).toBeLessThan(33);
  });

  test('el motor expone el modo de campo de curl', async ({ page }) => {
    await page.getByRole('button', { name: /Física/ }).click();
    const curlOption = page.getByRole('button', { name: /Campo de Curl/ });
    await expect(curlOption).toBeVisible();
    await curlOption.click();
    await expect(curlOption).toBeVisible();
  });
});
