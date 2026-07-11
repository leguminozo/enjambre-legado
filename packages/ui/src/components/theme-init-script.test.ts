import { describe, expect, it } from 'vitest';
import { themeInitScript } from './theme-init-script';

describe('themeInitScript', () => {
  it('incluye storage key y default dark', () => {
    const src = themeInitScript('enjambre-nucleo-theme', 'dark', true);
    expect(src).toContain('enjambre-nucleo-theme');
    expect(src).toContain('localStorage');
    expect(src).toContain('classList');
    expect(src).toContain('prefers-color-scheme');
  });

  it('respeta forcedTheme', () => {
    const src = themeInitScript('enjambre-theme', 'system', true, 'dark');
    expect(src).toContain('"dark"');
  });
});
