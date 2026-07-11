import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HEADER_SETTINGS,
  headerSettingsToCssVars,
  mergeHeaderSettings,
  parseHeaderNavItem,
  parseHeaderSettings,
  resolveNavLabel,
} from './header-menu';

describe('parseHeaderSettings', () => {
  it('defaults si null', () => {
    expect(parseHeaderSettings(null).layout).toBe(DEFAULT_HEADER_SETTINGS.layout);
  });

  it('legacy menu_format burger → force_burger_desktop', () => {
    const s = parseHeaderSettings({ menu_format: 'burger' });
    expect(s.force_burger_desktop).toBe(true);
    expect(s.layout).toBe('classic');
  });

  it('clampa alturas y parsea letter_spacing CSS', () => {
    const s = parseHeaderSettings({
      height_mobile_px: 10,
      letter_spacing: '0.25em',
      button_gap: '2rem',
    });
    expect(s.height_mobile_px).toBe(48); // min
    expect(s.nav_letter_spacing_em).toBeCloseTo(0.25);
    expect(s.nav_item_gap_px).toBe(32);
  });
});

describe('parseHeaderNavItem / resolveNavLabel', () => {
  it('rechaza href inválido', () => {
    expect(parseHeaderNavItem({ label: 'x', href: 'https://evil.com' })).toBeNull();
    expect(parseHeaderNavItem({ label: 'x', href: '//evil' })).toBeNull();
  });

  it('acepta ruta interna', () => {
    const item = parseHeaderNavItem({ label: 'Inicio', href: '/', label_en: 'Home' });
    expect(item?.href).toBe('/');
    expect(resolveNavLabel(item!, 'en')).toBe('Home');
    expect(resolveNavLabel(item!, 'es')).toBe('Inicio');
  });
});

describe('headerSettingsToCssVars / mergeHeaderSettings', () => {
  it('emite CSS vars de header', () => {
    const vars = headerSettingsToCssVars(DEFAULT_HEADER_SETTINGS);
    expect(vars['--tienda-header-h']).toBe(`${DEFAULT_HEADER_SETTINGS.height_mobile_px}px`);
    expect(vars['--tienda-nav-transform']).toBe('uppercase');
  });

  it('mergeHeaderSettings equivale a parse', () => {
    const raw = { show_logo: true, logo_src: '/x.png' };
    expect(mergeHeaderSettings(raw).show_logo).toBe(true);
    expect(mergeHeaderSettings(raw).logo_src).toBe('/x.png');
  });
});
