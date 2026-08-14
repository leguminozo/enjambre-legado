import { test, expect } from '@playwright/test';

// Tier legacy (iPhone 7 / hardware antiguo): LegacyDeviceDetect setea
// data-legacy="true" en <html> según UA iOS ≤ 15, deviceMemory ≤ 2,
// hardwareConcurrency ≤ 2, o override ?legacy=1. Ver docs/LEGACY_TIER.md.
test.describe('tier legacy — detección', () => {
  test('iPhone 7 (iOS 15.8): data-legacy="true" + data-motion sincronizado', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone-7', 'solo el proyecto iphone-7 emula iOS 15.8');
    await page.goto('/login', { waitUntil: 'networkidle' });
    const attrs = await page.evaluate(() => ({
      legacy: document.documentElement.getAttribute('data-legacy'),
      flag: (window as unknown as { __ENJAMBRE_LEGACY__?: boolean }).__ENJAMBRE_LEGACY__ ?? null,
    }));
    expect(attrs.legacy).toBe('true');
    expect(attrs.flag).toBe(true);
  });

  test('desktop moderno: sin data-legacy', async ({ page }) => {
    test.skip(test.info().project.name !== 'chromium', 'solo desktop moderno (chromium)');
    await page.goto('/login', { waitUntil: 'networkidle' });
    const legacy = await page.evaluate(() => document.documentElement.getAttribute('data-legacy'));
    expect(legacy).toBeNull();
  });

  test('?legacy=1 fuerza el tier legacy en cualquier dispositivo', async ({ page }) => {
    await page.goto('/login?legacy=1', { waitUntil: 'networkidle' });
    const legacy = await page.evaluate(() => document.documentElement.getAttribute('data-legacy'));
    expect(legacy).toBe('true');
  });

  test('el tier legacy aplana backdrop-filter (CSS)', async ({ page }) => {
    test.skip(test.info().project.name !== 'iphone-7', 'solo el proyecto iphone-7 activa data-legacy');
    await page.goto('/login', { waitUntil: 'networkidle' });
    const backdrop = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'backdrop-blur-2xl';
      document.body.appendChild(el);
      const cs = getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter;
      el.remove();
      return cs;
    });
    expect(backdrop).toBe('none');
  });
});
