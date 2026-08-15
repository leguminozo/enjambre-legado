import { test, expect } from '@playwright/test';

// Regresión del hero de la landing: el min-height debe aplicar (100svh móvil / 100dvh desktop).
// Bug histórico: `min-h-(--vh-full)` (sintaxis Tailwind v4) no genera CSS en Tailwind v3
// → el hero colapsaba a banda corta (min-height: 0px) con vacío abajo.
test.describe('hero landing viewport', () => {
  test('desktop: hero llena el viewport (100dvh)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const m = await page.evaluate(() => {
      const hero = document.querySelector('main section');
      if (!hero) return null;
      const cs = getComputedStyle(hero);
      const r = hero.getBoundingClientRect();
      return {
        minHeight: cs.minHeight,
        height: Math.round(r.height),
        viewport: innerHeight,
        eyebrow: Boolean(document.querySelector('.hero-eyebrow')),
        title: Boolean(document.querySelector('.hero-title')),
      };
    });

    expect(m).not.toBeNull();
    // getComputedStyle resuelve 100dvh a píxeles; lo relevante es que el min-height
    // aplique (antes del fix: 0px → hero colapsado a banda corta).
    expect(parseFloat(m!.minHeight)).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.height).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.eyebrow).toBe(true);
    expect(m!.title).toBe(true);
  });

  test('mobile: hero llena el viewport (100svh)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const m = await page.evaluate(() => {
      const hero = document.querySelector('main section');
      if (!hero) return null;
      const cs = getComputedStyle(hero);
      const r = hero.getBoundingClientRect();
      return {
        minHeight: cs.minHeight,
        height: Math.round(r.height),
        viewport: innerHeight,
        cta: Boolean(document.querySelector('main section a')),
      };
    });

    expect(m).not.toBeNull();
    expect(parseFloat(m!.minHeight)).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.height).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.cta).toBe(true);
  });

  test('iPhone 8: hero llena svh y monta canvas de abejas', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hero = page.locator('main section').first();
    await expect(hero).toBeVisible();

    const m = await page.evaluate(() => {
      const section = document.querySelector('main section');
      if (!section) return null;
      const cs = getComputedStyle(section);
      const r = section.getBoundingClientRect();
      return {
        minHeight: cs.minHeight,
        height: Math.round(r.height),
        viewport: innerHeight,
      };
    });
    expect(m).not.toBeNull();
    expect(parseFloat(m!.minHeight)).toBeGreaterThanOrEqual(m!.viewport);
    expect(m!.height).toBeGreaterThanOrEqual(m!.viewport);

    const legacy = await page.locator('html[data-legacy="true"]').count();
    if (legacy) {
      // iOS ≤15 (proyecto iphone-7): BeeCanvas no monta; la atmósfera cubre.
      await expect(page.locator('.hero-atmosphere')).toBeVisible();
      return;
    }
    await expect(page.getByTestId('bee-canvas')).toBeVisible({ timeout: 8000 });
  });
});
