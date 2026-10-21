import { test, expect } from '@playwright/test';

/**
 * Estudio Editorial — cadena de salida.
 *
 * Verifica el recorrido completo: tokens → render de lámina → composición →
 * export. No mira el diseño: mira que la pieza sale con las medidas y el
 * formato pedidos.
 */

function pngSize(buffer: Buffer): { width: number; height: number } {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test.describe('Estudio Editorial — Salida de la pieza', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/estudio-rrss');
    await expect(page.locator('text=Alcance y Salida')).toBeVisible({ timeout: 30000 });
  });

  test('ofrece los tres alcances de movimiento', async ({ page }) => {
    for (const label of ['Estático', 'Elegante', 'Rupturista']) {
      await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeVisible();
    }
  });

  test('el alcance estático no ofrece video', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Estático/ })).toBeVisible();
    await expect(page.locator('button:has-text("MP4")')).toHaveCount(0);
  });

  test('el alcance elegante ofrece video', async ({ page }) => {
    await page.getByRole('button', { name: /^Elegante/ }).first().click();
    await expect(page.getByRole('button', { name: /^MP4/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^WebM/ })).toBeVisible();
  });

  test('exporta la lámina en PNG con las medidas del formato 4:5', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar PNG/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    expect(buffer.subarray(1, 4).toString()).toBe('PNG');
    expect(pngSize(buffer)).toEqual({ width: 1080, height: 1350 });
  });

  test('exporta la receta con la semilla de la pieza', async ({ page }) => {
    await page.locator('button:has-text("Receta")').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar Receta/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.recipe\.json$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const recipe = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    expect(recipe.marca).toBe('Enjambre Legado');
    expect(recipe.alcance).toBe('estatico');
    expect(recipe.proporcion).toBe('4:5');
    expect(typeof recipe.semilla).toBe('number');
    expect(typeof recipe.checksum).toBe('string');
    expect(recipe.laminas.length).toBeGreaterThan(0);
  });

  test('exporta el modelo editable de la pieza', async ({ page }) => {
    await page.locator('button:has-text("Modelo")').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar Modelo/ }).click();
    const download = await downloadPromise;

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const model = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    expect(model.laminas.length).toBeGreaterThan(0);
    expect(model.laminas[0]).toHaveProperty('blocks');
    expect(model.laminas[0]).toHaveProperty('title');
  });

  test('exporta la pieza en video MP4', async ({ page }) => {
    test.setTimeout(180_000);

    await page.getByRole('button', { name: /^Elegante/ }).first().click();
    await page.getByRole('button', { name: /^MP4/ }).click();

    const downloadPromise = page.waitForEvent('download', { timeout: 180_000 });
    await page.getByRole('button', { name: /Exportar MP4/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.mp4$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    expect(buffer.length).toBeGreaterThan(1024);
    expect(buffer.subarray(4, 8).toString()).toBe('ftyp');
  });
});
