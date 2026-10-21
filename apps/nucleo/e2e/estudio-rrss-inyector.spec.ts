import { test, expect } from '@playwright/test';

/**
 * Estudio Editorial — Inyector de Datos Duros.
 *
 * Guarda contra el orden de hooks: el modal se montaba con un `useMemo`
 * después del early return, así que al abrirlo React abortaba el árbol con
 * "Rendered more hooks than during the previous render".
 *
 * La ruta `/estudio-rrss` abre sin sesión bajo `E2E_SKIP_AUTH=1`
 * (ver `middleware.ts`), por eso esta prueba no siembra sesión: la del
 * middleware es la que manda.
 */

test.describe('Estudio Editorial — Inyector de Datos Duros', () => {
  test('abrir el modal no viola el orden de hooks ni rompe el estudio', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`);
    });

    await page.goto('/estudio-rrss');
    await expect(page.getByRole('button', { name: /Herramientas/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole('button', { name: /Herramientas/i }).first().click();
    const menuItem = page.getByText(/Inyector de Datos Duros/i).first();
    await expect(menuItem).toBeVisible({ timeout: 10_000 });
    await menuItem.click();
    await page.waitForTimeout(2500);

    const hookErrors = errors.filter((e) =>
      /Rendered (more|fewer) hooks|change in the order of Hooks/i.test(e),
    );
    expect(hookErrors, `violación de orden de hooks:\n${hookErrors.join('\n')}`).toHaveLength(0);

    const crashed = await page.getByText(/Algo salió mal/i).count();
    expect(crashed, 'el estudio cayó en el error boundary').toBe(0);

    const modalOpen = await page.getByText(/Inyector Din[aá]mico de Datos/i).count();
    expect(modalOpen, 'el modal no llegó a montarse').toBeGreaterThan(0);
  });
});
