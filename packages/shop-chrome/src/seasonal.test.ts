import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SEASONAL_SETTINGS,
  parseSeasonalSettings,
  parseSeasonalOverrides,
} from './seasonal';

describe('parseSeasonalSettings (defensivo)', () => {
  it('null/undefined → árbol vacío completo', () => {
    const out = parseSeasonalSettings(null);
    expect(out.primavera.message_es).toBe('');
    expect(out.verano.floraciones).toBe('');
    expect(out.invierno.label_es).toBe('');
  });

  it('descarta shapes inválidos y saneja strings', () => {
    const out = parseSeasonalSettings({
      verano: { message_es: 42, label_es: 'Verano' },
      otono: 'no-objeto',
      invierno: { message_es: 'x'.repeat(900) },
    });
    expect(out.verano.label_es).toBe('Verano');
    expect(out.verano.message_es).toBe('');
    expect(out.otono.message_es).toBe('');
    expect(out.invierno.message_es.length).toBe(600);
  });

  it('no muta el default singleton entre llamadas', () => {
    const first = parseSeasonalSettings({ verano: { message_es: 'Cosecha activa' } });
    expect(first.verano.message_es).toBe('Cosecha activa');
    const second = parseSeasonalSettings(null);
    expect(second.verano.message_es).toBe('');
    expect(DEFAULT_SEASONAL_SETTINGS.verano.message_es).toBe('');
  });
});

describe('parseSeasonalOverrides', () => {
  it('solo emite campos no vacíos', () => {
    const out = parseSeasonalOverrides(
      parseSeasonalSettings({
        verano: { label_es: 'Verano Austral', message_en: 'Harvest active' },
      }),
    );
    expect(out.verano?.label).toBe('Verano Austral');
    expect(out.verano?.message_en).toBe('Harvest active');
    expect(out.verano?.message).toBeUndefined();
    expect(out.primavera).toBeUndefined();
  });

  it('floraciones string → array limpio', () => {
    const out = parseSeasonalOverrides(
      parseSeasonalSettings({ primavera: { floraciones: ' Ulmo, tiaca ,, Meli ' } }),
    );
    expect(out.primavera?.floraciones).toEqual(['Ulmo', 'tiaca', 'Meli']);
  });

  it('todo vacío → sin overrides', () => {
    expect(parseSeasonalOverrides(parseSeasonalSettings(null))).toEqual({});
  });
});
