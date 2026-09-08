import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME_SETTINGS,
  parseThemeSettings,
  themeToCssVars,
} from './store-chrome';

describe('theme-settings (@enjambre/shop-chrome)', () => {
  it('DEFAULT_THEME_SETTINGS tiene definidos todos los tokens de tema (acento, fondos, superficies, textos)', () => {
    expect(DEFAULT_THEME_SETTINGS.accent_h).toBe(44);
    expect(DEFAULT_THEME_SETTINGS.accent_s).toBe(85);
    expect(DEFAULT_THEME_SETTINGS.accent_l).toBe(46);

    // Fondos canónicos
    expect(DEFAULT_THEME_SETTINGS.bg_dark_h).toBe(0);
    expect(DEFAULT_THEME_SETTINGS.bg_dark_s).toBe(0);
    expect(DEFAULT_THEME_SETTINGS.bg_dark_l).toBe(3);

    expect(DEFAULT_THEME_SETTINGS.bg_light_h).toBe(35);
    expect(DEFAULT_THEME_SETTINGS.bg_light_s).toBe(60);
    expect(DEFAULT_THEME_SETTINGS.bg_light_l).toBe(97);

    // Superficies y textos
    expect(DEFAULT_THEME_SETTINGS.surface_dark_l).toBe(7);
    expect(DEFAULT_THEME_SETTINGS.surface_light_l).toBe(100);
    expect(DEFAULT_THEME_SETTINGS.text_dark_l).toBe(93);
    expect(DEFAULT_THEME_SETTINGS.text_light_l).toBe(7);
  });

  it('parseThemeSettings rellena defaults si recibe null o un objeto vacío', () => {
    const empty = parseThemeSettings({});
    expect(empty.bg_dark_h).toBe(DEFAULT_THEME_SETTINGS.bg_dark_h);
    expect(empty.bg_dark_l).toBe(DEFAULT_THEME_SETTINGS.bg_dark_l);
    expect(empty.bg_light_h).toBe(DEFAULT_THEME_SETTINGS.bg_light_h);
    expect(empty.bg_light_l).toBe(DEFAULT_THEME_SETTINGS.bg_light_l);

    const fromNull = parseThemeSettings(null);
    expect(fromNull.bg_dark_h).toBe(0);
    expect(fromNull.bg_light_h).toBe(35);
  });

  it('parseThemeSettings parsea y acota valores personalizados correctamente', () => {
    const custom = parseThemeSettings({
      accent_h: 167,
      accent_s: 40,
      accent_l: 35,
      bg_dark_h: 167,
      bg_dark_s: 45,
      bg_dark_l: 6,
      bg_light_h: 40,
      bg_light_s: 30,
      bg_light_l: 95,
      surface_dark_l: 10,
      text_dark_l: 96,
    });

    expect(custom.accent_h).toBe(167);
    expect(custom.bg_dark_h).toBe(167);
    expect(custom.bg_dark_s).toBe(45);
    expect(custom.bg_dark_l).toBe(6);
    expect(custom.bg_light_h).toBe(40);
    expect(custom.surface_dark_l).toBe(10);
    expect(custom.text_dark_l).toBe(96);
  });

  it('themeToCssVars emite todas las variables semánticas para la tienda', () => {
    const vars = themeToCssVars(DEFAULT_THEME_SETTINGS);

    expect(vars['--accent']).toBe('44 85% 46%');
    expect(vars['--accent-text']).toBeDefined();
    expect(vars['--accent-text-light']).toBeDefined();

    expect(vars['--tienda-bg-dark']).toBe('0 0% 3%');
    expect(vars['--tienda-bg-light']).toBe('35 60% 97%');
    expect(vars['--tienda-surface-dark']).toBeDefined();
    expect(vars['--tienda-surface-light']).toBeDefined();
    expect(vars['--tienda-card-dark']).toBeDefined();
    expect(vars['--tienda-card-light']).toBeDefined();
    expect(vars['--tienda-text-dark']).toBe('35 60% 93%');
    expect(vars['--tienda-text-light']).toBe('0 0% 7%');
  });
});
